interface EmailTemplateData {
  booking?: any;
  apartment?: any;
  segments?: any[];
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
    case "admin_notification":
      return getAdminNotificationTemplate(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}

function getBookingConfirmationTemplate(data: EmailTemplateData): EmailTemplate {
  const { booking, apartment, segments, recipientName } = data;
  const guestName = recipientName || booking?.guest_name || "Guest";
  const checkIn = formatDate(booking?.check_in_date);
  const checkOut = formatDate(booking?.check_out_date);
  const reference = booking?.booking_reference || "N/A";
  const amount = formatCurrency(booking?.total_amount);
  const isSplitStay = booking?.is_split_stay && segments && segments.length > 1;

  let accommodationDetails = "";

  if (isSplitStay) {
    accommodationDetails = `
      <div style="background: #F5F5F0; border-left: 4px solid #C5C5B5; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h2 style="color: #1E1F1E; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Your Stay Details</h2>
        <p style="color: #666; font-size: 14px; margin: 0 0 16px 0;">Your stay includes multiple apartments:</p>

        ${segments.map((segment, index) => `
          <div style="background: white; padding: 16px; border-radius: 4px; margin-bottom: ${index < segments.length - 1 ? '12px' : '0'};">
            <p style="color: #1E1F1E; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">${segment.apartment?.title || 'Apartment'}</p>
            <p style="color: #666; font-size: 14px; margin: 0;">
              ${formatDate(segment.check_in_date)} - ${formatDate(segment.check_out_date)}
            </p>
          </div>
        `).join('')}

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
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
    `;
  } else {
    accommodationDetails = `
      <div style="background: #F5F5F0; border-left: 4px solid #C5C5B5; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h2 style="color: #1E1F1E; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Your Stay Details</h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Apartment:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${apartment?.title || 'Your Apartment'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Check-in:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${checkIn}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Check-out:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${checkOut}</td>
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
    `;
  }

  return {
    subject: `Your Stay at Bond Coliving is Confirmed!`,
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Thank You for Booking!</h1>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${guestName},</p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        We're thrilled to confirm your upcoming stay at Bond Coliving in beautiful Funchal, Madeira! Your booking has been received and your apartment is reserved.
      </p>

      ${accommodationDetails}

      <div style="background: linear-gradient(135deg, #1E1F1E 0%, #3a3b3a 100%); color: white; padding: 24px; margin: 0 0 24px 0; border-radius: 8px;">
        <h3 style="color: #C5C5B5; font-size: 16px; margin: 0 0 12px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What Happens Next?</h3>
        <p style="color: white; font-size: 14px; line-height: 1.8; margin: 0;">
          Closer to your check-in date, we'll send you another email with:
        </p>
        <ul style="color: white; font-size: 14px; line-height: 1.8; margin: 12px 0 0 0; padding-left: 20px;">
          <li>Your door access code</li>
          <li>Detailed check-in instructions</li>
          <li>WiFi details and house information</li>
          <li>Local tips and recommendations</li>
        </ul>
      </div>

      <div style="background: #F5F5F0; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h3 style="color: #1E1F1E; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Check-in Information</h3>
        <p style="color: #1E1F1E; font-size: 14px; line-height: 1.8; margin: 0;">
          <strong>Check-in time:</strong> From 3:00 PM<br>
          <strong>Check-out time:</strong> By 11:00 AM<br>
          <strong>Self check-in:</strong> Available 24/7 with your access code
        </p>
      </div>

      <div style="background: #F5F5F0; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h3 style="color: #1E1F1E; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Questions?</h3>
        <p style="color: #1E1F1E; font-size: 14px; line-height: 1.6; margin: 0;">
          We're here to help! If you have any questions before your arrival, just reply to this email or reach out to us at:<br><br>
          <strong>Email:</strong> <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a><br>
          <strong>Website:</strong> <a href="https://stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">stayatbond.com</a>
        </p>
      </div>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
        We can't wait to welcome you to Madeira!
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0;">
        Warm regards,<br>
        <strong>The Bond Team</strong>
      </p>
    `),
  };
}

function getAdminNotificationTemplate(data: EmailTemplateData): EmailTemplate {
  const { booking, apartment, segments } = data;
  const guestName = booking?.guest_name || "Unknown";
  const guestEmail = booking?.guest_email || "N/A";
  const guestPhone = booking?.guest_phone || "N/A";
  const checkIn = formatDate(booking?.check_in_date);
  const checkOut = formatDate(booking?.check_out_date);
  const amount = formatCurrency(booking?.total_amount);
  const reference = booking?.booking_reference || "N/A";
  const isSplitStay = booking?.is_split_stay && segments && segments.length > 1;

  let apartmentInfo = apartment?.title || "N/A";
  if (isSplitStay) {
    apartmentInfo = segments.map(s => s.apartment?.title || 'Apartment').join(' + ');
  }

  return {
    subject: `New Apartment Booking - ${guestName}`,
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">New Apartment Booking</h1>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        A new apartment booking has been received and paid.
      </p>

      <div style="background: #F5F5F0; border-left: 4px solid #C5C5B5; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h2 style="color: #1E1F1E; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Booking Details</h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Guest Name:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${guestName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Email:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${guestEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Phone:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${guestPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Apartment:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${apartmentInfo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Check-in:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${checkIn}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Check-out:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Reference:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">${reference}</td>
          </tr>
          ${isSplitStay ? `
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; font-weight: 500;">Type:</td>
            <td style="padding: 8px 0; color: #1E1F1E; font-size: 14px; font-weight: 600; text-align: right;">Split Stay</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #C5C5B5;">
            <td style="padding: 12px 0 8px 0; color: #1E1F1E; font-size: 16px; font-weight: 600;">Amount:</td>
            <td style="padding: 12px 0 8px 0; color: #1E1F1E; font-size: 16px; font-weight: 700; text-align: right;">${amount}</td>
          </tr>
        </table>
      </div>

      ${isSplitStay ? `
      <div style="background: #F5F5F0; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <h3 style="color: #1E1F1E; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Split Stay Segments</h3>
        ${segments.map((segment, index) => `
          <div style="background: white; padding: 12px; border-radius: 4px; margin-bottom: ${index < segments.length - 1 ? '8px' : '0'};">
            <p style="color: #1E1F1E; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">${segment.apartment?.title || 'Apartment'}</p>
            <p style="color: #666; font-size: 13px; margin: 0;">
              ${formatDate(segment.check_in_date)} - ${formatDate(segment.check_out_date)}
            </p>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0;">
        View full details in the <a href="https://stayatbond.com/admin/bookings" style="color: #1E1F1E; text-decoration: underline;">admin dashboard</a>.
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
              <tr>
                <td style="background-color: #1E1F1E; padding: 32px 40px; text-align: center;">
                  <h1 style="color: #C5C5B5; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">BOND</h1>
                  <p style="color: #C5C5B5; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 1px;">COLIVING - FUNCHAL</p>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>

              <tr>
                <td style="background-color: #F5F5F0; padding: 32px 40px; text-align: center;">
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                    Bond Coliving - Funchal, Madeira<br>
                    <a href="https://stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">stayatbond.com</a> -
                    <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a>
                  </p>
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    2025 Bond Coliving. All rights reserved.
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

function formatCurrency(amount?: number | string): string {
  if (!amount) return "N/A";
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(numAmount);
}