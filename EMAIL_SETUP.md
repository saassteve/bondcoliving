# Email System Setup Guide

This document describes the email notification system implemented for Bond Coliving's coworking booking platform.

## Overview

The email system uses **Resend** as the email service provider and is integrated with Stripe webhooks to automatically send transactional emails when bookings are created, paid, or cancelled.

## Email Types

The system supports the following email types:

1. **Booking Confirmation** - Sent when a coworking pass is successfully purchased
   - Includes booking details, pass information, dates, and access code
   - Branded with Bond's beige (#C5C5B5) and dark (#1E1F1E) color scheme

2. **Access Code Email** - Standalone email with access code for resend requests
   - Can be resent by customers via the booking lookup page
   - Includes detailed access instructions

3. **Admin Notification** - Sent to admin when new booking is created
   - Summary of customer and booking details
   - Link to admin dashboard for full details

4. **Payment Failed** - Sent when payment processing fails
   - Includes contact information for support

5. **Booking Cancelled** - Sent when booking is cancelled/refunded
   - Notifies customer of cancellation

## Architecture

### Edge Functions

1. **send-coworking-email** (`/functions/v1/send-coworking-email`)
   - Main email sending function
   - Handles all email template rendering
   - Calls Resend API to send emails
   - Logs all emails to `email_logs` table
   - Protected by JWT authentication

2. **stripe-webhook** (`/functions/v1/stripe-webhook`)
   - Processes Stripe webhook events
   - Triggers appropriate emails based on payment status
   - Sends both customer and admin notifications
   - Uses service role to call email function

### Database Tables

#### email_logs
Tracks all sent emails for audit trail and debugging:
- `email_type` - Type of email sent
- `recipient_email` - Email address
- `subject` - Email subject line
- `booking_id` - Related booking (if applicable)
- `status` - Delivery status (sent, delivered, failed, bounced)
- `resend_id` - Resend email ID for tracking
- `error_message` - Error details if failed
- `sent_at` - Timestamp

#### coworking_bookings (updates)
Added email tracking fields:
- `confirmation_email_sent` - Boolean flag
- `access_code_email_sent_at` - Timestamp

## Email Templates

All templates use a consistent branded design:
- **Header**: Dark background (#1E1F1E) with "BOND" logo in beige (#C5C5B5)
- **Content**: White background with beige and dark accents
- **Footer**: Light beige background with contact info
- **Responsive**: Mobile-optimized with proper viewport settings

Templates are defined in `/supabase/functions/send-coworking-email/templates.ts`

## Configuration Required

### Environment Variables

The following environment variable must be configured in Supabase:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx  # Get from Resend dashboard
```

Optional:
```bash
ADMIN_EMAIL=hello@stayatbond.com  # Override default admin notification email
```

### Resend Setup

1. **Create Resend Account**: Sign up at https://resend.com
2. **Verify Domain**: Add and verify `stayatbond.com` domain
   - Add DNS records for domain verification
   - Configure SPF, DKIM, and DMARC records
3. **Get API Key**: Generate API key from Resend dashboard
4. **Configure Sender**: Emails are sent from `hello@stayatbond.com`

## User-Facing Features

### Booking Lookup Page
Located at `/coworking/lookup`, allows customers to:
- Look up their booking using reference number and email
- View booking details and access code
- Resend access code email if needed
- Self-service access to booking information

### Admin Features
Admins can:
- View email logs in the database
- See email delivery status
- Manually trigger email resends (future enhancement)

## Testing

### Test Email Sending

1. Create a test coworking booking through the checkout flow
2. Complete payment (use Stripe test cards)
3. Check email inbox for confirmation email
4. Verify email logs in database:
   ```sql
   SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
   ```

### Test Resend Functionality

1. Visit `/coworking/lookup`
2. Enter booking reference and email
3. Click "Resend Access Code Email"
4. Verify email is received

### Email Preview

To preview email templates without sending:
- Templates can be viewed by deploying to staging first
- Consider adding a preview endpoint (future enhancement)

## Monitoring

### Check Email Delivery Status

Query the `email_logs` table:
```sql
-- Failed emails in last 24 hours
SELECT * FROM email_logs
WHERE status = 'failed'
AND sent_at > NOW() - INTERVAL '24 hours';

-- Emails sent for a specific booking
SELECT * FROM email_logs
WHERE booking_id = 'booking-uuid-here'
ORDER BY sent_at DESC;

-- Email delivery stats
SELECT
  email_type,
  status,
  COUNT(*) as count
FROM email_logs
GROUP BY email_type, status;
```

### Resend Dashboard

Monitor email delivery in Resend dashboard:
- Delivery rates
- Bounce rates
- Spam complaints
- Email opens (if tracking enabled)

## Error Handling

The system includes robust error handling:
- Email failures don't break webhook processing
- Failed emails are logged with error messages
- Customers can resend emails if delivery fails
- Admin notifications are sent separately from customer emails

## Future Enhancements

Potential improvements:
1. Email template customization in admin panel
2. Daily digest emails for admins
3. Email preview endpoint
4. Scheduled reminder emails before booking start date
5. Email delivery webhooks from Resend
6. Email open/click tracking
7. Multi-language support
8. Automated follow-up emails after booking ends

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**: Verify `RESEND_API_KEY` is set in Supabase
2. **Check Domain Verification**: Ensure domain is verified in Resend
3. **Check Email Logs**: Look for error messages in `email_logs` table
4. **Check Edge Function Logs**: View logs in Supabase dashboard
5. **Check Stripe Webhook**: Verify webhook is firing correctly

### Emails Going to Spam

1. **Configure SPF/DKIM**: Ensure DNS records are properly configured
2. **Test Spam Score**: Use mail-tester.com to check email
3. **Warm Up Domain**: Send gradually increasing email volumes
4. **Monitor Resend Dashboard**: Check for deliverability issues

### Access Code Not in Email

1. **Check Booking**: Verify `access_code` field is populated
2. **Check Template**: Ensure template includes access code section
3. **Check Email Type**: Verify correct email type is being sent

## Support

For issues or questions:
- Technical: Check Supabase edge function logs
- Email delivery: Check Resend dashboard
- Database: Query `email_logs` table for details

## Security

- Email function requires authentication (JWT verification enabled)
- Service role key used only by webhook function
- Customer emails only sent to verified booking email addresses
- Access codes never exposed in URLs or logs (only in email content)
- Email logs accessible only to authenticated admins
