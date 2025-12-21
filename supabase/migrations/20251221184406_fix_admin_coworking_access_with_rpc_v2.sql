/*
  # Fix Admin Coworking Access with Secure RPC Functions

  ## Problem
  Despite correct user_id linkage and RLS policies, admins cannot see coworking bookings.
  The is_admin() function may not be evaluating correctly in the RLS context.

  ## Solution
  Create SECURITY DEFINER RPC functions that:
  1. Verify the caller is an admin internally
  2. Bypass RLS to fetch data
  3. Return the data to authenticated admins only

  ## New Functions
  - get_admin_coworking_bookings(): Returns all coworking bookings for admins
  - get_admin_coworking_stats(): Returns revenue and booking stats for admins
  - check_admin_status(): Diagnostic function to check current user's admin status

  ## Security
  - Functions use SECURITY DEFINER to bypass RLS
  - Each function verifies admin status before returning data
  - Only authenticated users can call these functions
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.check_admin_status();
DROP FUNCTION IF EXISTS public.get_admin_coworking_bookings();
DROP FUNCTION IF EXISTS public.get_admin_coworking_stats();
DROP FUNCTION IF EXISTS public.get_admin_coworking_passes();

-- Function to check admin status (diagnostic)
CREATE FUNCTION public.check_admin_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_admin_record record;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'user_id', null,
      'is_admin', false,
      'message', 'Not authenticated'
    );
  END IF;
  
  SELECT id, email, role, user_id, is_active
  INTO v_admin_record
  FROM admin_users
  WHERE user_id = v_uid;
  
  IF v_admin_record IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'user_id', v_uid,
      'is_admin', false,
      'admin_record', null,
      'message', 'User authenticated but not found in admin_users table'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'authenticated', true,
    'user_id', v_uid,
    'is_admin', v_admin_record.is_active,
    'admin_record', jsonb_build_object(
      'id', v_admin_record.id,
      'email', v_admin_record.email,
      'role', v_admin_record.role,
      'user_id', v_admin_record.user_id,
      'is_active', v_admin_record.is_active
    ),
    'message', CASE WHEN v_admin_record.is_active THEN 'Admin access verified' ELSE 'Admin account is inactive' END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_status() TO authenticated;

-- Function to get all coworking bookings for admins
CREATE FUNCTION public.get_admin_coworking_bookings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
  v_bookings jsonb;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated', 'bookings', '[]'::jsonb);
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = v_uid AND is_active = true
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Access denied - admin required', 'bookings', '[]'::jsonb);
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'pass_id', b.pass_id,
      'customer_name', b.customer_name,
      'customer_email', b.customer_email,
      'customer_phone', b.customer_phone,
      'start_date', b.start_date,
      'end_date', b.end_date,
      'access_code', b.access_code,
      'booking_reference', b.booking_reference,
      'payment_status', b.payment_status,
      'booking_status', b.booking_status,
      'total_amount', b.total_amount,
      'currency', b.currency,
      'special_notes', b.special_notes,
      'created_at', b.created_at,
      'updated_at', b.updated_at,
      'pass', CASE WHEN p.id IS NOT NULL THEN jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'slug', p.slug,
        'price', p.price,
        'duration_days', p.duration_days,
        'duration_type', p.duration_type,
        'description', p.description,
        'is_active', p.is_active
      ) ELSE null END
    ) ORDER BY b.created_at DESC
  ), '[]'::jsonb)
  INTO v_bookings
  FROM coworking_bookings b
  LEFT JOIN coworking_passes p ON b.pass_id = p.id;
  
  RETURN jsonb_build_object('error', null, 'bookings', v_bookings);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_coworking_bookings() TO authenticated;

-- Function to get coworking revenue stats for admins
CREATE FUNCTION public.get_admin_coworking_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
  v_total numeric;
  v_count integer;
  v_by_pass jsonb;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = v_uid AND is_active = true
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Access denied - admin required');
  END IF;
  
  SELECT 
    COALESCE(SUM(b.total_amount), 0),
    COUNT(*)
  INTO v_total, v_count
  FROM coworking_bookings b
  WHERE b.payment_status = 'paid';
  
  SELECT COALESCE(jsonb_object_agg(
    COALESCE(subq.pass_name, 'Unknown'),
    subq.pass_total
  ), '{}'::jsonb)
  INTO v_by_pass
  FROM (
    SELECT 
      p.name as pass_name,
      SUM(b.total_amount) as pass_total
    FROM coworking_bookings b
    LEFT JOIN coworking_passes p ON b.pass_id = p.id
    WHERE b.payment_status = 'paid'
    GROUP BY p.name
  ) subq;
  
  RETURN jsonb_build_object(
    'error', null,
    'total', v_total,
    'count', v_count,
    'by_pass_type', v_by_pass
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_coworking_stats() TO authenticated;

-- Function to get all coworking passes for admins
CREATE FUNCTION public.get_admin_coworking_passes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
  v_passes jsonb;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated', 'passes', '[]'::jsonb);
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = v_uid AND is_active = true
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Access denied - admin required', 'passes', '[]'::jsonb);
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'slug', slug,
      'price', price,
      'duration_days', duration_days,
      'duration_type', duration_type,
      'description', description,
      'features', features,
      'is_active', is_active,
      'sort_order', sort_order,
      'max_capacity', max_capacity,
      'current_capacity', current_capacity,
      'is_capacity_limited', is_capacity_limited,
      'created_at', created_at,
      'updated_at', updated_at
    ) ORDER BY sort_order ASC
  ), '[]'::jsonb)
  INTO v_passes
  FROM coworking_passes;
  
  RETURN jsonb_build_object('error', null, 'passes', v_passes);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_coworking_passes() TO authenticated;
