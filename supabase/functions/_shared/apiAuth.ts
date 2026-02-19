import { createClient } from "npm:@supabase/supabase-js@2";
import { errorResponse } from "./response.ts";

export interface ApiKeyContext {
  id: string;
  name: string;
  scopes: string[];
}

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function authenticateApiKey(
  req: Request
): Promise<{ context: ApiKeyContext; error: null } | { context: null; error: Response }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      context: null,
      error: errorResponse(
        "Missing or invalid Authorization header. Use: Authorization: Bearer <api_key>",
        "MISSING_AUTH",
        401
      ),
    };
  }

  const plainKey = authHeader.slice(7).trim();
  if (!plainKey) {
    return {
      context: null,
      error: errorResponse("API key is empty", "INVALID_KEY", 401),
    };
  }

  const keyHash = await sha256Hex(plainKey);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.rpc("validate_api_key", {
    p_key_hash: keyHash,
  });

  if (error || !data || data.length === 0) {
    return {
      context: null,
      error: errorResponse("Invalid or inactive API key", "INVALID_KEY", 401),
    };
  }

  const keyRecord = data[0];

  await supabase.rpc("update_api_key_usage", { p_key_hash: keyHash });

  return {
    context: {
      id: keyRecord.id,
      name: keyRecord.name,
      scopes: keyRecord.scopes,
    },
    error: null,
  };
}

export function hasScope(context: ApiKeyContext, required: string): boolean {
  return context.scopes.includes(required);
}

export async function logApiRequest(
  apiKeyId: string,
  endpoint: string,
  method: string,
  queryParams: Record<string, string>,
  responseStatus: number,
  ipAddress?: string
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase.from("api_request_logs").insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    query_params: queryParams,
    response_status: responseStatus,
    ip_address: ipAddress ?? null,
  });
}
