import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  return null;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, status = 400): Response {
  return jsonResponse({ error: message, code }, status);
}

async function queueEmail(
  supabase: any,
  emailType: string,
  recipientEmail: string,
  recipientName: string | null,
  bookingId: string,
  bookingType: "coworking" | "apartment",
  priority: number = 5
): Promise<void> {
  const { error } = await supabase.rpc("queue_email", {
    p_email_type: emailType,
    p_recipient_email: recipientEmail,
    p_recipient_name: recipientName,
    p_booking_id: bookingId,
    p_booking_type: bookingType,
    p_priority: priority,
    p_metadata: {},
  });

  if (error) {
    console.error("Failed to queue email:", error);
    throw error;
  }
  console.log(`Queued ${emailType} email for ${recipientEmail}`);
}

async function sendEmailDirect(
  supabaseUrl: string,
  supabaseServiceKey: string,
  endpoint: string,
  emailData: Record<string, any>
): Promise<any> {
  const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send email");
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return errorResponse("Webhook signature verification failed", "SIGNATURE_FAILED", 400);
      }
    } else {
      try {
        event = JSON.parse(body);
      } catch (err) {
        console.error("Failed to parse webhook body:", err);
        return errorResponse("Invalid request body", "INVALID_BODY", 400);
      }
    }

    console.log("Webhook event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        const bookingId = session.metadata?.booking_id;
        if (!bookingId) {
          console.error("No booking_id in session metadata");
          break;
        }

        const isApartmentBooking = session.metadata?.is_split_stay !== undefined ||
                                   session.metadata?.guest_name !== undefined;

        if (isApartmentBooking) {
          await handleApartmentCheckout(supabase, supabaseUrl, supabaseServiceKey, session, bookingId);
        } else {
          await handleCoworkingCheckout(supabase, supabaseUrl, supabaseServiceKey, session, bookingId);
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session expired:", session.id);

        const bookingId = session.metadata?.booking_id;
        if (!bookingId) {
          console.error("No booking_id in session metadata");
          break;
        }

        const isApartmentBooking = session.metadata?.is_split_stay !== undefined ||
                                   session.metadata?.guest_name !== undefined;

        if (isApartmentBooking) {
          await supabase.from("apartment_payments").update({ status: "cancelled" }).eq("stripe_checkout_session_id", session.id);
          await supabase.from("bookings").update({ payment_status: "failed", status: "cancelled" }).eq("id", bookingId);
          console.log("Cancelled apartment booking due to expired session:", bookingId);
        } else {
          await supabase.from("coworking_payments").update({ status: "cancelled" }).eq("stripe_checkout_session_id", session.id);
          await supabase.from("coworking_bookings").update({ payment_status: "failed", booking_status: "cancelled" }).eq("id", bookingId);
          console.log("Cancelled booking due to expired session:", bookingId);
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        await supabase.from("coworking_payments").update({
          status: "succeeded",
          payment_method: paymentIntent.payment_method_types?.[0] || null,
        }).eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent failed:", paymentIntent.id);

        await supabase.from("coworking_payments").update({ status: "failed" }).eq("stripe_payment_intent_id", paymentIntent.id);

        const { data: payment } = await supabase.from("coworking_payments").select("booking_id").eq("stripe_payment_intent_id", paymentIntent.id).single();

        if (payment) {
          await supabase.from("coworking_bookings").update({ payment_status: "failed", booking_status: "cancelled" }).eq("id", payment.booking_id);
          try {
            await sendEmailDirect(supabaseUrl, supabaseServiceKey, "send-coworking-email", { emailType: "payment_failed", bookingId: payment.booking_id });
            console.log("Sent payment failed email for:", payment.booking_id);
          } catch (emailError) {
            console.error("Failed to send payment failed email:", emailError);
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge refunded:", charge.id);

        if (charge.payment_intent) {
          await supabase.from("coworking_payments").update({ status: "refunded" }).eq("stripe_payment_intent_id", charge.payment_intent as string);

          const { data: payment } = await supabase.from("coworking_payments").select("booking_id").eq("stripe_payment_intent_id", charge.payment_intent as string).single();

          if (payment) {
            await supabase.from("coworking_bookings").update({ payment_status: "refunded", booking_status: "cancelled" }).eq("id", payment.booking_id);
            try {
              await sendEmailDirect(supabaseUrl, supabaseServiceKey, "send-coworking-email", { emailType: "booking_cancelled", bookingId: payment.booking_id });
              console.log("Sent booking cancelled email for:", payment.booking_id);
            } catch (emailError) {
              console.error("Failed to send cancelled email:", emailError);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", "INTERNAL_ERROR", 500);
  }
});

async function handleApartmentCheckout(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  session: Stripe.Checkout.Session,
  bookingId: string
) {
  console.log("Processing apartment booking:", bookingId);

  const { error: paymentError } = await supabase
    .from("apartment_payments")
    .update({
      stripe_payment_intent_id: session.payment_intent as string,
      status: "succeeded",
      payment_method: session.payment_method_types?.[0] || null,
      metadata: { session_id: session.id, customer_email: session.customer_email },
    })
    .eq("stripe_checkout_session_id", session.id);

  if (paymentError) {
    console.error("Failed to update apartment payment:", paymentError);
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .update({ payment_status: "paid" })
    .eq("id", bookingId)
    .select()
    .single();

  if (bookingError) {
    console.error("Failed to update apartment booking:", bookingError);
    throw new Error(`Apartment booking update failed: ${bookingError.message}`);
  }

  if (booking.is_split_stay) {
    const { data: segments } = await supabase.from("apartment_booking_segments").select("*").eq("parent_booking_id", bookingId);

    for (const segment of segments || []) {
      await updateAvailability(supabase, segment.apartment_id, segment.check_in_date, segment.check_out_date, booking.booking_reference);
    }
  } else {
    await updateAvailability(supabase, booking.apartment_id, booking.check_in_date, booking.check_out_date, booking.booking_reference);
  }

  console.log("Updated apartment availability for booking:", bookingId);

  const guestEmail = booking?.guest_email || session.customer_email;
  const guestName = booking?.guest_name || session.metadata?.guest_name;
  const adminEmail = Deno.env.get("ADMIN_EMAIL") || "hello@stayatbond.com";

  try {
    await queueEmail(supabase, "booking_confirmation", guestEmail, guestName, bookingId, "apartment", 10);
    await queueEmail(supabase, "admin_notification", adminEmail, "Admin", bookingId, "apartment", 5);
    console.log("Queued apartment confirmation and admin emails");
  } catch (queueError) {
    console.error("Failed to queue apartment emails, trying direct send:", queueError);
    try {
      await sendEmailDirect(supabaseUrl, supabaseServiceKey, "send-apartment-email", { emailType: "booking_confirmation", bookingId });
      await sendEmailDirect(supabaseUrl, supabaseServiceKey, "send-apartment-email", { emailType: "admin_notification", bookingId, recipientEmail: adminEmail, recipientName: "Admin" });
    } catch (emailError) {
      console.error("Failed to send apartment emails directly:", emailError);
    }
  }
}

async function handleCoworkingCheckout(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  session: Stripe.Checkout.Session,
  bookingId: string
) {
  console.log("Processing coworking booking:", bookingId);

  const { error: paymentError } = await supabase
    .from("coworking_payments")
    .update({
      stripe_payment_intent_id: session.payment_intent as string,
      status: "succeeded",
      payment_method: session.payment_method_types?.[0] || null,
      metadata: { session_id: session.id, customer_email: session.customer_email },
    })
    .eq("stripe_checkout_session_id", session.id);

  if (paymentError) {
    console.error("Failed to update payment:", paymentError);
  }

  const { error: bookingError } = await supabase
    .from("coworking_bookings")
    .update({ payment_status: "paid", booking_status: "confirmed" })
    .eq("id", bookingId);

  if (bookingError) {
    console.error("Failed to update booking:", bookingError);
    throw new Error(`Booking update failed: ${bookingError.message}`);
  }

  console.log("Updated booking and payment for:", bookingId);

  let assignedCode: string | null = null;
  try {
    const { data, error: codeError } = await supabase.rpc("assign_coworking_pass_code", { p_booking_id: bookingId });

    if (codeError) {
      console.error("Failed to assign access code:", codeError);
    } else if (data) {
      assignedCode = data;
      await supabase.from("coworking_bookings").update({ access_code: assignedCode }).eq("id", bookingId);
      console.log("Assigned access code:", assignedCode);
    } else {
      console.warn("No available access codes for booking:", bookingId);
    }
  } catch (codeError) {
    console.error("Error in access code assignment:", codeError);
  }

  const { data: booking } = await supabase
    .from("coworking_bookings")
    .select("customer_email, customer_name")
    .eq("id", bookingId)
    .single();

  const customerEmail = booking?.customer_email || session.customer_email;
  const customerName = booking?.customer_name || session.metadata?.customer_name;
  const adminEmail = Deno.env.get("ADMIN_EMAIL") || "hello@stayatbond.com";

  try {
    await queueEmail(supabase, "booking_confirmation", customerEmail, customerName, bookingId, "coworking", 10);
    await queueEmail(supabase, "admin_notification", adminEmail, "Admin", bookingId, "coworking", 5);
    console.log("Queued confirmation and admin emails");
  } catch (queueError) {
    console.error("Failed to queue emails, trying direct send:", queueError);
    try {
      await sendEmailDirect(supabaseUrl, supabaseServiceKey, "send-coworking-email", { emailType: "booking_confirmation", bookingId });
      await sendEmailDirect(supabaseUrl, supabaseServiceKey, "send-coworking-email", { emailType: "admin_notification", bookingId, recipientEmail: adminEmail, recipientName: "Admin" });
    } catch (emailError) {
      console.error("Failed to send emails directly:", emailError);
    }
  }
}

async function updateAvailability(
  supabase: any,
  apartmentId: string,
  checkInDate: string,
  checkOutDate: string,
  bookingReference: string
) {
  const currentDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);

  while (currentDate < endDate) {
    await supabase.from("apartment_availability").upsert({
      apartment_id: apartmentId,
      date: currentDate.toISOString().split("T")[0],
      status: "booked",
      booking_reference: bookingReference,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
}
