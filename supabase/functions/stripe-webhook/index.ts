import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sendEmail(
  supabaseUrl: string,
  supabaseServiceKey: string,
  emailData: {
    emailType: string;
    bookingId?: string;
    recipientEmail?: string;
    recipientName?: string;
  }
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const response = await fetch(
    `${supabaseUrl}/functions/v1/send-coworking-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(emailData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send email");
  }

  return await response.json();
}

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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          stripeWebhookSecret
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Webhook signature verification failed" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      try {
        event = JSON.parse(body);
      } catch (err) {
        console.error("Failed to parse webhook body:", err);
        return new Response(
          JSON.stringify({ error: "Invalid request body" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
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

        const { data: paymentUpdate, error: paymentError } = await supabase
          .from("coworking_payments")
          .update({
            stripe_payment_intent_id: session.payment_intent as string,
            status: "succeeded",
            payment_method: session.payment_method_types?.[0] || null,
            metadata: {
              session_id: session.id,
              customer_email: session.customer_email,
            },
          })
          .eq("stripe_checkout_session_id", session.id)
          .select();

        if (paymentError) {
          console.error("Failed to update payment:", paymentError);
        } else {
          console.log("Payment updated successfully:", paymentUpdate);
        }

        const { data: bookingUpdate, error: bookingError } = await supabase
          .from("coworking_bookings")
          .update({
            payment_status: "paid",
            booking_status: "confirmed",
          })
          .eq("id", bookingId)
          .select();

        if (bookingError) {
          console.error("Failed to update booking:", bookingError);
          throw new Error(`Booking update failed: ${bookingError.message}`);
        } else {
          console.log("Booking updated successfully:", bookingUpdate);
        }

        console.log("Updated booking and payment for:", bookingId);

        try {
          console.log("Attempting to send booking confirmation email for:", bookingId);
          const confirmationResult = await sendEmail(supabaseUrl, supabaseServiceKey, {
            emailType: "booking_confirmation",
            bookingId: bookingId,
          });
          console.log("Sent booking confirmation email successfully:", confirmationResult);
        } catch (emailError) {
          console.error("Failed to send confirmation email:", {
            error: emailError,
            message: emailError instanceof Error ? emailError.message : String(emailError),
            bookingId: bookingId
          });
        }

        try {
          const adminEmail = Deno.env.get("ADMIN_EMAIL") || "hello@stayatbond.com";
          console.log("Attempting to send admin notification to:", adminEmail);
          const adminResult = await sendEmail(supabaseUrl, supabaseServiceKey, {
            emailType: "admin_notification",
            bookingId: bookingId,
            recipientEmail: adminEmail,
            recipientName: "Admin",
          });
          console.log("Sent admin notification successfully:", adminResult);
        } catch (emailError) {
          console.error("Failed to send admin notification:", {
            error: emailError,
            message: emailError instanceof Error ? emailError.message : String(emailError),
            bookingId: bookingId,
            adminEmail: Deno.env.get("ADMIN_EMAIL") || "hello@stayatbond.com"
          });
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

        await supabase
          .from("coworking_payments")
          .update({ status: "cancelled" })
          .eq("stripe_checkout_session_id", session.id);

        await supabase
          .from("coworking_bookings")
          .update({
            payment_status: "failed",
            booking_status: "cancelled",
          })
          .eq("id", bookingId);

        console.log("Cancelled booking due to expired session:", bookingId);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);

        await supabase
          .from("coworking_payments")
          .update({
            status: "succeeded",
            payment_method: paymentIntent.payment_method_types?.[0] || null,
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent failed:", paymentIntent.id);

        await supabase
          .from("coworking_payments")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        const { data: payment } = await supabase
          .from("coworking_payments")
          .select("booking_id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .single();

        if (payment) {
          await supabase
            .from("coworking_bookings")
            .update({
              payment_status: "failed",
              booking_status: "cancelled",
            })
            .eq("id", payment.booking_id);

          try {
            await sendEmail(supabaseUrl, supabaseServiceKey, {
              emailType: "payment_failed",
              bookingId: payment.booking_id,
            });
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
          await supabase
            .from("coworking_payments")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", charge.payment_intent as string);

          const { data: payment } = await supabase
            .from("coworking_payments")
            .select("booking_id")
            .eq("stripe_payment_intent_id", charge.payment_intent as string)
            .single();

          if (payment) {
            await supabase
              .from("coworking_bookings")
              .update({
                payment_status: "refunded",
                booking_status: "cancelled",
              })
              .eq("id", payment.booking_id);

            try {
              await sendEmail(supabaseUrl, supabaseServiceKey, {
                emailType: "booking_cancelled",
                bookingId: payment.booking_id,
              });
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

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
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
