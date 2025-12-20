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
    const { emailType, bookingId, recipientEmail, recipientName } = body;

    console.log("Processing apartment email request:", { emailType, bookingId, recipientEmail });

    if (!emailType) {
      return errorResponse("Email type is required", "MISSING_EMAIL_TYPE", 400);
    }

    if (!bookingId) {
      return errorResponse("Booking ID is required", "MISSING_BOOKING_ID", 400);
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`*, apartment:apartments(*)`)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError);
      return errorResponse(`Booking not found: ${bookingError?.message || 'Unknown error'}`, "BOOKING_NOT_FOUND", 404);
    }

    let segments: any[] = [];
    if (booking.is_split_stay) {
      const { data: segmentData } = await supabase
        .from("apartment_booking_segments")
        .select(`*, apartment:apartments(*)`)
        .eq("parent_booking_id", bookingId)
        .order("check_in_date", { ascending: true });
      segments = segmentData || [];
    }

    const toEmail = recipientEmail || booking.guest_email;
    const toName = recipientName || booking.guest_name;

    if (!toEmail) {
      return errorResponse("Recipient email is required. Check that booking has guest_email.", "MISSING_RECIPIENT_EMAIL", 400);
    }

    const emailContent = getEmailTemplate(emailType, {
      booking,
      apartment: booking.apartment,
      segments,
      recipientName: toName,
    });

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: "Bond Coliving <hello@stayatbond.com>",
      to: toEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (resendError) {
      console.error("Resend error:", resendError);
      await supabase.from("email_logs").insert({
        email_type: `apartment_${emailType}`,
        recipient_email: toEmail,
        recipient_name: toName,
        subject: emailContent.subject,
        booking_id: bookingId,
        status: "failed",
        error_message: resendError.message,
      });
      return errorResponse(`Failed to send email via Resend: ${resendError.message}`, "RESEND_ERROR", 500, { details: resendError });
    }

    console.log("Apartment email sent successfully:", resendData);

    await supabase.from("email_logs").insert({
      email_type: `apartment_${emailType}`,
      recipient_email: toEmail,
      recipient_name: toName,
      subject: emailContent.subject,
      booking_id: bookingId,
      status: "sent",
      resend_id: resendData.id,
    });

    return jsonResponse({ success: true, message: "Email sent successfully", emailId: resendData.id });
  } catch (error) {
    console.error("Error processing apartment email:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", "INTERNAL_ERROR", 500);
  }
});
