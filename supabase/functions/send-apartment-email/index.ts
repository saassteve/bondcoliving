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
    const { emailType, bookingId, recipientEmail, recipientName } = body;

    console.log("Processing apartment email request:", { emailType, bookingId, recipientEmail });

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

    if (!bookingId) {
      console.error("Missing bookingId in request body");
      return new Response(
        JSON.stringify({
          error: "Booking ID is required",
          code: "MISSING_BOOKING_ID",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        apartment:apartments(*)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      console.error("Error fetching booking:", bookingError);
      return new Response(
        JSON.stringify({
          error: `Booking not found: ${bookingError.message}`,
          code: "BOOKING_NOT_FOUND",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!booking) {
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

    let segments: any[] = [];
    if (booking.is_split_stay) {
      const { data: segmentData } = await supabase
        .from("apartment_booking_segments")
        .select(`
          *,
          apartment:apartments(*)
        `)
        .eq("parent_booking_id", bookingId)
        .order("check_in_date", { ascending: true });

      segments = segmentData || [];
    }

    const toEmail = recipientEmail || booking.guest_email;
    const toName = recipientName || booking.guest_name;

    if (!toEmail) {
      console.error("Missing recipient email");
      return new Response(
        JSON.stringify({
          error: "Recipient email is required. Check that booking has guest_email.",
          code: "MISSING_RECIPIENT_EMAIL",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
    console.error("Error processing apartment email:", error);
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