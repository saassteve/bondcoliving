import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { getEmailTemplate } from "./templates.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      return errorResponse("Email service not configured. Please contact administrator.", "MISSING_RESEND_API_KEY", 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const body = await req.json();
    const { emailType, bookingId, recipientEmail, recipientName, resendEmail } = body;

    console.log("Processing email request:", { emailType, bookingId, recipientEmail });

    if (!emailType) {
      return errorResponse("Email type is required", "MISSING_EMAIL_TYPE", 400);
    }

    if (resendEmail && bookingId) {
      return await handleResendEmail(supabase, resend, bookingId);
    }

    let booking = null;
    if (bookingId) {
      const { data, error } = await supabase
        .from("coworking_bookings")
        .select(`*, pass:coworking_passes(*)`)
        .eq("id", bookingId)
        .single();

      if (error || !data) {
        console.error("Error fetching booking:", error);
        return errorResponse(`Booking not found: ${error?.message || 'Unknown error'}`, "BOOKING_NOT_FOUND", 404);
      }

      booking = data;
    }

    const toEmail = recipientEmail || booking?.customer_email;
    const toName = recipientName || booking?.customer_name;

    if (!toEmail) {
      return errorResponse("Recipient email is required. Check that booking has customer_email.", "MISSING_RECIPIENT_EMAIL", 400);
    }

    if (emailType === "access_code" && !booking?.access_code) {
      return errorResponse("Cannot send access code email: booking has no access code set.", "MISSING_ACCESS_CODE", 400);
    }

    const emailContent = getEmailTemplate(emailType, { booking, recipientName: toName });

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: "Bond Coliving <hello@stayatbond.com>",
      to: toEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (resendError) {
      console.error("Resend error:", resendError);
      await supabase.from("email_logs").insert({
        email_type: emailType,
        recipient_email: toEmail,
        recipient_name: toName,
        subject: emailContent.subject,
        booking_id: bookingId,
        status: "failed",
        error_message: resendError.message,
      });
      return errorResponse(`Failed to send email via Resend: ${resendError.message}`, "RESEND_ERROR", 500, { details: resendError });
    }

    console.log("Email sent successfully:", resendData);

    await supabase.from("email_logs").insert({
      email_type: emailType,
      recipient_email: toEmail,
      recipient_name: toName,
      subject: emailContent.subject,
      booking_id: bookingId,
      status: "sent",
      resend_id: resendData.id,
    });

    if (bookingId) {
      const updates: any = {};
      if (emailType === "booking_confirmation" || emailType === "access_code") {
        updates.confirmation_email_sent = true;
      }
      if (emailType === "access_code") {
        updates.access_code_email_sent_at = new Date().toISOString();
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("coworking_bookings").update(updates).eq("id", bookingId);
      }
    }

    return jsonResponse({ success: true, message: "Email sent successfully", emailId: resendData.id });
  } catch (error) {
    console.error("Error processing email:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", "INTERNAL_ERROR", 500);
  }
});

async function handleResendEmail(supabase: any, resend: any, bookingId: string) {
  const { data: booking, error } = await supabase
    .from("coworking_bookings")
    .select(`*, pass:coworking_passes(*)`)
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return errorResponse("Booking not found", "BOOKING_NOT_FOUND", 404);
  }

  if (!booking.access_code) {
    return errorResponse("Cannot resend access code: booking has no access code set.", "MISSING_ACCESS_CODE", 400);
  }

  const emailContent = getEmailTemplate("access_code", { booking, recipientName: booking.customer_name });

  const { data: resendData, error: resendError } = await resend.emails.send({
    from: "Bond Coliving <hello@stayatbond.com>",
    to: booking.customer_email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  if (resendError) {
    console.error("Resend error:", resendError);
    await supabase.from("email_logs").insert({
      email_type: "access_code",
      recipient_email: booking.customer_email,
      recipient_name: booking.customer_name,
      subject: emailContent.subject,
      booking_id: bookingId,
      status: "failed",
      error_message: resendError.message,
      metadata: { resent: true },
    });
    return errorResponse(`Failed to resend email: ${resendError.message}`, "RESEND_ERROR", 500);
  }

  await supabase.from("email_logs").insert({
    email_type: "access_code",
    recipient_email: booking.customer_email,
    recipient_name: booking.customer_name,
    subject: emailContent.subject,
    booking_id: bookingId,
    status: "sent",
    resend_id: resendData.id,
    metadata: { resent: true },
  });

  return jsonResponse({ success: true, message: "Access code email resent successfully" });
}
