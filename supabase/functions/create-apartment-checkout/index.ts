import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function sanitizeString(str: string, maxLength: number): string {
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

function calculateSegmentPrice(apartment: any, checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    throw new Error("Invalid date range");
  }

  const isShortTerm = apartment.accommodation_type === 'short_term';

  if (isShortTerm) {
    return (apartment.nightly_price || 0) * nights;
  } else {
    const monthlyPrice = apartment.price || 0;
    const fullMonths = Math.floor(nights / 30);
    const remainingDays = nights % 30;
    const dailyRate = monthlyPrice / 30;

    return (fullMonths * monthlyPrice) + (remainingDays * dailyRate);
  }
}

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

    if (!validateEmail(guestEmail)) {
      return errorResponse("Invalid email address", "INVALID_EMAIL", 400);
    }

    if (guestCount < 1 || guestCount > 10) {
      return errorResponse("Guest count must be between 1 and 10", "INVALID_GUEST_COUNT", 400);
    }

    const sanitizedGuestName = sanitizeString(guestName, 255);
    const sanitizedGuestPhone = guestPhone ? sanitizeString(guestPhone, 50) : null;
    const sanitizedInstructions = specialInstructions ? sanitizeString(specialInstructions, 2000) : null;

    if (sanitizedGuestName.length < 2) {
      return errorResponse("Guest name must be at least 2 characters", "INVALID_NAME", 400);
    }

    // Validate all segments and dates
    for (const seg of segments) {
      if (!seg.apartment_id || !seg.check_in_date || !seg.check_out_date) {
        return errorResponse("Invalid segment data", "INVALID_SEGMENT", 400);
      }
      if (!validateDate(seg.check_in_date) || !validateDate(seg.check_out_date)) {
        return errorResponse("Invalid date format", "INVALID_DATE", 400);
      }
    }

    // Recalculate prices server-side - NEVER trust client-provided prices
    const validatedSegments = await Promise.all(
      segments.map(async (seg: any, index: number) => {
        const { data: apartment, error: aptError } = await supabase
          .from("apartments")
          .select("id, title, price, nightly_price, accommodation_type")
          .eq("id", seg.apartment_id)
          .maybeSingle();

        if (aptError || !apartment) {
          throw new Error(`Apartment not found: ${seg.apartment_id}`);
        }

        const serverCalculatedPrice = calculateSegmentPrice(
          apartment,
          seg.check_in_date,
          seg.check_out_date
        );

        return {
          apartment_id: apartment.id,
          apartment_title: apartment.title,
          check_in_date: seg.check_in_date,
          check_out_date: seg.check_out_date,
          segment_price: serverCalculatedPrice,
          segment_order: index,
        };
      })
    );

    const isSplitStay = validatedSegments.length > 1;
    const totalAmount = validatedSegments.reduce((sum, seg) => sum + seg.segment_price, 0);
    const firstSegment = validatedSegments[0];
    const lastSegment = validatedSegments[validatedSegments.length - 1];

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        apartment_id: firstSegment.apartment_id,
        guest_name: sanitizedGuestName,
        guest_email: guestEmail,
        guest_phone: sanitizedGuestPhone,
        check_in_date: firstSegment.check_in_date,
        check_out_date: lastSegment.check_out_date,
        booking_source: "direct",
        guest_count: guestCount,
        total_amount: totalAmount,
        status: "pending_payment",
        payment_status: "pending",
        payment_required: true,
        is_split_stay: isSplitStay,
        special_instructions: sanitizedInstructions,
        metadata: { split_stay: isSplitStay, segment_count: validatedSegments.length },
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return errorResponse("Failed to create booking", "BOOKING_CREATE_FAILED", 500);
    }

    if (isSplitStay) {
      const segmentInserts = validatedSegments.map((seg) => ({
        parent_booking_id: booking.id,
        apartment_id: seg.apartment_id,
        segment_order: seg.segment_order,
        check_in_date: seg.check_in_date,
        check_out_date: seg.check_out_date,
        segment_price: seg.segment_price,
      }));

      const { error: segmentError } = await supabase
        .from("apartment_booking_segments")
        .insert(segmentInserts);

      if (segmentError) {
        await supabase.from("bookings").delete().eq("id", booking.id);
        return errorResponse("Failed to create booking segments", "SEGMENT_CREATE_FAILED", 500);
      }
    }

    const lineItems = validatedSegments.map((seg) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: `${seg.apartment_title} - ${seg.check_in_date} to ${seg.check_out_date}`,
          description: `Stay from ${seg.check_in_date} to ${seg.check_out_date}`,
        },
        unit_amount: Math.round(seg.segment_price * 100),
      },
      quantity: 1,
    }));

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
        guest_name: sanitizedGuestName,
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
    console.error("Checkout error");
    return errorResponse("Unable to process booking request", "INTERNAL_ERROR", 500);
  }
});
