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

    if (!hasScope(context, "bookings:read")) {
      return errorResponse("This API key does not have the bookings:read scope", "FORBIDDEN", 403);
    }

    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());

    const status = params.status ?? null;
    const email = params.email ?? null;
    const reference = params.reference ?? null;
    const startDate = params.start_date ?? null;
    const endDate = params.end_date ?? null;
    const type = params.type ?? "coworking";
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? "50", 10)));
    const offset = (page - 1) * limit;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result: unknown;

    if (type === "apartment") {
      let query = supabase
        .from("bookings")
        .select(`
          id, booking_reference, guest_name, guest_email, guest_phone,
          check_in_date, check_out_date, total_amount, payment_status,
          status, special_instructions, guest_count, is_split_stay,
          created_at, updated_at,
          apartment:apartments(id, title, building_id)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq("status", status);
      if (email) query = query.ilike("guest_email", `%${email}%`);
      if (reference) query = query.eq("booking_reference", reference);
      if (startDate) query = query.gte("check_in_date", startDate);
      if (endDate) query = query.lte("check_out_date", endDate);

      const { data, error: dbError, count } = await query;

      if (dbError) throw dbError;

      result = {
        data: data ?? [],
        meta: {
          total: count ?? 0,
          page,
          limit,
          pages: Math.ceil((count ?? 0) / limit),
          type: "apartment",
        },
      };
    } else {
      let query = supabase
        .from("coworking_bookings")
        .select(`
          id, booking_reference, customer_name, customer_email, customer_phone,
          start_date, end_date, total_amount, currency, payment_status,
          booking_status, special_notes, access_code, created_at, updated_at,
          pass:coworking_passes(id, name, slug, price)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq("booking_status", status);
      if (email) query = query.ilike("customer_email", `%${email}%`);
      if (reference) query = query.eq("booking_reference", reference);
      if (startDate) query = query.gte("start_date", startDate);
      if (endDate) query = query.lte("end_date", endDate);

      const { data, error: dbError, count } = await query;

      if (dbError) throw dbError;

      result = {
        data: data ?? [],
        meta: {
          total: count ?? 0,
          page,
          limit,
          pages: Math.ceil((count ?? 0) / limit),
          type: "coworking",
        },
      };
    }

    await logApiRequest(context.id, "/api-bookings", req.method, params, 200, req.headers.get("x-forwarded-for") ?? undefined);

    return jsonResponse(result, 200);
  } catch (err) {
    return errorResponse("Internal server error", "SERVER_ERROR", 500, err instanceof Error ? err.message : String(err));
  }
});
