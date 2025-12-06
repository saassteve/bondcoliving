import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const {
      guestName,
      guestEmail,
      guestPhone,
      guestCount,
      specialInstructions,
      segments,
    } = await req.json();

    if (!guestName || !guestEmail || !guestCount || !segments || segments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
        status: "confirmed",
        payment_status: "pending",
        is_split_stay: isSplitStay,
        special_instructions: specialInstructions || null,
        metadata: {
          split_stay: isSplitStay,
          segment_count: segments.length,
        },
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error("Booking creation error:", bookingError);
      return new Response(
        JSON.stringify({
          error: "Failed to create booking",
          details: bookingError?.message || "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
        return new Response(
          JSON.stringify({ error: "Failed to create booking segments" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
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
      : [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Apartment Stay - ${firstSegment.check_in_date} to ${lastSegment.check_out_date}`,
                description: `${guestCount} guest${guestCount > 1 ? "s" : ""}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ];

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

    await supabase
      .from("apartment_payments")
      .insert({
        booking_id: booking.id,
        stripe_checkout_session_id: session.id,
        amount: totalAmount,
        currency: "EUR",
        status: "pending",
      });

    return new Response(
      JSON.stringify({ url: session.url, booking_id: booking.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout:", error);
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
