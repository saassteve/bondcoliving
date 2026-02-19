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

    if (!hasScope(context, "customers:read")) {
      return errorResponse("This API key does not have the customers:read scope", "FORBIDDEN", 403);
    }

    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const search = params.search ?? null;
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? "50", 10)));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [{ data: cwData, error: cwErr }, { data: apData, error: apErr }] = await Promise.all([
      supabase
        .from("coworking_bookings")
        .select("customer_name, customer_email, customer_phone, total_amount, payment_status, created_at"),
      supabase
        .from("bookings")
        .select("guest_name, guest_email, guest_phone, total_amount, payment_status, created_at"),
    ]);

    if (cwErr) throw cwErr;
    if (apErr) throw apErr;

    const customerMap = new Map<string, {
      name: string;
      email: string;
      phone: string | null;
      coworking_bookings: number;
      apartment_bookings: number;
      total_bookings: number;
      total_spent: number;
      last_booking_at: string;
    }>();

    for (const b of cwData ?? []) {
      const email = b.customer_email?.toLowerCase();
      if (!email) continue;
      const existing = customerMap.get(email);
      const amount = b.payment_status === "paid" ? (b.total_amount ?? 0) : 0;
      if (existing) {
        existing.coworking_bookings += 1;
        existing.total_bookings += 1;
        existing.total_spent += amount;
        if (b.created_at > existing.last_booking_at) existing.last_booking_at = b.created_at;
      } else {
        customerMap.set(email, {
          name: b.customer_name ?? "",
          email,
          phone: b.customer_phone ?? null,
          coworking_bookings: 1,
          apartment_bookings: 0,
          total_bookings: 1,
          total_spent: amount,
          last_booking_at: b.created_at,
        });
      }
    }

    for (const b of apData ?? []) {
      const email = b.guest_email?.toLowerCase();
      if (!email) continue;
      const existing = customerMap.get(email);
      const amount = b.payment_status === "paid" ? (b.total_amount ?? 0) : 0;
      if (existing) {
        existing.apartment_bookings += 1;
        existing.total_bookings += 1;
        existing.total_spent += amount;
        if (b.created_at > existing.last_booking_at) existing.last_booking_at = b.created_at;
      } else {
        customerMap.set(email, {
          name: b.guest_name ?? "",
          email,
          phone: b.guest_phone ?? null,
          coworking_bookings: 0,
          apartment_bookings: 1,
          total_bookings: 1,
          total_spent: amount,
          last_booking_at: b.created_at,
        });
      }
    }

    let customers = Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.last_booking_at).getTime() - new Date(a.last_booking_at).getTime()
    );

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) => c.email.includes(q) || c.name.toLowerCase().includes(q)
      );
    }

    const total = customers.length;
    const offset = (page - 1) * limit;
    const paginated = customers.slice(offset, offset + limit);

    await logApiRequest(context.id, "/api-customers", req.method, params, 200, req.headers.get("x-forwarded-for") ?? undefined);

    return jsonResponse({
      data: paginated,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return errorResponse("Internal server error", "SERVER_ERROR", 500, err instanceof Error ? err.message : String(err));
  }
});
