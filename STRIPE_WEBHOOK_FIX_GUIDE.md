# Stripe Webhook Signature Verification Fix Guide

## Problem
The Stripe webhook is failing with error: "Webhook signature verification failed" (HTTP 400)

## Root Cause
After setting the `STRIPE_WEBHOOK_SECRET` in Supabase, the edge function needs to be **redeployed** to pick up the new environment variable. The currently running function instance doesn't have access to the updated secret.

## Solution Steps

### Step 1: Verify Your Stripe Webhook Configuration

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Find the webhook endpoint that matches your Supabase function URL:
   ```
   https://eaccyitssgrkrrqgdojy.supabase.co/functions/v1/stripe-webhook
   ```
3. Click on this webhook endpoint to view its details
4. Verify it's listening to these events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (it starts with `whsec_`)
   - Make sure you copy the ENTIRE secret without any extra spaces
   - This is the value you need for `STRIPE_WEBHOOK_SECRET`

### Step 2: Set Environment Variables in Supabase

1. Go to [Supabase Dashboard > Project Settings > Edge Functions](https://supabase.com/dashboard/project/eaccyitssgrkrrqgdojy/settings/functions)
2. Ensure these secrets are configured:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_live_` or `sk_test_`)
   - `STRIPE_WEBHOOK_SECRET` - The signing secret from Step 1 (starts with `whsec_`)
   - `ADMIN_EMAIL` - Email for admin notifications (optional, defaults to hello@stayatbond.com)

### Step 3: Redeploy the Edge Function (CRITICAL!)

**This is the most important step!** After setting the secrets, you MUST redeploy the function:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref eaccyitssgrkrrqgdojy

# Deploy the stripe-webhook function
supabase functions deploy stripe-webhook

# Verify deployment succeeded
supabase functions list
```

### Step 4: Test with a Fresh Webhook Event

**IMPORTANT**: Do NOT resend old webhook events from Stripe after redeploying!

Old events have signatures based on their original timestamp and will fail verification even with the correct secret. Instead:

1. Create a fresh test booking on your site
2. Complete the Stripe checkout
3. Stripe will automatically send a new `checkout.session.completed` event
4. This new event will have a valid signature that can be verified

### Step 5: Verify Success

1. Check the Edge Function logs in Supabase Dashboard:
   - Go to [Edge Functions > stripe-webhook > Logs](https://supabase.com/dashboard/project/eaccyitssgrkrrqgdojy/functions/stripe-webhook/logs)
   - Look for successful webhook processing messages

2. Check Stripe webhook logs:
   - Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
   - Click on your webhook endpoint
   - Verify recent events show "Success" (HTTP 200)

3. Check your database:
   - Verify the booking status changed to `confirmed`
   - Verify the payment status changed to `paid`
   - Verify an access code was assigned (for coworking bookings)

## Alternative: Process Pending Booking Immediately

If you need to process the current pending booking (f96a0b30-7e29-42a2-8a9f-846ca3517bc3) RIGHT NOW, you can temporarily bypass signature verification:

### Option A: Manual Database Update (Recommended)

Update the booking directly in the database:

```sql
-- Update coworking booking
UPDATE coworking_bookings
SET
  payment_status = 'paid',
  booking_status = 'confirmed'
WHERE id = 'f96a0b30-7e29-42a2-8a9f-846ca3517bc3';

-- Update payment record
UPDATE coworking_payments
SET
  status = 'succeeded',
  stripe_payment_intent_id = 'pi_3Se55gRUqPQGdP4I0EZfvX8k'
WHERE booking_id = 'f96a0b30-7e29-42a2-8a9f-846ca3517bc3';

-- Assign an access code
SELECT assign_coworking_pass_code('f96a0b30-7e29-42a2-8a9f-846ca3517bc3');
```

Then send confirmation emails manually through the admin panel or by calling the email function.

### Option B: Temporarily Disable Verification (Not Recommended)

Only use this if you need to resend the old Stripe event immediately:

1. Comment out lines 71-87 in `/tmp/cc-agent/51633458/project/supabase/functions/stripe-webhook/index.ts`
2. Redeploy: `supabase functions deploy stripe-webhook`
3. Resend the webhook event from Stripe dashboard
4. Uncomment lines 71-87
5. Redeploy again: `supabase functions deploy stripe-webhook`
6. Follow Steps 1-4 above to configure properly

## Common Issues

### Issue: "Signature verification still failing after redeploying"
**Solution**:
- Make sure you're testing with a FRESH event, not resending old events
- Verify you copied the correct signing secret from the matching webhook endpoint
- Check you're using the live mode secret for live mode events (and test mode for test mode)

### Issue: "Multiple webhook endpoints in Stripe"
**Solution**:
- Each webhook endpoint has its own signing secret
- Make sure you copied the secret from the endpoint that matches your Supabase function URL
- Consider deleting unused webhook endpoints to avoid confusion

### Issue: "API version mismatch"
**Solution**:
- The webhook function uses Stripe API version 2023-10-16
- Your webhook shows API version 2025-07-30.basil
- This shouldn't cause signature issues, but may cause data parsing issues
- Consider updating the Stripe library version in the function

## Monitoring

Set up monitoring to catch webhook failures early:

1. **Stripe Dashboard Alerts**:
   - Go to Settings > Notifications
   - Enable "Webhook endpoint failures"

2. **Supabase Function Monitoring**:
   - Check function logs regularly
   - Set up alerts for function errors

3. **Database Monitoring**:
   - Monitor for bookings stuck in "pending_payment" status
   - Monitor for payments stuck in "pending" status

## Support

If issues persist:
1. Check the Edge Function logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a fresh Stripe test mode booking first
4. Contact support with specific error messages and booking IDs
