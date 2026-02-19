import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured", code: "MISSING_RESEND_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { invitationCode, recipientEmail, recipientName, registrationUrl } = await req.json();

    if (!invitationCode || !recipientEmail || !recipientName || !registrationUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to Bond</title>
</head>
<body style="margin:0;padding:0;background-color:#1E1F1E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background-color:#1E1F1E;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#242524;border-radius:16px;overflow:hidden;border:1px solid rgba(197,197,181,0.1);">
          <tr>
            <td style="padding:40px;text-align:center;background:linear-gradient(135deg,#2A2B2A 0%,#1E1F1E 100%);border-bottom:1px solid rgba(197,197,181,0.1);">
              <h1 style="color:#C5C5B5;font-size:28px;font-weight:700;margin:0 0 8px 0;letter-spacing:-0.5px;">Bond Coliving</h1>
              <p style="color:rgba(197,197,181,0.6);font-size:14px;margin:0;">Funchal, Madeira</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 16px 0;">You're invited, ${recipientName}!</h2>
              <p style="color:rgba(197,197,181,0.8);font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                Welcome to Bond. You've been invited to create your guest account and access the Bond community platform.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(197,197,181,0.05);border:1px solid rgba(197,197,181,0.1);border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="color:rgba(197,197,181,0.6);font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Your invitation code</p>
                    <p style="color:#C5C5B5;font-size:28px;font-weight:700;font-family:monospace;letter-spacing:4px;margin:0;">${invitationCode}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${registrationUrl}" style="display:inline-block;padding:16px 40px;background-color:#C5C5B5;color:#1E1F1E;text-decoration:none;font-weight:700;font-size:15px;border-radius:50px;letter-spacing:0.5px;">
                      Create Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:rgba(197,197,181,0.5);font-size:13px;line-height:1.6;margin:0 0 8px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color:rgba(197,197,181,0.4);font-size:12px;word-break:break-all;margin:0 0 32px 0;">${registrationUrl}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(197,197,181,0.03);border:1px solid rgba(197,197,181,0.08);border-radius:10px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:rgba(197,197,181,0.5);font-size:13px;margin:0 0 8px 0;"><strong style="color:rgba(197,197,181,0.7);">Please note:</strong></p>
                    <ul style="color:rgba(197,197,181,0.5);font-size:13px;line-height:1.8;margin:0;padding-left:20px;">
                      <li>This invitation expires in 7 days</li>
                      <li>It can only be used once</li>
                      <li>Contact us if you have any issues</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(197,197,181,0.1);text-align:center;">
              <p style="color:rgba(197,197,181,0.4);font-size:13px;margin:0;">
                Bond Coliving &bull; Funchal, Madeira &bull;
                <a href="mailto:hello@stayatbond.com" style="color:rgba(197,197,181,0.6);text-decoration:none;">hello@stayatbond.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error: emailError } = await resend.emails.send({
      from: "Bond Coliving <hello@stayatbond.com>",
      to: recipientEmail,
      subject: `You're invited to Bond, ${recipientName}!`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("email_logs")
      .insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        email_type: "guest_invitation",
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .maybeSingle();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
