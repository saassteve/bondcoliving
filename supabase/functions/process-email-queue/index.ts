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

  if (!booking_id) {
    return null;
  }

  if (booking_type === "coworking") {
    const { data: booking } = await supabase
      .from("coworking_bookings")
      .select("*, pass:coworking_passes(*)")
      .eq("id", booking_id)
      .single();

    if (!booking) return null;

    return getCoworkingEmailTemplate(email_type, booking, recipient_name);
  } else {
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, apartment:apartments(*)")
      .eq("id", booking_id)
      .single();

    if (!booking) return null;

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

  const wrapper = (content: string) => `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #F5F5F0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F0; padding: 40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 8px; overflow: hidden;">
            <tr><td style="background-color: #1E1F1E; padding: 32px 40px; text-align: center;">
              <h1 style="color: #C5C5B5; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">BOND</h1>
              <p style="color: #C5C5B5; margin: 8px 0 0 0; font-size: 14px;">COLIVING - FUNCHAL</p>
            </td></tr>
            <tr><td style="padding: 40px;">${content}</td></tr>
            <tr><td style="background-color: #F5F5F0; padding: 32px 40px; text-align: center;">
              <p style="color: #666; font-size: 14px;">Bond Coliving - Funchal, Madeira<br>
                <a href="https://stayatbond.com" style="color: #1E1F1E;">stayatbond.com</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>
  `;

  switch (type) {
    case "booking_confirmation":
      return {
        subject: `Welcome to Bond Coliving! Your ${passName} is Ready`,
        html: wrapper(`
          <h1 style="color: #1E1F1E; font-size: 28px; margin: 0 0 24px 0;">Welcome to Bond Coliving!</h1>
          <p style="color: #1E1F1E; font-size: 16px;">Hi ${recipientName || "there"},</p>
          <p style="color: #1E1F1E;">Your coworking pass has been confirmed!</p>
          <div style="background: #F5F5F0; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p><strong>Pass:</strong> ${passName}</p>
            <p><strong>Dates:</strong> ${startDate} - ${endDate}</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <p><strong>Amount:</strong> ${amount}</p>
          </div>
          ${accessCode ? `
            <div style="background: #1E1F1E; color: white; padding: 28px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <p style="color: #C5C5B5; margin: 0 0 12px 0;">Your Door Access Code</p>
              <p style="font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 6px;">${accessCode}</p>
            </div>
          ` : ""}
          <div style="background: #1E1F1E; color: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="color: #C5C5B5; margin: 0 0 8px 0;">WiFi: BONDHOUSE</p>
            <p style="color: white; margin: 0;">Password: COLLECTIVE</p>
          </div>
        `),
      };

    case "admin_notification":
      return {
        subject: `New Coworking Booking - ${booking?.customer_name || "Guest"}`,
        html: wrapper(`
          <h1 style="color: #1E1F1E; font-size: 28px;">New Coworking Booking</h1>
          <div style="background: #F5F5F0; padding: 20px; border-radius: 4px;">
            <p><strong>Customer:</strong> ${booking?.customer_name}</p>
            <p><strong>Email:</strong> ${booking?.customer_email}</p>
            <p><strong>Pass:</strong> ${passName}</p>
            <p><strong>Dates:</strong> ${startDate} - ${endDate}</p>
            <p><strong>Amount:</strong> ${amount}</p>
            <p><strong>Reference:</strong> ${reference}</p>
          </div>
        `),
      };

    default:
      return null;
  }
}

