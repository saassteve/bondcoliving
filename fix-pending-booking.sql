-- Manual fix for pending booking: f96a0b30-7e29-42a2-8a9f-846ca3517bc3
-- Use this if you need to process the current pending booking immediately
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/eaccyitssgrkrrqgdojy/editor

-- Step 1: Check current booking status
SELECT
  id,
  booking_reference,
  customer_name,
  customer_email,
  pass_id,
  booking_date,
  payment_status,
  booking_status,
  access_code
FROM coworking_bookings
WHERE id = 'f96a0b30-7e29-42a2-8a9f-846ca3517bc3';

-- Step 2: Check current payment status
SELECT
  id,
  booking_id,
  amount,
  status,
  stripe_checkout_session_id,
  stripe_payment_intent_id
FROM coworking_payments
WHERE booking_id = 'f96a0b30-7e29-42a2-8a9f-846ca3517bc3';

-- Step 3: Update payment to succeeded
UPDATE coworking_payments
SET
  status = 'succeeded',
  stripe_payment_intent_id = 'pi_3Se55gRUqPQGdP4I0EZfvX8k',
  payment_method = 'card',
  metadata = jsonb_build_object(
    'session_id', 'cs_live_a1G1NHZvE9KyvMFflVcd9CvfPLqKR442CYgPCqp0iqwqEBn0MhYkxSU1Ca',
    'customer_email', 'steve@underdogx.co',
    'manually_fixed', true,
    'fixed_at', now()
  )
WHERE booking_id = 'f96a0b30-7e29-42a2-8a9f-846ca3517bc3';

-- Step 4: Update booking to confirmed and paid
UPDATE coworking_bookings
SET
  payment_status = 'paid',
  booking_status = 'confirmed'
WHERE id = 'f96a0b30-7e29-42a2-8a9f-846ca3517bc3';

-- Step 5: Assign an access code from the pool
SELECT assign_coworking_pass_code('f96a0b30-7e29-42a2-8a9f-846ca3517bc3');

-- Step 6: Verify the booking was updated correctly
SELECT
  id,
  booking_reference,
  customer_name,
  customer_email,
  pass_id,
  booking_date,
  payment_status,
  booking_status,
  access_code,
  created_at,
  updated_at
FROM coworking_bookings
WHERE id = 'f96a0b30-7e29-42a2-8a9f-846ca3517bc3';

-- Step 7: Check if access code was assigned
SELECT
  code,
  status,
  assigned_to_booking_id,
  assigned_at
FROM coworking_pass_codes
WHERE assigned_to_booking_id = 'f96a0b30-7e29-42a2-8a9f-846ca3517bc3';

-- Note: After running this, you'll need to manually send confirmation emails
-- You can do this from the admin panel or by calling the send-coworking-email function:
--
-- POST https://eaccyitssgrkrrqgdojy.supabase.co/functions/v1/send-coworking-email
-- Headers:
--   Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--   Content-Type: application/json
-- Body:
-- {
--   "emailType": "booking_confirmation",
--   "bookingId": "f96a0b30-7e29-42a2-8a9f-846ca3517bc3"
-- }
