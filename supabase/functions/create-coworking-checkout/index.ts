import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const { passId, customerName, customerEmail, customerPhone, startDate, specialNotes } = await req.json();

    if (!passId || !customerName || !customerEmail || !startDate) {
      return errorResponse("Missing required fields", "MISSING_FIELDS", 400);
    }

    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return errorResponse("Bookings cannot be made for past dates", "PAST_DATE", 400);
    }

    const { data: pass, error: passError } = await supabase
      .from("coworking_passes")
      .select("*")
      .eq("id", passId)
      .eq("is_active", true)
      .maybeSingle();

    if (passError || !pass) {
      return errorResponse("Pass not found or not available", "PASS_NOT_FOUND", 404);
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + pass.duration_days);
    const endDate = endDateObj.toISOString().split("T")[0];

    const { data: booking, error: bookingError } = await supabase
      .from("coworking_bookings")
      .insert({
        pass_id: passId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        start_date: startDate,
        end_date: endDate,
        total_amount: pass.price,
        currency: "EUR",
        payment_status: "pending",
        booking_status: "pending",
        special_notes: specialNotes || null,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error("Booking creation error:", bookingError);
      return errorResponse("Failed to create booking", "BOOKING_CREATE_FAILED", 500, { details: bookingError?.message, code: bookingError?.code });
    }

    const amountInCents = Math.round(parseFloat(pass.price) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: pass.name,
            description: `${pass.description} - Valid from ${startDate} to ${endDate}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/coworking/booking/success?booking_id=${booking.id}`,
      cancel_url: `${req.headers.get("origin")}/coworking/book?pass=${pass.slug}`,
      customer_email: customerEmail,
      metadata: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        pass_id: passId,
        customer_name: customerName,
      },
    });

    await supabase.from("coworking_payments").insert({
      booking_id: booking.id,
      stripe_checkout_session_id: session.id,
      amount: pass.price,
      currency: "EUR",
      status: "pending",
    });

    return jsonResponse({ url: session.url, booking_id: booking.id });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", "INTERNAL_ERROR", 500);
  }
});
