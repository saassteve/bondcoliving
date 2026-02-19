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

    if (!hasScope(context, "passes:read")) {
      return errorResponse("This API key does not have the passes:read scope", "FORBIDDEN", 403);
    }

    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const activeOnly = params.active_only !== "false";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase
      .from("coworking_passes")
      .select(`
        id, name, slug, price, duration_days, duration_type,
        description, features, is_active, sort_order,
        max_capacity, current_capacity, is_capacity_limited,
        available_from, available_until, is_date_restricted,
        visit_count, expiry_months, created_at, updated_at
      `)
      .order("sort_order", { ascending: true });

    if (activeOnly) query = query.eq("is_active", true);

    const { data, error: dbError } = await query;

    if (dbError) throw dbError;

    await logApiRequest(context.id, "/api-passes", req.method, params, 200, req.headers.get("x-forwarded-for") ?? undefined);

    return jsonResponse({ data: data ?? [], meta: { total: (data ?? []).length } });
  } catch (err) {
    return errorResponse("Internal server error", "SERVER_ERROR", 500, err instanceof Error ? err.message : String(err));
  }
});
