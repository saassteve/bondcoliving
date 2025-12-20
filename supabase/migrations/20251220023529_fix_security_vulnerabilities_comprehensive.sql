/*
  # Comprehensive Security Vulnerability Fixes

  ## Issues Fixed

  1. **Overly Permissive RLS Policies**
     - `apartment_booking_segments` - Limit public access to non-sensitive info
     - `apartment_ical_events` - Restrict to admin only (contains external booking data)
     - `activity_logs` - Restrict inserts to admins only
     - `conversation_participants` - Add proper ownership checks
     - `conversations` - Add proper ownership checks

  2. **Functions Missing search_path**
     - Fix all SECURITY DEFINER functions to have explicit search_path = public
     - Prevents search_path injection attacks

  ## Security Notes
  - All fixes maintain existing admin functionality
  - Public-facing read access remains for legitimate use cases
*/

-- =====================================================
-- PART 1: Fix Overly Permissive RLS Policies
-- =====================================================

-- apartment_booking_segments: Restrict public access to hide sensitive booking info
DROP POLICY IF EXISTS "Public can view booking segments" ON apartment_booking_segments;

CREATE POLICY "Public can view confirmed booking date ranges only"
  ON apartment_booking_segments FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = parent_booking_id 
      AND b.status IN ('confirmed', 'checked_in', 'completed')
    )
  );

-- apartment_ical_events: These contain external booking data - admin only
DROP POLICY IF EXISTS "Public can read ical events" ON apartment_ical_events;

CREATE POLICY "Admins can view ical events"
  ON apartment_ical_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- activity_logs: Should only be inserted by system/admins
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;

CREATE POLICY "Admins can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- =====================================================
-- PART 2: Fix Conversation Policies (add ownership checks)
-- =====================================================

-- conversation_participants: Must be admin or already a participant
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;

CREATE POLICY "Users can add participants to conversations they participate in"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN guest_users gu ON cp.guest_user_id = gu.id
      WHERE cp.conversation_id = conversation_id
      AND gu.user_id = auth.uid()
    )
  );

-- conversations: Admins can create
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Admins can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- =====================================================
-- PART 3: Fix Functions Without Proper search_path
-- =====================================================

-- Fix check_admin_auth_status
DROP FUNCTION IF EXISTS public.check_admin_auth_status();

