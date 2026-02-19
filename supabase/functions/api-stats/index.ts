import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";
import { authenticateApiKey, hasScope, logApiRequest } from "../_shared/apiAuth.ts";

Deno.serve(async (req: Request) => {
  try {
    const corsResult = handleCors(req);
    if (corsResult) return corsResult;

    const { context, error } = await authenticateApiKey(req);
    if (error) return error;

    if (!hasScope(context, "stats:read")) {
      return errorResponse("This API key does not have the stats:read scope", "FORBIDDEN", 403);
    }

    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const startDate = params.start_date ?? null;
    const endDate = params.end_date ?? null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let coworkingQuery = supabase
      .from("coworking_bookings")
      .select("total_amount, payment_status, booking_status, created_at, pass:coworking_passes(name)");

    let apartmentQuery = supabase
      .from("bookings")
      .select("total_amount, payment_status, status, check_in_date, check_out_date, created_at");

    if (startDate) {
      coworkingQuery = coworkingQuery.gte("created_at", startDate);
      apartmentQuery = apartmentQuery.gte("created_at", startDate);
    }
    if (endDate) {
      coworkingQuery = coworkingQuery.lte("created_at", endDate);
      apartmentQuery = apartmentQuery.lte("created_at", endDate);
    }

    const [{ data: coworkingData, error: cwErr }, { data: apartmentData, error: apErr }] =
      await Promise.all([coworkingQuery, apartmentQuery]);

    if (cwErr) throw cwErr;
    if (apErr) throw apErr;

    const coworkingPaid = (coworkingData ?? []).filter((b) => b.payment_status === "paid");
    const coworkingRevenue = coworkingPaid.reduce((sum, b) => sum + (b.total_amount ?? 0), 0);
    const coworkingByPass: Record<string, number> = {};
    for (const b of coworkingPaid) {
      const passName = (b.pass as { name: string } | null)?.name ?? "Unknown";
      coworkingByPass[passName] = (coworkingByPass[passName] ?? 0) + (b.total_amount ?? 0);
    }

    const apartmentPaid = (apartmentData ?? []).filter((b) => b.payment_status === "paid");
    const apartmentRevenue = apartmentPaid.reduce((sum, b) => sum + (b.total_amount ?? 0), 0);

    const computeNights = (checkIn: string | null, checkOut: string | null): number => {
      if (!checkIn || !checkOut) return 0;
      const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
    };

    const allCoworking = coworkingData ?? [];
    const allApartment = apartmentData ?? [];

    const result = {
      coworking: {
        revenue: coworkingRevenue,
        bookings_total: allCoworking.length,
        bookings_paid: coworkingPaid.length,
        bookings_pending: allCoworking.filter((b) => b.booking_status === "pending").length,
        bookings_confirmed: allCoworking.filter((b) => b.booking_status === "confirmed").length,
        bookings_cancelled: allCoworking.filter((b) => b.booking_status === "cancelled").length,
        revenue_by_pass: coworkingByPass,
      },
      apartment: {
        revenue: apartmentRevenue,
        bookings_total: allApartment.length,
        bookings_paid: apartmentPaid.length,
        bookings_pending: allApartment.filter((b) => b.status === "pending").length,
        bookings_confirmed: allApartment.filter((b) => b.status === "confirmed").length,
        bookings_cancelled: allApartment.filter((b) => b.status === "cancelled").length,
        total_nights: apartmentPaid.reduce((sum, b) => sum + computeNights(b.check_in_date, b.check_out_date), 0),
      },
      combined: {
        total_revenue: coworkingRevenue + apartmentRevenue,
        total_bookings: allCoworking.length + allApartment.length,
      },
      filters: { start_date: startDate, end_date: endDate },
    };

    await logApiRequest(context.id, "/api-stats", req.method, params, 200, req.headers.get("x-forwarded-for") ?? undefined);

    return jsonResponse({ data: result });
  } catch (err) {
    return errorResponse("Internal server error", "SERVER_ERROR", 500, err instanceof Error ? err.message : String(err));
  }
});
