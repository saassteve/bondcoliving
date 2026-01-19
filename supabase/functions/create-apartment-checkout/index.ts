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

    const { guestName, guestEmail, guestPhone, guestCount, specialInstructions, segments } = await req.json();

    if (!guestName || !guestEmail || !guestCount || !segments || segments.length === 0) {
      return errorResponse("Missing required fields", "MISSING_FIELDS", 400);
    }

    const isSplitStay = segments.length > 1;
    const totalAmount = segments.reduce((sum: number, seg: any) => sum + parseFloat(seg.segment_price), 0);
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        apartment_id: firstSegment.apartment_id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        check_in_date: firstSegment.check_in_date,
        check_out_date: lastSegment.check_out_date,
        booking_source: "direct",
        guest_count: guestCount,
        total_amount: totalAmount,
        status: "pending_payment",
        payment_status: "pending",
        payment_required: true,
        is_split_stay: isSplitStay,
        special_instructions: specialInstructions || null,
        metadata: { split_stay: isSplitStay, segment_count: segments.length },
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error("Booking creation error:", bookingError);
      return errorResponse("Failed to create booking", "BOOKING_CREATE_FAILED", 500, { details: bookingError?.message });
    }

    if (isSplitStay) {
      const segmentInserts = segments.map((seg: any, index: number) => ({
        parent_booking_id: booking.id,
        apartment_id: seg.apartment_id,
        segment_order: index,
        check_in_date: seg.check_in_date,
        check_out_date: seg.check_out_date,
        segment_price: parseFloat(seg.segment_price),
      }));

      const { error: segmentError } = await supabase
        .from("apartment_booking_segments")
        .insert(segmentInserts);

      if (segmentError) {
        console.error("Segment creation error:", segmentError);
        await supabase.from("bookings").delete().eq("id", booking.id);
        return errorResponse("Failed to create booking segments", "SEGMENT_CREATE_FAILED", 500);
      }
    }

    const amountInCents = Math.round(totalAmount * 100);

    const lineItems = isSplitStay
      ? await Promise.all(
          segments.map(async (seg: any) => {
            const { data: apartment } = await supabase
              .from("apartments")
              .select("title")
              .eq("id", seg.apartment_id)
              .single();

            return {
              price_data: {
                currency: "eur",
                product_data: {
                  name: `${apartment?.title || "Apartment"} - ${seg.check_in_date} to ${seg.check_out_date}`,
                  description: `Stay from ${seg.check_in_date} to ${seg.check_out_date}`,
                },
                unit_amount: Math.round(parseFloat(seg.segment_price) * 100),
              },
              quantity: 1,
            };
          })
        )
      : [{
          price_data: {
            currency: "eur",
            product_data: {
              name: `Apartment Stay - ${firstSegment.check_in_date} to ${lastSegment.check_out_date}`,
              description: `${guestCount} guest${guestCount > 1 ? "s" : ""}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/book/success?booking_id=${booking.id}`,
      cancel_url: `${req.headers.get("origin")}/book`,
      customer_email: guestEmail,
      metadata: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        guest_name: guestName,
        is_split_stay: isSplitStay.toString(),
      },
    });

    await supabase.from("apartment_payments").insert({
      booking_id: booking.id,
      stripe_checkout_session_id: session.id,
      amount: totalAmount,
      currency: "EUR",
      status: "pending",
    });

    return jsonResponse({ url: session.url, booking_id: booking.id });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", "INTERNAL_ERROR", 500);
  }
});
