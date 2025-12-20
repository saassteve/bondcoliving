import { corsHeaders } from "./cors.ts";

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(
  message: string,
  code: string,
  status = 400,
  details?: unknown
): Response {
  return jsonResponse({ error: message, code, details }, status);
}

export function successResponse(data: unknown): Response {
  return jsonResponse({ success: true, ...data });
}
