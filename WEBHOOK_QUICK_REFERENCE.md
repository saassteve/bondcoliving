# Stripe Webhook Quick Reference

## TL;DR - Fix in 3 Steps

### 1. Verify Webhook Secret
Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks) and copy the signing secret (starts with `whsec_`) from your webhook endpoint:
```
https://eaccyitssgrkrrqgdojy.supabase.co/functions/v1/stripe-webhook
```

### 2. Set in Supabase & Redeploy
```bash
# Run the deployment script
./fix-webhook-signature.sh
```

Or manually:
```bash
supabase login
supabase link --project-ref eaccyitssgrkrrqgdojy
supabase functions deploy stripe-webhook
```

### 3. Test with Fresh Booking
Create a new test booking (don't resend old events from Stripe)

---

## Current Pending Booking

**Booking ID**: `f96a0b30-7e29-42a2-8a9f-846ca3517bc3`
**Reference**: `UZSXCQR8`
**Customer**: Steve Franco (steve@underdogx.co)
**Amount**: €10.00
**Payment Intent**: `pi_3Se55gRUqPQGdP4I0EZfvX8k`

### Option 1: Manual Database Fix (Fastest)
Run the SQL script in Supabase SQL Editor:
```bash
cat fix-pending-booking.sql
```

Then send confirmation email manually via admin panel or API call.

### Option 2: Wait for Proper Fix
1. Deploy the webhook function with correct secret
2. Create a fresh test booking
3. Verify webhook works
4. Process the pending booking once webhook is confirmed working

---

## Verification Checklist

After deployment:
- [ ] Edge function deployed successfully
- [ ] Fresh test booking created
- [ ] Webhook shows "Success" in Stripe Dashboard
- [ ] Booking status = "confirmed" in database
- [ ] Payment status = "paid" in database
- [ ] Access code assigned to booking
- [ ] Confirmation email sent to customer
- [ ] Admin notification sent

---

## Quick Links

- [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
- [Supabase Edge Functions](https://supabase.com/dashboard/project/eaccyitssgrkrrqgdojy/functions)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/eaccyitssgrkrrqgdojy/editor)
- [Edge Function Logs](https://supabase.com/dashboard/project/eaccyitssgrkrrqgdojy/functions/stripe-webhook/logs)

---

## Common Mistakes to Avoid

❌ Resending old webhook events after redeploying
✅ Creating fresh bookings for testing

❌ Copying signing secret from wrong webhook endpoint
✅ Using secret from the Supabase function URL endpoint

❌ Forgetting to redeploy after setting secrets
✅ Always redeploy: `supabase functions deploy stripe-webhook`

❌ Using test mode secret with live mode events
✅ Match the mode (test vs live)
