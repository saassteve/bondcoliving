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
      console.error("Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({
          error: "Email service not configured. Please contact administrator.",
          code: "MISSING_RESEND_API_KEY",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const body = await req.json();
    const { emailType, bookingId, recipientEmail, recipientName, resendEmail } = body;

    console.log("Processing email request:", { emailType, bookingId, recipientEmail });

    // Validate required fields
    if (!emailType) {
      console.error("Missing emailType in request body");
      return new Response(
        JSON.stringify({
          error: "Email type is required",
          code: "MISSING_EMAIL_TYPE",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
        return new Response(
          JSON.stringify({
            error: `Booking not found: ${error.message}`,
            code: "BOOKING_NOT_FOUND",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!data) {
        console.error("Booking not found:", bookingId);
        return new Response(
          JSON.stringify({
            error: "Booking not found",
            code: "BOOKING_NOT_FOUND",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      booking = data;
    }

    // Determine recipient from booking or params
    const toEmail = recipientEmail || booking?.customer_email;
    const toName = recipientName || booking?.customer_name;

    if (!toEmail) {
      console.error("Missing recipient email");
      return new Response(
        JSON.stringify({
          error: "Recipient email is required. Check that booking has customer_email.",
          code: "MISSING_RECIPIENT_EMAIL",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate email has access code for access_code email type
    if (emailType === "access_code" && !booking?.access_code) {
      console.error("Missing access code for booking:", bookingId);
      return new Response(
        JSON.stringify({
          error: "Cannot send access code email: booking has no access code set.",
          code: "MISSING_ACCESS_CODE",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

      return new Response(
        JSON.stringify({
          error: `Failed to send email via Resend: ${resendError.message}`,
          code: "RESEND_ERROR",
          details: resendError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.stack : undefined,
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
    console.error("Booking not found for resend:", bookingId, error);
    return new Response(
      JSON.stringify({
        error: "Booking not found",
        code: "BOOKING_NOT_FOUND",
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!booking.access_code) {
    console.error("No access code set for booking:", bookingId);
    return new Response(
      JSON.stringify({
        error: "Cannot resend access code: booking has no access code set.",
        code: "MISSING_ACCESS_CODE",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

    return new Response(
      JSON.stringify({
        error: `Failed to resend email: ${resendError.message}`,
        code: "RESEND_ERROR",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
