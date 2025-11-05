interface EmailTemplateData {
  booking?: any;
  recipientName?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

export function getEmailTemplate(
  type: string,
  data: EmailTemplateData
): EmailTemplate {
  switch (type) {
    case "booking_confirmation":
      return getBookingConfirmationTemplate(data);
    case "access_code":
      return getAccessCodeTemplate(data);
    case "admin_notification":
      return getAdminNotificationTemplate(data);
    case "booking_cancelled":
      return getBookingCancelledTemplate(data);
    case "payment_failed":
      return getPaymentFailedTemplate(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}

function getBookingConfirmationTemplate(data: EmailTemplateData): EmailTemplate {
  const { booking, recipientName } = data;
  const passName = booking?.pass?.name || "Coworking Pass";
  const startDate = formatDate(booking?.start_date);
  const endDate = formatDate(booking?.end_date);
  const reference = booking?.booking_reference || "N/A";
  const amount = formatCurrency(booking?.total_amount, booking?.currency);

  return {
    subject: `Booking Confirmed - ${passName} at Bond Coliving`,
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Booking Confirmed!</h1>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${recipientName || "there"},</p>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Great news! Your coworking pass has been confirmed. We're excited to welcome you to Bond Coliving in Funchal, Madeira.
      </p>

      <div style="background: #F5F5F0; border-left: 4px solid #C5C5B5; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h2 style="color: #1E1F1E; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Booking Details</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Pass Type:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${passName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Start Date:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${startDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">End Date:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${endDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Booking Reference:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${reference}</td>
          </tr>
          <tr style="border-top: 2px solid #C5C5B5;">
            <td style="padding: 12px 0 8px 0; color: #1E1F1E; font-size: 16px; font-weight: 600;">Total Paid:</td>
            <td style="padding: 12px 0 8px 0; color: #1E1F1E; font-size: 16px; font-weight: 700; text-align: right;">${amount}</td>
          </tr>
        </table>
      </div>

      ${booking?.access_code ? `
      <div style="background: #1E1F1E; color: white; padding: 24px; margin: 0 0 24px 0; border-radius: 8px; text-align: center;">
        <p style="color: #C5C5B5; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Your Access Code</p>
        <p style="color: white; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 4px;">${booking.access_code}</p>
      </div>
      ` : ""}

      <div style="background: #F5F5F0; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h3 style="color: #1E1F1E; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">📍 Location</h3>
        <p style="color: #1E1F1E; font-size: 14px; line-height: 1.6; margin: 0;">
          Bond Coliving<br>
          Funchal, Madeira<br>
          <a href="https://maps.google.com" style="color: #1E1F1E; text-decoration: underline;">View on Map</a>
        </p>
      </div>

      <div style="background: #F5F5F0; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h3 style="color: #1E1F1E; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">⏰ Hours</h3>
        <p style="color: #1E1F1E; font-size: 14px; line-height: 1.6; margin: 0;">
          Monday - Friday: 9:00 AM - 6:00 PM<br>
          Saturday - Sunday: 10:00 AM - 4:00 PM
        </p>
      </div>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        If you have any questions, feel free to reach out to us at <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a>.
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0;">
        See you soon!<br>
        <strong>The Bond Team</strong>
      </p>
    `),
  };
}

function getAccessCodeTemplate(data: EmailTemplateData): EmailTemplate {
  const { booking, recipientName } = data;
  const accessCode = booking?.access_code || "Contact us";
  const reference = booking?.booking_reference || "N/A";

  return {
    subject: "Your Access Code - Bond Coliving",
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Your Access Code</h1>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Hi ${recipientName || "there"},</p>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Here's your access code for Bond Coliving's coworking space:
      </p>

      <div style="background: #1E1F1E; color: white; padding: 32px; margin: 0 0 24px 0; border-radius: 8px; text-align: center;">
        <p style="color: #C5C5B5; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Your Access Code</p>
        <p style="color: white; font-size: 40px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: 6px;">${accessCode}</p>
        <p style="color: #C5C5B5; font-size: 12px; margin: 0;">Booking Reference: ${reference}</p>
      </div>

      <div style="background: #F5F5F0; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h3 style="color: #1E1F1E; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">How to Access</h3>
        <ol style="color: #1E1F1E; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Arrive at Bond Coliving in Funchal</li>
          <li>Enter your access code at the door keypad</li>
          <li>Head to the coworking space on the ground floor</li>
          <li>Make yourself at home!</li>
        </ol>
      </div>

      <div style="background: #F5F5F0; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h3 style="color: #1E1F1E; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">📍 Location</h3>
        <p style="color: #1E1F1E; font-size: 14px; line-height: 1.6; margin: 0;">
          Bond Coliving<br>
          Funchal, Madeira<br>
          <a href="https://maps.google.com" style="color: #1E1F1E; text-decoration: underline;">View on Map</a>
        </p>
      </div>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Need help? Contact us at <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a>.
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0;">
        Happy coworking!<br>
        <strong>The Bond Team</strong>
      </p>
    `),
  };
}

function getAdminNotificationTemplate(data: EmailTemplateData): EmailTemplate {
  const { booking } = data;
  const passName = booking?.pass?.name || "Coworking Pass";
  const customerName = booking?.customer_name || "Unknown";
  const customerEmail = booking?.customer_email || "N/A";
  const startDate = formatDate(booking?.start_date);
  const amount = formatCurrency(booking?.total_amount, booking?.currency);
  const reference = booking?.booking_reference || "N/A";

  return {
    subject: `New Coworking Booking - ${customerName}`,
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">New Coworking Booking</h1>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        A new coworking pass has been purchased.
      </p>

      <div style="background: #F5F5F0; border-left: 4px solid #C5C5B5; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h2 style="color: #1E1F1E; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Booking Details</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Customer:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Email:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Pass Type:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${passName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Start Date:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${startDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Reference:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${reference}</td>
          </tr>
          <tr style="border-top: 2px solid #C5C5B5;">
            <td style="padding: 12px 0 8px 0; color: #1E1F1E; font-size: 16px; font-weight: 600;">Amount:</td>
            <td style="padding: 12px 0 8px 0; color: #1E1F1E; font-size: 16px; font-weight: 700; text-align: right;">${amount}</td>
          </tr>
        </table>
      </div>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0;">
        View full details in the <a href="https://stayatbond.com/admin/coworking" style="color: #1E1F1E; text-decoration: underline;">admin dashboard</a>.
      </p>
    `),
  };
}

function getBookingCancelledTemplate(data: EmailTemplateData): EmailTemplate {
  const { booking, recipientName } = data;
  const passName = booking?.pass?.name || "Coworking Pass";
  const reference = booking?.booking_reference || "N/A";

  return {
    subject: "Booking Cancelled - Bond Coliving",
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Booking Cancelled</h1>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Hi ${recipientName || "there"},</p>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your coworking booking (${passName}) with reference <strong>${reference}</strong> has been cancelled.
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        If this was a mistake or you have questions, please contact us at <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a>.
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong>The Bond Team</strong>
      </p>
    `),
  };
}

function getPaymentFailedTemplate(data: EmailTemplateData): EmailTemplate {
  const { booking, recipientName } = data;
  const reference = booking?.booking_reference || "N/A";

  return {
    subject: "Payment Issue - Bond Coliving",
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Payment Issue</h1>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Hi ${recipientName || "there"},</p>
      
      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        We encountered an issue processing your payment for booking reference <strong>${reference}</strong>.
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Please contact us at <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a> to resolve this issue.
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong>The Bond Team</strong>
      </p>
    `),
  };
}

function getEmailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bond Coliving</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F5F0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F0; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #1E1F1E; padding: 32px 40px; text-align: center;">
                  <h1 style="color: #C5C5B5; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">BOND</h1>
                  <p style="color: #C5C5B5; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 1px;">COLIVING · FUNCHAL</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #F5F5F0; padding: 32px 40px; text-align: center;">
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                    Bond Coliving · Funchal, Madeira<br>
                    <a href="https://stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">stayatbond.com</a> · 
                    <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a>
                  </p>
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2025 Bond Coliving. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount?: number, currency?: string): string {
  if (!amount) return "N/A";
  const curr = currency || "EUR";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: curr,
  }).format(amount / 100);
}