CREATE OR REPLACE FUNCTION public.check_admin_auth_status()
RETURNS TABLE(
  current_auth_uid uuid, 
  current_auth_email text, 
  admin_record_exists boolean, 
  admin_user_id uuid, 
  admin_email text, 
  admin_is_active boolean, 
  user_id_matches boolean, 
  email_matches boolean, 
  can_login boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid() as current_auth_uid,
    au.email as current_auth_email,
    (a.id IS NOT NULL) as admin_record_exists,
    a.user_id as admin_user_id,
    a.email as admin_email,
    COALESCE(a.is_active, false) as admin_is_active,
    (a.user_id = auth.uid()) as user_id_matches,
    (a.email = au.email) as email_matches,
    (
      a.id IS NOT NULL 
      AND a.is_active = true 
      AND (a.user_id = auth.uid() OR a.email = au.email)
    ) as can_login
  FROM auth.users au
  LEFT JOIN admin_users a ON a.email = au.email OR a.user_id = au.id
  WHERE au.id = auth.uid();
END;
$$;

-- Fix fix_admin_user_id
DROP FUNCTION IF EXISTS public.fix_admin_user_id();

CREATE OR REPLACE FUNCTION public.fix_admin_user_id()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email text;
BEGIN
  SELECT email INTO current_email
  FROM auth.users
  WHERE id = auth.uid();

  UPDATE admin_users
  SET user_id = auth.uid()
  WHERE email = current_email
  AND (user_id IS NULL OR user_id != auth.uid());
END;
$$;

-- Fix get_current_user_email (with CASCADE to drop dependent policies)
DROP FUNCTION IF EXISTS public.get_current_user_email() CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  RETURN user_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;

-- Recreate the admin_users policy that was dropped
DROP POLICY IF EXISTS "Email-based admin verification" ON admin_users;
CREATE POLICY "Admin users can read own data by email"
  ON admin_users FOR SELECT
  TO authenticated
  USING (email = public.get_current_user_email());

-- Fix get_or_create_export_token
DROP FUNCTION IF EXISTS public.get_or_create_export_token(uuid);

CREATE OR REPLACE FUNCTION public.get_or_create_export_token(p_apartment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  SELECT export_token INTO v_token
  FROM apartment_ical_exports
  WHERE apartment_id = p_apartment_id AND is_active = true;

  IF v_token IS NULL THEN
    v_token := encode(gen_random_bytes(32), 'base64');
    v_token := replace(replace(replace(v_token, '/', '_'), '+', '-'), '=', '');

    INSERT INTO apartment_ical_exports (apartment_id, export_token)
    VALUES (p_apartment_id, v_token)
    ON CONFLICT (apartment_id) 
    DO UPDATE SET 
      export_token = EXCLUDED.export_token,
      is_active = true,
      updated_at = now();

    RETURN v_token;
  END IF;

  RETURN v_token;
END;
$$;

-- Fix populate_booking_analytics
DROP FUNCTION IF EXISTS public.populate_booking_analytics();

CREATE OR REPLACE FUNCTION public.populate_booking_analytics()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_records_created integer := 0;
  v_rows integer;
BEGIN
  INSERT INTO booking_analytics (
    date,
    booking_source,
    booking_type,
    count,
    total_revenue,
    average_length
  )
  SELECT 
    b.check_in_date::date as date,
    b.booking_source,
    'apartment' as booking_type,
    COUNT(*) as count,
    SUM(b.total_amount) as total_revenue,
    AVG(b.check_out_date - b.check_in_date) as average_length
  FROM bookings b
  WHERE b.payment_status = 'paid'
  AND b.status NOT IN ('cancelled')
  GROUP BY b.check_in_date::date, b.booking_source
  ON CONFLICT (date, booking_source, booking_type)
  DO UPDATE SET
    count = EXCLUDED.count,
    total_revenue = EXCLUDED.total_revenue,
    average_length = EXCLUDED.average_length;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_records_created := v_rows;

  INSERT INTO booking_analytics (
    date,
    booking_source,
    booking_type,
    count,
    total_revenue,
    average_length
  )
  SELECT 
    cb.start_date::date as date,
    'direct' as booking_source,
    'coworking' as booking_type,
    COUNT(*) as count,
    SUM(cb.total_amount) as total_revenue,
    AVG(cb.end_date - cb.start_date + 1) as average_length
  FROM coworking_bookings cb
  WHERE cb.payment_status = 'paid'
  AND cb.booking_status NOT IN ('cancelled')
  GROUP BY cb.start_date::date
  ON CONFLICT (date, booking_source, booking_type)
  DO UPDATE SET
    count = EXCLUDED.count,
    total_revenue = EXCLUDED.total_revenue,
    average_length = EXCLUDED.average_length;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_records_created := v_records_created + v_rows;

  RETURN v_records_created;
END;
$$;

-- Fix populate_occupancy_analytics
DROP FUNCTION IF EXISTS public.populate_occupancy_analytics();

CREATE OR REPLACE FUNCTION public.populate_occupancy_analytics()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_records_created integer := 0;
  v_booking record;
  v_date date;
BEGIN
  FOR v_booking IN 
    SELECT 
      b.id,
      b.apartment_id,
      b.check_in_date,
      b.check_out_date,
      a.building_id
    FROM bookings b
    JOIN apartments a ON a.id = b.apartment_id
    WHERE b.status NOT IN ('cancelled')
  LOOP
    FOR v_date IN 
      SELECT generate_series::date
      FROM generate_series(v_booking.check_in_date, v_booking.check_out_date - interval '1 day', '1 day'::interval)
    LOOP
      INSERT INTO occupancy_analytics (
        date,
        apartment_id,
        building_id,
        is_occupied,
        booking_id
      ) VALUES (
        v_date,
        v_booking.apartment_id,
        v_booking.building_id,
        true,
        v_booking.id
      )
      ON CONFLICT (date, COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid))
      DO UPDATE SET
        is_occupied = true,
        booking_id = EXCLUDED.booking_id;

      v_records_created := v_records_created + 1;
    END LOOP;
  END LOOP;

  RETURN v_records_created;
END;
$$;

-- Fix populate_revenue_analytics
DROP FUNCTION IF EXISTS public.populate_revenue_analytics();

CREATE OR REPLACE FUNCTION public.populate_revenue_analytics()
RETURNS TABLE(records_created integer, total_revenue numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_records_created integer := 0;
  v_total_revenue numeric := 0;
  v_booking record;
  v_date date;
BEGIN
  FOR v_booking IN 
    SELECT 
      b.id,
      b.apartment_id,
      b.check_in_date,
      b.check_out_date,
      b.total_amount,
      b.booking_source,
      b.payment_status,
      a.building_id
    FROM bookings b
    JOIN apartments a ON a.id = b.apartment_id
    WHERE b.payment_status = 'paid'
    AND b.status NOT IN ('cancelled')
    AND b.total_amount > 0
  LOOP
    FOR v_date IN 
      SELECT generate_series::date
      FROM generate_series(v_booking.check_in_date, v_booking.check_out_date - interval '1 day', '1 day'::interval)
    LOOP
      INSERT INTO revenue_analytics (
        date,
        building_id,
        apartment_id,
        revenue_type,
        amount,
        booking_count,
        source
      ) VALUES (
        v_date,
        v_booking.building_id,
        v_booking.apartment_id,
        'apartment',
        v_booking.total_amount / GREATEST((v_booking.check_out_date - v_booking.check_in_date), 1),
        1,
        v_booking.booking_source
      )
      ON CONFLICT (date, COALESCE(building_id, '00000000-0000-0000-0000-000000000000'::uuid), 
        COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid), 
        revenue_type, COALESCE(source, ''))
      DO UPDATE SET
        amount = revenue_analytics.amount + EXCLUDED.amount,
        booking_count = revenue_analytics.booking_count + 1;

      v_records_created := v_records_created + 1;
      v_total_revenue := v_total_revenue + (v_booking.total_amount / GREATEST((v_booking.check_out_date - v_booking.check_in_date), 1));
    END LOOP;
  END LOOP;

  FOR v_booking IN 
    SELECT 
      id,
      start_date,
      end_date,
      total_amount,
      payment_status
    FROM coworking_bookings
    WHERE payment_status = 'paid'
    AND booking_status NOT IN ('cancelled')
    AND total_amount > 0
  LOOP
    FOR v_date IN 
      SELECT generate_series::date
      FROM generate_series(v_booking.start_date, v_booking.end_date, '1 day'::interval)
    LOOP
      INSERT INTO revenue_analytics (
        date,
        revenue_type,
        amount,
        booking_count,
        source
      ) VALUES (
        v_date,
        'coworking',
        v_booking.total_amount / GREATEST((v_booking.end_date - v_booking.start_date + 1), 1),
        1,
        'direct'
      )
      ON CONFLICT (date, COALESCE(building_id, '00000000-0000-0000-0000-000000000000'::uuid), 
        COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid), 
        revenue_type, COALESCE(source, ''))
      DO UPDATE SET
        amount = revenue_analytics.amount + EXCLUDED.amount,
        booking_count = revenue_analytics.booking_count + 1;

      v_records_created := v_records_created + 1;
      v_total_revenue := v_total_revenue + (v_booking.total_amount / GREATEST((v_booking.end_date - v_booking.start_date + 1), 1));
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_records_created, v_total_revenue;
END;
$$;

