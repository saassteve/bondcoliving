/*
  # Fix RLS auth initialization in admin_notifications

  1. Security Changes
    - Replace `auth.jwt()` with `(select auth.jwt())` in SELECT and UPDATE policies
    - This prevents re-evaluation of auth functions per row, improving performance
    - The subselect ensures the auth context is resolved once and cached

  2. Modified Policies
    - `Admins can view their notifications` (SELECT) - optimized auth call
    - `Admins can update their notifications` (UPDATE) - optimized auth call
*/

DROP POLICY IF EXISTS "Admins can view their notifications" ON public.admin_notifications;

CREATE POLICY "Admins can view their notifications"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    (admin_user_id IS NULL)
    OR (
      admin_user_id = (
        SELECT au.id FROM admin_users au
        WHERE au.email = ((select auth.jwt()) ->> 'email')
          AND au.is_active = true
        LIMIT 1
      )
    )
  );

DROP POLICY IF EXISTS "Admins can update their notifications" ON public.admin_notifications;

CREATE POLICY "Admins can update their notifications"
  ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    (admin_user_id IS NULL)
    OR (
      admin_user_id = (
        SELECT au.id FROM admin_users au
        WHERE au.email = ((select auth.jwt()) ->> 'email')
          AND au.is_active = true
        LIMIT 1
      )
    )
  )
  WITH CHECK (
    (admin_user_id IS NULL)
    OR (
      admin_user_id = (
        SELECT au.id FROM admin_users au
        WHERE au.email = ((select auth.jwt()) ->> 'email')
          AND au.is_active = true
        LIMIT 1
      )
    )
  );
