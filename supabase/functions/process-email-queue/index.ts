import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, status = 400) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getEmailContent(supabase: any, email: any): Promise<{ subject: string; html: string } | null> {
  const { email_type, booking_id, booking_type, recipient_name } = email;

  if (!booking_id) return null;

  if (booking_type === "coworking") {
    const { data: booking } = await supabase
      .from("coworking_bookings")
      .select("*, pass:coworking_passes(*)")
      .eq("id", booking_id)
      .maybeSingle();

    if (!booking) {
      console.error("Coworking booking not found:", booking_id);
      return null;
    }

    return getCoworkingEmailTemplate(email_type, booking, recipient_name);
  } else {
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, apartment:apartment_id(*)")
      .eq("id", booking_id)
      .maybeSingle();

    if (!booking) {
      console.error("Apartment booking not found:", booking_id);
      return null;
    }

    return getApartmentEmailTemplate(email_type, booking, recipient_name);
  }
}

function getCoworkingEmailTemplate(type: string, booking: any, recipientName?: string) {
  const passName = booking?.pass?.name || "Coworking Pass";
  const startDate = formatDate(booking?.start_date);
  const endDate = formatDate(booking?.end_date);
  const reference = booking?.booking_reference || "N/A";
  const amount = formatCurrency(booking?.total_amount);
  const accessCode = booking?.access_code;
  const name = recipientName || booking?.customer_name || "there";

  switch (type) {
    case "booking_confirmation":
      return {
        subject: `Welcome to Bond Coliving! Your ${passName} is Ready`,
        html: emailWrapper(`
          <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Welcome to Bond Coliving!</h1>
          <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${name},</p>
          <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Your coworking pass has been confirmed. We look forward to welcoming you to Bond Coliving in Funchal, Madeira.
          </p>
          <div style="background: #F5F5F0; padding: 24px; margin: 0 0 24px 0; border-radius: 8px;">
            <h2 style="color: #1E1F1E; font-size: 16px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Pass</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${passName}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Dates</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${startDate} – ${endDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Reference</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${reference}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Amount</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${amount}</td></tr>
            </table>
          </div>
          ${accessCode ? `
            <div style="background: #1E1F1E; padding: 28px; margin: 0 0 24px 0; border-radius: 8px; text-align: center;">
              <p style="color: #C5C5B5; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Door Access Code</p>
              <p style="color: white; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: 8px;">${accessCode}</p>
            </div>
          ` : ""}
          <div style="background: #1E1F1E; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
            <p style="color: #C5C5B5; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">WiFi</p>
            <p style="color: white; margin: 0; font-size: 15px;"><strong>Network:</strong> BONDHOUSE &nbsp;|&nbsp; <strong>Password:</strong> COLLECTIVE</p>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you have any questions, reply to this email or visit <a href="https://stayatbond.com" style="color: #1E1F1E;">stayatbond.com</a>.
          </p>
        `),
      };

    case "admin_notification":
      return {
        subject: `New Coworking Booking - ${booking?.customer_name || "Guest"}`,
        html: emailWrapper(`
          <h1 style="color: #1E1F1E; font-size: 24px; margin: 0 0 24px 0;">New Coworking Booking</h1>
          <div style="background: #F5F5F0; padding: 24px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px; width: 120px;">Customer</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${booking?.customer_name || "N/A"}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Email</td><td style="padding: 6px 0; color: #1E1F1E; font-size: 14px;">${booking?.customer_email || "N/A"}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Pass</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${passName}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Dates</td><td style="padding: 6px 0; color: #1E1F1E; font-size: 14px;">${startDate} – ${endDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Amount</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${amount}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Reference</td><td style="padding: 6px 0; color: #1E1F1E; font-size: 14px;">${reference}</td></tr>
            </table>
          </div>
          <p style="margin: 24px 0 0 0;"><a href="https://stayatbond.com/admin" style="color: #1E1F1E; font-size: 14px;">View in Admin Dashboard →</a></p>
        `),
      };

    default:
      return null;
  }
}

