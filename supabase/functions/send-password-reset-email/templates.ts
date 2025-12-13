interface EmailTemplateData {
  resetLink: string;
  recipientName?: string;
  userType: 'admin' | 'guest';
}

interface EmailTemplate {
  subject: string;
  html: string;
}

export function getPasswordResetTemplate(data: EmailTemplateData): EmailTemplate {
  const { resetLink, recipientName, userType } = data;
  const userTypeLabel = userType === 'admin' ? 'Admin' : 'Guest';

  return {
    subject: `Reset Your Password - Bond Coliving ${userTypeLabel} Portal`,
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Reset Your Password</h1>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${recipientName || "there"},</p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        We received a request to reset your password for your Bond Coliving ${userTypeLabel} account. Click the button below to create a new password.
      </p>

      <div style="text-align: center; margin: 0 0 32px 0;">
        <a href="${resetLink}" style="display: inline-block; background-color: #1E1F1E; color: white; padding: 16px 48px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
          Reset Password
        </a>
      </div>

      <div style="background: #F5F5F0; border-left: 4px solid #C5C5B5; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0; font-weight: 600;">
          🔒 Security Information
        </p>
        <ul style="color: #666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li>This link will expire in <strong>6 hours</strong></li>
          <li>The link can only be used once</li>
          <li>For your security, the link is unique to your account</li>
        </ul>
      </div>

      <div style="background: #FFF9E6; border-left: 4px solid #FFD700; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
          <strong style="color: #1E1F1E;">⚠️ Didn't request this?</strong><br>
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; padding-top: 16px; border-top: 1px solid #E5E5E5;">
        <strong>Having trouble with the button?</strong> Copy and paste this link into your browser:
      </p>
      <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 0 0 24px 0; word-break: break-all; background: #F5F5F0; padding: 12px; border-radius: 4px;">
        ${resetLink}
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
        Need help? Contact us at <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a>
      </p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong>The Bond Team</strong>
      </p>
    `),
  };
}

export function getPasswordResetSuccessTemplate(data: { recipientName?: string; userType: 'admin' | 'guest' }): EmailTemplate {
  const { recipientName, userType } = data;
  const userTypeLabel = userType === 'admin' ? 'Admin' : 'Guest';

  return {
    subject: `Password Changed - Bond Coliving ${userTypeLabel} Portal`,
    html: getEmailWrapper(`
      <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Password Changed Successfully</h1>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${recipientName || "there"},</p>

      <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        This email confirms that your password for your Bond Coliving ${userTypeLabel} account has been successfully changed.
      </p>

      <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <p style="color: #1E1F1E; font-size: 14px; line-height: 1.6; margin: 0;">
          ✓ Your password was updated on ${new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div style="background: #FFF9E6; border-left: 4px solid #FFD700; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
          <strong style="color: #1E1F1E;">⚠️ Didn't make this change?</strong><br>
          If you didn't change your password, please contact us immediately at <a href="mailto:hello@stayatbond.com" style="color: #1E1F1E; text-decoration: underline;">hello@stayatbond.com</a>
        </p>
      </div>

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
              <tr>
                <td style="background-color: #1E1F1E; padding: 32px 40px; text-align: center;">
                  <h1 style="color: #C5C5B5; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">BOND</h1>
                  <p style="color: #C5C5B5; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 1px;">COLIVING · FUNCHAL</p>
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
