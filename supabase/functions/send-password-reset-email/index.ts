import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { getPasswordResetTemplate, getPasswordResetSuccessTemplate } from "./templates.ts";

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(email: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (entry && entry.resetTime < now) {
    rateLimitMap.delete(email);
  }

  const current = rateLimitMap.get(email);

  if (!current) {
    rateLimitMap.set(email, { attempts: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }

  if (current.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  current.attempts++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - current.attempts };
}

setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(email);
    }
  }
}, 10 * 60 * 1000);

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      return errorResponse("Email service not configured. Please contact administrator.", "MISSING_RESEND_API_KEY", 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const body = await req.json();
    const { action, email, userType, token, newPassword } = body;

    console.log("Processing password reset request:", { action, email, userType });

    if (!action || !['request', 'reset', 'validate'].includes(action)) {
      return errorResponse("Invalid action. Must be 'request', 'reset', or 'validate'", "INVALID_ACTION", 400);
    }

    if (action === 'request') {
      return await handlePasswordResetRequest(supabase, resend, email, userType);
    }

    if (action === 'validate') {
      return await handleTokenValidation(supabase, token);
    }

    if (action === 'reset') {
      return await handlePasswordReset(supabase, resend, token, newPassword);
    }

    return errorResponse("Unknown action", "UNKNOWN_ACTION", 400);
  } catch (error) {
    console.error("Error processing password reset:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", "INTERNAL_ERROR", 500);
  }
});

async function handlePasswordResetRequest(
  supabase: any,
  resend: any,
  email: string,
  userType: 'admin' | 'guest'
) {
  const genericSuccessResponse = jsonResponse({
    success: true,
    message: "If an account exists with that email, you'll receive reset instructions within 5 minutes.",
  });

  if (!email || !userType) {
    return errorResponse("Email and userType are required", "MISSING_REQUIRED_FIELDS", 400);
  }

  const rateLimit = checkRateLimit(email);
  if (!rateLimit.allowed) {
    console.log(`Rate limit exceeded for ${email}`);
    return genericSuccessResponse;
  }

  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error("Error fetching users:", userError);
    return genericSuccessResponse;
  }

  const user = users.users.find((u: any) => u.email === email);
  if (!user) {
    console.log(`No user found with email: ${email}`);
    return genericSuccessResponse;
  }

  if (userType === 'guest') {
    const { data: guestUser } = await supabase.from('guest_users').select('id, status').eq('id', user.id).maybeSingle();
    if (!guestUser || guestUser.status !== 'active') {
      console.log(`Guest user not active: ${email}`);
      return genericSuccessResponse;
    }
  }

  if (userType === 'admin') {
    const { data: adminUser } = await supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
    if (!adminUser) {
      console.log(`Admin user not found: ${email}`);
      return genericSuccessResponse;
    }
  }

  const rawToken = crypto.randomUUID();
  const tokenHash = await hashToken(rawToken);

  const { error: insertError } = await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    user_type: userType,
    token_hash: tokenHash,
  });

  if (insertError) {
    console.error("Error storing reset token:", insertError);
    return errorResponse("Failed to generate reset token", "TOKEN_GENERATION_FAILED", 500);
  }

  const resetPath = userType === 'admin' ? '/admin/reset-password' : '/guest/reset-password';
  const resetLink = `https://stayatbond.com${resetPath}?token=${rawToken}`;

  const emailContent = getPasswordResetTemplate({
    resetLink,
    recipientName: user.user_metadata?.full_name || user.email?.split('@')[0],
    userType,
  });

  const { data: resendData, error: resendError } = await resend.emails.send({
    from: "Bond Coliving <hello@stayatbond.com>",
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  if (resendError) {
    console.error("Resend error:", resendError);
    await supabase.from("email_logs").insert({
      email_type: "password_reset",
      recipient_email: email,
      subject: emailContent.subject,
      status: "failed",
      error_message: resendError.message,
    });
    return errorResponse("Failed to send reset email", "EMAIL_SEND_FAILED", 500);
  }

  await supabase.from("email_logs").insert({
    email_type: "password_reset",
    recipient_email: email,
    subject: emailContent.subject,
    status: "sent",
    resend_id: resendData.id,
  });

  console.log("Password reset email sent successfully:", resendData.id);
  return genericSuccessResponse;
}

async function handleTokenValidation(supabase: any, token: string) {
  if (!token) {
    return jsonResponse({ valid: false, error: "Token is required", code: "MISSING_TOKEN" }, 400);
  }

  const tokenHash = await hashToken(token);

  const { data: resetToken, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('used', false)
    .maybeSingle();

  if (error || !resetToken) {
    return jsonResponse({ valid: false, error: "Invalid or expired token", code: "INVALID_TOKEN" });
  }

  const expiresAt = new Date(resetToken.expires_at);
  if (expiresAt < new Date()) {
    return jsonResponse({ valid: false, error: "Token has expired", code: "TOKEN_EXPIRED" });
  }

  return jsonResponse({ valid: true, userType: resetToken.user_type });
}

async function handlePasswordReset(supabase: any, resend: any, token: string, newPassword: string) {
  if (!token || !newPassword) {
    return errorResponse("Token and new password are required", "MISSING_REQUIRED_FIELDS", 400);
  }

  if (newPassword.length < 8) {
    return errorResponse("Password must be at least 8 characters", "WEAK_PASSWORD", 400);
  }

  const tokenHash = await hashToken(token);

  const { data: resetToken, error: tokenError } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('used', false)
    .maybeSingle();

  if (tokenError || !resetToken) {
    return errorResponse("Invalid or expired token", "INVALID_TOKEN", 400);
  }

  const expiresAt = new Date(resetToken.expires_at);
  if (expiresAt < new Date()) {
    return errorResponse("Token has expired", "TOKEN_EXPIRED", 400);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(resetToken.user_id, { password: newPassword });

  if (updateError) {
    console.error("Error updating password:", updateError);
    return errorResponse("Failed to update password", "PASSWORD_UPDATE_FAILED", 500);
  }

  await supabase.from('password_reset_tokens').update({ used: true, used_at: new Date().toISOString() }).eq('id', resetToken.id);

  const { data: user } = await supabase.auth.admin.getUserById(resetToken.user_id);

  if (user?.user?.email) {
    const emailContent = getPasswordResetSuccessTemplate({
      recipientName: user.user.user_metadata?.full_name || user.user.email.split('@')[0],
      userType: resetToken.user_type,
    });

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: "Bond Coliving <hello@stayatbond.com>",
      to: user.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!resendError) {
      await supabase.from("email_logs").insert({
        email_type: "password_reset_success",
        recipient_email: user.user.email,
        subject: emailContent.subject,
        status: "sent",
        resend_id: resendData?.id,
      });
    }
  }

  console.log("Password reset successfully for user:", resetToken.user_id);
  return jsonResponse({ success: true, message: "Password reset successfully" });
}