function getApartmentEmailTemplate(type: string, booking: any, recipientName?: string) {
  const apartmentName = booking?.apartment?.title || "your apartment";
  const checkIn = formatDate(booking?.check_in_date);
  const checkOut = formatDate(booking?.check_out_date);
  const reference = booking?.booking_reference || "N/A";
  const amount = formatCurrency(booking?.total_amount);
  const name = recipientName || booking?.guest_name || "there";

  switch (type) {
    case "booking_confirmation":
      return {
        subject: `Booking Confirmed – ${apartmentName} at Bond Coliving`,
        html: emailWrapper(`
          <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">Booking Confirmed!</h1>
          <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${name},</p>
          <p style="color: #1E1F1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Great news — your stay at Bond Coliving has been confirmed. We can't wait to welcome you to Funchal, Madeira.
          </p>
          <div style="background: #F5F5F0; padding: 24px; margin: 0 0 24px 0; border-radius: 8px;">
            <h2 style="color: #1E1F1E; font-size: 16px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px; width: 120px;">Apartment</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${apartmentName}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Check-in</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${checkIn}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Check-out</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${checkOut}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Reference</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${reference}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Amount</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${amount}</td></tr>
            </table>
          </div>
          <div style="background: #1E1F1E; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
            <p style="color: #C5C5B5; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">WiFi</p>
            <p style="color: white; margin: 0; font-size: 15px;"><strong>Network:</strong> BONDHOUSE &nbsp;|&nbsp; <strong>Password:</strong> COLLECTIVE</p>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Your check-in instructions and door access code will be sent closer to your arrival. If you have any questions, reply to this email or visit <a href="https://stayatbond.com" style="color: #1E1F1E;">stayatbond.com</a>.
          </p>
        `),
      };

    case "admin_notification":
      return {
        subject: `New Apartment Booking – ${booking?.guest_name || "Guest"}`,
        html: emailWrapper(`
          <h1 style="color: #1E1F1E; font-size: 24px; margin: 0 0 24px 0;">New Apartment Booking</h1>
          <div style="background: #F5F5F0; padding: 24px; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px; width: 120px;">Guest</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${booking?.guest_name || "N/A"}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Email</td><td style="padding: 6px 0; color: #1E1F1E; font-size: 14px;">${booking?.guest_email || "N/A"}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Apartment</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${apartmentName}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Check-in</td><td style="padding: 6px 0; color: #1E1F1E; font-size: 14px;">${checkIn}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Check-out</td><td style="padding: 6px 0; color: #1E1F1E; font-size: 14px;">${checkOut}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Amount</td><td style="padding: 6px 0; color: #1E1F1E; font-weight: 600; font-size: 14px;">${amount}</td></tr>
              <tr><td style="padding: 6px 0; color: #666; font-size: 14px;">Reference</td><td style="padding: 6px 0; color: #1E1F1E; font-size: 14px;">${reference}</td></tr>
            </table>
          </div>
          <p style="margin: 24px 0 0 0;"><a href="https://stayatbond.com/admin" style="color: #1E1F1E; font-size: 14px;">View in Admin Dashboard →</a></p>
        `),
      };

    default:
      return null;
  }
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #F5F5F0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F0; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: white; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="background-color: #1E1F1E; padding: 32px 40px; text-align: center;">
            <h1 style="color: #C5C5B5; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 4px;">BOND</h1>
            <p style="color: #C5C5B5; margin: 6px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Coliving · Funchal</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background-color: #F5F5F0; padding: 24px 40px; text-align: center; border-top: 1px solid #E0E0D8;">
            <p style="color: #999; font-size: 13px; margin: 0 0 8px 0;">Bond Coliving — Funchal, Madeira, Portugal</p>
            <p style="margin: 0;"><a href="https://stayatbond.com" style="color: #666; font-size: 13px; text-decoration: none;">stayatbond.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatCurrency(amount?: number): string {
  if (amount == null) return "N/A";
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amount);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return errorResponse("Email service not configured (RESEND_API_KEY missing)", "MISSING_API_KEY", 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { data: pendingEmails, error: queueError } = await supabase.rpc("get_pending_emails", { p_limit: 20 });

    if (queueError) {
      console.error("Failed to fetch pending emails:", queueError);
      return errorResponse(`Failed to fetch email queue: ${queueError.message}`, "QUEUE_ERROR", 500);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return jsonResponse({ processed: 0, failed: 0, total: 0, message: "No pending emails" });
    }

    console.log(`Processing ${pendingEmails.length} emails from queue`);

    let processed = 0;
    let failed = 0;
    const results: any[] = [];

    for (const email of pendingEmails) {
      await supabase.rpc("mark_email_processing", { p_email_id: email.id });

      try {
        const content = await getEmailContent(supabase, email);

        if (!content) {
          const errMsg = `Failed to generate email content for type=${email.email_type} booking_id=${email.booking_id}`;
          console.error(errMsg);
          await supabase.rpc("mark_email_failed", { p_email_id: email.id, p_error: errMsg });
          failed++;
          results.push({ id: email.id, type: email.email_type, status: "failed", error: errMsg });
          continue;
        }

        const { data: resendData, error: resendError } = await resend.emails.send({
          from: "Bond Coliving <hello@stayatbond.com>",
          to: email.recipient_email,
          subject: content.subject,
          html: content.html,
        });

        if (resendError) {
          console.error(`Resend error for ${email.recipient_email}:`, resendError.message);
          await supabase.rpc("mark_email_failed", { p_email_id: email.id, p_error: resendError.message });
          await supabase.from("email_logs").insert({
            email_type: email.email_type,
            recipient_email: email.recipient_email,
            recipient_name: email.recipient_name,
            subject: content.subject,
            booking_id: email.booking_id,
            status: "failed",
            error_message: resendError.message,
          });
          failed++;
          results.push({ id: email.id, type: email.email_type, status: "failed", error: resendError.message });
        } else {
          console.log(`Sent ${email.email_type} to ${email.recipient_email}, resend_id: ${resendData?.id}`);
          await supabase.rpc("mark_email_sent", { p_email_id: email.id, p_resend_id: resendData?.id });
          await supabase.from("email_logs").insert({
            email_type: email.email_type,
            recipient_email: email.recipient_email,
            recipient_name: email.recipient_name,
            subject: content.subject,
            booking_id: email.booking_id,
            status: "sent",
            resend_id: resendData?.id,
          });
          processed++;
          results.push({ id: email.id, type: email.email_type, status: "sent", resend_id: resendData?.id });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing email ${email.id}:`, errorMsg);
        await supabase.rpc("mark_email_failed", { p_email_id: email.id, p_error: errorMsg });
        failed++;
        results.push({ id: email.id, type: email.email_type, status: "failed", error: errorMsg });
      }
    }

    return jsonResponse({ processed, failed, total: pendingEmails.length, results });
  } catch (error) {
    console.error("Error processing email queue:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      "INTERNAL_ERROR",
      500
    );
  }
});
