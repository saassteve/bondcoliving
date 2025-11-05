import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";
import { getEmailTemplate } from "./templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const body = await req.json();
    const { emailType, bookingId, recipientEmail, recipientName, resendEmail } = body;

    console.log("Processing email request:", { emailType, bookingId, recipientEmail });

    // Validate required fields
    if (!emailType) {
      throw new Error("Email type is required");
    }

    // Handle resend request
    if (resendEmail && bookingId) {
      return await handleResendEmail(supabase, resend, bookingId);
    }

    // Fetch booking details if bookingId provided
    let booking = null;
    if (bookingId) {
      const { data, error } = await supabase
        .from("coworking_bookings")
        .select(`
          *,
          pass:coworking_passes(*)
        `)
        .eq("id", bookingId)
        .single();

      if (error) {
        console.error("Error fetching booking:", error);
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }

      booking = data;
    }

    // Determine recipient from booking or params
    const toEmail = recipientEmail || booking?.customer_email;
    const toName = recipientName || booking?.customer_name;

    if (!toEmail) {
      throw new Error("Recipient email is required");
    }

    // Generate email content
    const emailContent = getEmailTemplate(emailType, {
      booking,
      recipientName: toName,
    });

    // Send email via Resend
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: "Bond Coliving <hello@stayatbond.com>",
      to: toEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (resendError) {
      console.error("Resend error:", resendError);
      
      // Log failed email
      await supabase.from("email_logs").insert({
        email_type: emailType,
        recipient_email: toEmail,
        recipient_name: toName,
        subject: emailContent.subject,
        booking_id: bookingId,
        status: "failed",
        error_message: resendError.message,
      });

      throw new Error(`Failed to send email: ${resendError.message}`);
    }

    console.log("Email sent successfully:", resendData);

    // Log successful email
    await supabase.from("email_logs").insert({
      email_type: emailType,
      recipient_email: toEmail,
      recipient_name: toName,
      subject: emailContent.subject,
      booking_id: bookingId,
      status: "sent",
      resend_id: resendData.id,
    });

    // Update booking email tracking
    if (bookingId) {
      const updates: any = {};
      
      if (emailType === "booking_confirmation" || emailType === "access_code") {
        updates.confirmation_email_sent = true;
      }
      
      if (emailType === "access_code") {
        updates.access_code_email_sent_at = new Date().toISOString();
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("coworking_bookings")
          .update(updates)
          .eq("id", bookingId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        emailId: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing email:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handleResendEmail(supabase: any, resend: any, bookingId: string) {
  // Fetch booking
  const { data: booking, error } = await supabase
    .from("coworking_bookings")
    .select(`
      *,
      pass:coworking_passes(*)
    `)
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    throw new Error("Booking not found");
  }

  // Get access code email template
  const emailContent = getEmailTemplate("access_code", {
    booking,
    recipientName: booking.customer_name,
  });

  // Send email
  const { data: resendData, error: resendError } = await resend.emails.send({
    from: "Bond Coliving <hello@stayatbond.com>",
    to: booking.customer_email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  if (resendError) {
    throw new Error(`Failed to resend email: ${resendError.message}`);
  }

  // Log email
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

  return new Response(
    JSON.stringify({
      success: true,
      message: "Access code email resent successfully",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