-- =====================================================
-- PART 4: Fix Functions with Empty search_path
-- =====================================================

-- Fix assign_coworking_pass_code (had search_path="")
DROP FUNCTION IF EXISTS public.assign_coworking_pass_code(uuid);

CREATE OR REPLACE FUNCTION public.assign_coworking_pass_code(p_booking_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  UPDATE coworking_pass_codes
  SET 
    is_used = true,
    used_at = now(),
    booking_id = p_booking_id
  WHERE id = (
    SELECT id
    FROM coworking_pass_codes
    WHERE is_used = false
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING code INTO v_code;

  RETURN v_code;
END;
$$;

-- Fix calculate_booking_total (had search_path="")
DROP FUNCTION IF EXISTS public.calculate_booking_total(uuid);

CREATE OR REPLACE FUNCTION public.calculate_booking_total(p_booking_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_amount numeric;
BEGIN
  SELECT COALESCE(SUM(segment_price), 0)
  INTO total_amount
  FROM apartment_booking_segments
  WHERE parent_booking_id = p_booking_id;

  RETURN total_amount;
END;
$$;

-- Fix check_booking_availability (had search_path="")
DROP FUNCTION IF EXISTS public.check_booking_availability(uuid, date, date, uuid);

CREATE OR REPLACE FUNCTION public.check_booking_availability(
  p_apartment_id uuid, 
  p_check_in date, 
  p_check_out date, 
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  overlap_count integer;
BEGIN
  SELECT COUNT(*)
  INTO overlap_count
  FROM apartment_availability
  WHERE apartment_id = p_apartment_id
  AND date >= p_check_in
  AND date < p_check_out
  AND status IN ('booked', 'blocked');

  IF overlap_count > 0 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Fix cleanup_expired_password_reset_tokens (had search_path="")
DROP FUNCTION IF EXISTS public.cleanup_expired_password_reset_tokens();

CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < (now() - interval '24 hours');
END;
$$;

-- Fix expire_guest_access (had search_path="")
DROP FUNCTION IF EXISTS public.expire_guest_access();

CREATE OR REPLACE FUNCTION public.expire_guest_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE guest_users
  SET status = 'expired'
  WHERE status = 'active'
  AND NOW() > (access_end_date + (grace_period_days || ' days')::INTERVAL);
END;
$$;

-- Fix get_available_cleaning_days (had search_path="")
DROP FUNCTION IF EXISTS public.get_available_cleaning_days(uuid);

CREATE OR REPLACE FUNCTION public.get_available_cleaning_days(p_guest_user_id uuid)
RETURNS TABLE(day_of_week integer, day_name text, next_available_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  check_in_date date;
  current_date_val date := CURRENT_DATE;
BEGIN
  SELECT b.check_in_date INTO check_in_date
  FROM guest_users gu
  JOIN bookings b ON gu.booking_id = b.id
  WHERE gu.id = p_guest_user_id;

  check_in_date := COALESCE(check_in_date, current_date_val);

  RETURN QUERY
  SELECT 
    dow.day_num,
    dow.day_name,
    (check_in_date + ((dow.day_num - EXTRACT(DOW FROM check_in_date)::integer + 7) % 7 || ' days')::interval)::date as next_date
  FROM (
    VALUES 
    (0, 'Sunday'),
    (1, 'Monday'),
    (2, 'Tuesday'),
    (3, 'Wednesday'),
    (4, 'Thursday'),
    (5, 'Friday'),
    (6, 'Saturday')
  ) AS dow(day_num, day_name)
  WHERE (check_in_date + ((dow.day_num - EXTRACT(DOW FROM check_in_date)::integer + 7) % 7 || ' days')::interval)::date >= current_date_val;
END;
$$;

-- Fix get_next_available_date_for_apartment (had search_path="")
DROP FUNCTION IF EXISTS public.get_next_available_date_for_apartment(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_next_available_date_for_apartment(
  p_apartment_id uuid, 
  p_months_ahead integer DEFAULT 6, 
  p_min_nights integer DEFAULT 14
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_end_date date := CURRENT_DATE + (p_months_ahead || ' months')::interval;
  v_current_date date := v_today;
  v_check_date date;
  v_is_blocked boolean;
  v_consecutive_available integer;
BEGIN
  WHILE v_current_date <= v_end_date LOOP
    v_consecutive_available := 0;

    FOR i IN 0..(p_min_nights - 1) LOOP
      v_check_date := v_current_date + i;

      SELECT EXISTS (
        SELECT 1
        FROM bookings
        WHERE apartment_id = p_apartment_id
        AND status IN ('confirmed', 'checked_in')
        AND check_in_date <= v_check_date
        AND check_out_date > v_check_date
      ) INTO v_is_blocked;

      IF NOT v_is_blocked THEN
        SELECT EXISTS (
          SELECT 1
          FROM apartment_availability
          WHERE apartment_id = p_apartment_id
          AND date = v_check_date
          AND status IN ('booked', 'blocked')
        ) INTO v_is_blocked;
      END IF;

      IF v_is_blocked THEN
        EXIT;
      END IF;

      v_consecutive_available := v_consecutive_available + 1;
    END LOOP;

    IF v_consecutive_available >= p_min_nights THEN
      RETURN v_current_date;
    END IF;

    v_current_date := v_current_date + 1;
  END LOOP;

  RETURN NULL;
END;
$$;

-- Fix get_unread_message_count (had search_path="")
DROP FUNCTION IF EXISTS public.get_unread_message_count(uuid);

CREATE OR REPLACE FUNCTION public.get_unread_message_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*)::integer INTO count
  FROM messages m
  JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
  JOIN guest_users gu ON cp.guest_user_id = gu.id
  WHERE gu.user_id = user_uuid
  AND m.created_at > cp.last_read_at
  AND m.sender_id != gu.id;

  RETURN count;
END;
$$;

-- =====================================================
-- PART 5: Grant necessary permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.check_admin_auth_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_admin_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_export_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_booking_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_occupancy_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_revenue_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_coworking_pass_code(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_booking_total(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_booking_availability(uuid, date, date, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_password_reset_tokens() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_guest_access() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_available_cleaning_days(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_available_date_for_apartment(uuid, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(uuid) TO authenticated;
