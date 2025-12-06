import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@3";
import { getPasswordResetTemplate, getPasswordResetSuccessTemplate } from "./templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// In-memory rate limiting (max 3 attempts per email per hour)
interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(email: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitMap.delete(email);
  }

  const current = rateLimitMap.get(email);

  if (!current) {
    // First attempt
    rateLimitMap.set(email, { attempts: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }

  if (current.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  // Increment attempts
  current.attempts++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - current.attempts };
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(email);
    }
  }
}, 10 * 60 * 1000);

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({
          error: "Email service not configured. Please contact administrator.",
          code: "MISSING_RESEND_API_KEY",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const body = await req.json();
    const { action, email, userType, token, newPassword } = body;

    console.log("Processing password reset request:", { action, email, userType });

    // Validate action
    if (!action || !['request', 'reset', 'validate'].includes(action)) {
      return new Response(
        JSON.stringify({
          error: "Invalid action. Must be 'request', 'reset', or 'validate'",
          code: "INVALID_ACTION",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle password reset request
    if (action === 'request') {
      return await handlePasswordResetRequest(supabase, resend, email, userType, supabaseUrl);
    }

    // Handle token validation
    if (action === 'validate') {
      return await handleTokenValidation(supabase, token);
    }

    // Handle password reset
    if (action === 'reset') {
      return await handlePasswordReset(supabase, resend, token, newPassword);
    }

  } catch (error) {
    console.error("Error processing password reset:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handlePasswordResetRequest(
  supabase: any,
  resend: any,
  email: string,
  userType: 'admin' | 'guest',
  supabaseUrl: string
) {
  if (!email || !userType) {
    return new Response(
      JSON.stringify({
        error: "Email and userType are required",
        code: "MISSING_REQUIRED_FIELDS",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Check rate limit
  const rateLimit = checkRateLimit(email);
  if (!rateLimit.allowed) {
    console.log(`Rate limit exceeded for ${email}`);
    // Return same success message to prevent user enumeration
    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists with that email, you'll receive reset instructions within 5 minutes.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Find user in auth.users by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error("Error fetching users:", userError);
    // Return generic success to prevent user enumeration
    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists with that email, you'll receive reset instructions within 5 minutes.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const user = users.users.find((u: any) => u.email === email);

  if (!user) {
    console.log(`No user found with email: ${email}`);
    // Return same success message to prevent user enumeration
    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists with that email, you'll receive reset instructions within 5 minutes.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // For guest users, verify they exist in guest_users table with active status
  if (userType === 'guest') {
    const { data: guestUser } = await supabase
      .from('guest_users')
      .select('id, status')
      .eq('id', user.id)
      .maybeSingle();

    if (!guestUser || guestUser.status !== 'active') {
      console.log(`Guest user not active: ${email}`);
      // Return same success message
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account exists with that email, you'll receive reset instructions within 5 minutes.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // For admin users, verify they exist in admin_users table
  if (userType === 'admin') {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminUser) {
      console.log(`Admin user not found: ${email}`);
      // Return same success message
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account exists with that email, you'll receive reset instructions within 5 minutes.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Generate reset token
  const rawToken = crypto.randomUUID();
  const tokenHash = await hashToken(rawToken);

  // Store token in database
  const { error: insertError } = await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: user.id,
      user_type: userType,
      token_hash: tokenHash,
    });

  if (insertError) {
    console.error("Error storing reset token:", insertError);
    return new Response(
      JSON.stringify({
        error: "Failed to generate reset token",
        code: "TOKEN_GENERATION_FAILED",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Build reset link
  const baseUrl = supabaseUrl.replace('.supabase.co', '').replace('https://', '');
  const resetPath = userType === 'admin' ? '/admin/reset-password' : '/guest/reset-password';
  const resetLink = `https://stayatbond.com${resetPath}?token=${rawToken}`;

  // Send email
  const emailContent = getPasswordResetTemplate({
    resetLink,
    recipientName: user.user_metadata?.full_name || user.email?.split('@')[0],
    userType,
  });

  const { data: resendData, error: resendError } = await resend.emails.send({
    from: "Bond Coliving <onboarding@resend.dev>",
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  if (resendError) {
    console.error("Resend error:", resendError);

    // Log failed email
    await supabase.from("email_logs").insert({
      email_type: "password_reset",
      recipient_email: email,
      subject: emailContent.subject,
      status: "failed",
      error_message: resendError.message,
    });

    return new Response(
      JSON.stringify({
        error: "Failed to send reset email",
        code: "EMAIL_SEND_FAILED",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Log successful email
  await supabase.from("email_logs").insert({
    email_type: "password_reset",
    recipient_email: email,
    subject: emailContent.subject,
    status: "sent",
    resend_id: resendData.id,
  });

  console.log("Password reset email sent successfully:", resendData.id);

  return new Response(
    JSON.stringify({
      success: true,
      message: "If an account exists with that email, you'll receive reset instructions within 5 minutes.",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handleTokenValidation(supabase: any, token: string) {
  if (!token) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Token is required",
        code: "MISSING_TOKEN",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const tokenHash = await hashToken(token);

  const { data: resetToken, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('used', false)
    .maybeSingle();

  if (error || !resetToken) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Check if token is expired
  const expiresAt = new Date(resetToken.expires_at);
  if (expiresAt < new Date()) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Token has expired",
        code: "TOKEN_EXPIRED",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      valid: true,
      userType: resetToken.user_type,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handlePasswordReset(
  supabase: any,
  resend: any,
  token: string,
  newPassword: string
) {
  if (!token || !newPassword) {
    return new Response(
      JSON.stringify({
        error: "Token and new password are required",
        code: "MISSING_REQUIRED_FIELDS",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return new Response(
      JSON.stringify({
        error: "Password must be at least 8 characters",
        code: "WEAK_PASSWORD",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const tokenHash = await hashToken(token);

  // Find and validate token
  const { data: resetToken, error: tokenError } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('used', false)
    .maybeSingle();

  if (tokenError || !resetToken) {
    return new Response(
      JSON.stringify({
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Check if token is expired
  const expiresAt = new Date(resetToken.expires_at);
  if (expiresAt < new Date()) {
    return new Response(
      JSON.stringify({
        error: "Token has expired",
        code: "TOKEN_EXPIRED",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Update user password
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    resetToken.user_id,
    { password: newPassword }
  );

  if (updateError) {
    console.error("Error updating password:", updateError);
    return new Response(
      JSON.stringify({
        error: "Failed to update password",
        code: "PASSWORD_UPDATE_FAILED",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Mark token as used
  await supabase
    .from('password_reset_tokens')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('id', resetToken.id);

  // Get user details for confirmation email
  const { data: user } = await supabase.auth.admin.getUserById(resetToken.user_id);

  if (user?.user?.email) {
    // Send confirmation email
    const emailContent = getPasswordResetSuccessTemplate({
      recipientName: user.user.user_metadata?.full_name || user.user.email.split('@')[0],
      userType: resetToken.user_type,
    });

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: "Bond Coliving <onboarding@resend.dev>",
      to: user.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!resendError) {
      // Log successful email
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

  return new Response(
    JSON.stringify({
      success: true,
      message: "Password reset successfully",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
