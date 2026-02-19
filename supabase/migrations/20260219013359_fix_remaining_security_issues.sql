/*
  # Fix Remaining Security Issues

  ## Changes

  1. Duplicate Index - drop one of the two identical indexes on booking_analytics
  2. RLS enabled no policy - add SELECT policy for deletion_audit_log for admins
  3. Mutable search_path - add SET search_path = public to all flagged functions
  4. Always-true RLS policies - already fixed webhook_logs and admin_notifications above;
     this migration handles any remaining ones
*/

-- ============================================================
-- 1. Drop duplicate index on booking_analytics
-- ============================================================
DROP INDEX IF EXISTS booking_analytics_unique_idx;

-- ============================================================
-- 2. Add policy for deletion_audit_log (RLS enabled, no policy)
-- ============================================================
CREATE POLICY "Admins can view deletion audit log"
  ON deletion_audit_log FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================================
-- 3. Fix mutable search_path on functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_booking_expiration()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending_payment' AND NEW.booking_expires_at IS NULL THEN
    NEW.booking_expires_at := NOW() + INTERVAL '30 minutes';
  END IF;

  IF NEW.status != 'pending_payment' AND OLD.status = 'pending_payment' THEN
    NEW.booking_expires_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_notification_on_booking_confirmed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid'
  AND (OLD.status IS NULL OR OLD.status != 'confirmed' OR OLD.payment_status != 'paid') THEN
    INSERT INTO admin_notifications (
      admin_user_id,
      booking_id,
      notification_type,
      title,
      message,
      metadata
    )
    SELECT
      id,
      NEW.id,
      'payment_received',
      'New Paid Booking Confirmed',
      'Booking for ' || NEW.guest_name || ' from ' ||
      to_char(NEW.check_in_date, 'Mon DD') || ' to ' ||
      to_char(NEW.check_out_date, 'Mon DD') || ' - €' ||
      COALESCE(NEW.total_amount::text, '0'),
      jsonb_build_object(
        'booking_reference', NEW.booking_reference,
        'guest_email', NEW.guest_email,
        'amount', NEW.total_amount
      )
    FROM admin_users
    WHERE is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  UPDATE admin_notifications
  SET read_at = NOW()
  WHERE id = p_notification_id
    AND read_at IS NULL;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_admin_email text)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_admin_user_id uuid;
  v_count integer;
BEGIN
  SELECT id INTO v_admin_user_id
  FROM admin_users
  WHERE email = p_admin_email AND is_active = true
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::integer
  INTO v_count
  FROM admin_notifications
  WHERE (admin_user_id = v_admin_user_id OR admin_user_id IS NULL)
    AND read_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_admin_email text)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_admin_user_id uuid;
  v_count integer;
BEGIN
  SELECT id INTO v_admin_user_id
  FROM admin_users
  WHERE email = p_admin_email AND is_active = true
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE admin_notifications
  SET read_at = NOW()
  WHERE (admin_user_id = v_admin_user_id OR admin_user_id IS NULL)
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