function getApartmentEmailTemplate(type: string, booking: any, recipientName?: string) {
  const apartmentName = booking?.apartment?.name || "Apartment";
  const checkIn = formatDate(booking?.check_in_date);
  const checkOut = formatDate(booking?.check_out_date);
  const reference = booking?.booking_reference || "N/A";
  const amount = formatCurrency(booking?.total_amount);

  const wrapper = (content: string) => `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #F5F5F0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F0; padding: 40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 8px;">
            <tr><td style="background-color: #1E1F1E; padding: 32px 40px; text-align: center;">
              <h1 style="color: #C5C5B5; margin: 0; font-size: 32px;">BOND</h1>
              <p style="color: #C5C5B5; margin: 8px 0 0 0; font-size: 14px;">COLIVING - FUNCHAL</p>
            </td></tr>
            <tr><td style="padding: 40px;">${content}</td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>
  `;

  switch (type) {
    case "booking_confirmation":
      return {
        subject: `Booking Confirmed - ${apartmentName}`,
        html: wrapper(`
          <h1 style="color: #1E1F1E;">Booking Confirmed!</h1>
          <p>Hi ${recipientName || booking?.guest_name || "there"},</p>
          <p>Your stay at Bond Coliving has been confirmed.</p>
          <div style="background: #F5F5F0; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p><strong>Apartment:</strong> ${apartmentName}</p>
            <p><strong>Check-in:</strong> ${checkIn}</p>
            <p><strong>Check-out:</strong> ${checkOut}</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <p><strong>Amount:</strong> ${amount}</p>
          </div>
        `),
      };

    case "admin_notification":
      return {
        subject: `New Apartment Booking - ${booking?.guest_name || "Guest"}`,
        html: wrapper(`
          <h1 style="color: #1E1F1E;">New Apartment Booking</h1>
          <div style="background: #F5F5F0; padding: 20px; border-radius: 4px;">
            <p><strong>Guest:</strong> ${booking?.guest_name}</p>
            <p><strong>Email:</strong> ${booking?.guest_email}</p>
            <p><strong>Apartment:</strong> ${apartmentName}</p>
            <p><strong>Check-in:</strong> ${checkIn}</p>
            <p><strong>Check-out:</strong> ${checkOut}</p>
            <p><strong>Amount:</strong> ${amount}</p>
          </div>
        `),
      };

    default:
      return null;
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function formatCurrency(amount?: number): string {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);
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

    const { data: pendingEmails } = await supabase.rpc("get_pending_emails", { p_limit: 10 });

    if (!pendingEmails || pendingEmails.length === 0) {
      return jsonResponse({ processed: 0, message: "No pending emails" });
    }

    let processed = 0;
    let failed = 0;
    const results: any[] = [];

    for (const email of pendingEmails) {
      await supabase.rpc("mark_email_processing", { p_email_id: email.id });

      try {
        const content = await getEmailContent(supabase, email);

        if (!content) {
          await supabase.rpc("mark_email_failed", { p_email_id: email.id, p_error: "Failed to generate email content" });
          failed++;
          continue;
        }

        const { data: resendData, error: resendError } = await resend.emails.send({
          from: "Bond Coliving <hello@stayatbond.com>",
          to: email.recipient_email,
          subject: content.subject,
          html: content.html,
        });

        if (resendError) {
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
          results.push({ id: email.id, status: "failed", error: resendError.message });
        } else {
          await supabase.rpc("mark_email_sent", { p_email_id: email.id, p_resend_id: resendData.id });
          await supabase.from("email_logs").insert({
            email_type: email.email_type,
            recipient_email: email.recipient_email,
            recipient_name: email.recipient_name,
            subject: content.subject,
            booking_id: email.booking_id,
            status: "sent",
            resend_id: resendData.id,
          });
          processed++;
          results.push({ id: email.id, status: "sent", resend_id: resendData.id });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        await supabase.rpc("mark_email_failed", { p_email_id: email.id, p_error: errorMsg });
        failed++;
        results.push({ id: email.id, status: "failed", error: errorMsg });
      }
    }

    return jsonResponse({
      processed,
      failed,
      total: pendingEmails.length,
      results,
    });
  } catch (error) {
    console.error("Error processing email queue:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", "INTERNAL_ERROR", 500);
  }
});
