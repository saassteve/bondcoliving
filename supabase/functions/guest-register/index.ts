import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { invitationCode, password, bio, interests } = await req.json();

    if (!invitationCode || !password) {
      return errorResponse("Invitation code and password are required", "MISSING_FIELDS", 400);
    }

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("guest_invitations")
      .select("*")
      .eq("invitation_code", invitationCode.toUpperCase())
      .eq("used", false)
      .maybeSingle();

    if (invitationError || !invitation) {
      return errorResponse("Invalid or expired invitation code", "INVALID_CODE", 400);
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return errorResponse("Invitation code has expired", "EXPIRED_CODE", 400);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: invitation.full_name,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return errorResponse(authError?.message || "Failed to create account", "AUTH_ERROR", 400);
    }

    const { data: guestUserData, error: guestUserError } = await supabaseAdmin
      .from("guest_users")
      .insert({
        user_id: authData.user.id,
        email: invitation.email,
        full_name: invitation.full_name,
        user_type: invitation.user_type,
        booking_id: invitation.booking_id,
        access_start_date: invitation.access_start_date,
        access_end_date: invitation.access_end_date,
        status: "active",
      })
      .select()
      .single();

    if (guestUserError || !guestUserData) {
      console.error("Guest user error:", guestUserError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return errorResponse("Failed to create guest user record", "GUEST_CREATE_ERROR", 500);
    }

    const interestsArray = interests ? interests.split(",").map((i: string) => i.trim()).filter((i: string) => i) : [];
    await supabaseAdmin.from("guest_profiles").insert({
      guest_user_id: guestUserData.id,
      bio: bio || null,
      interests: interestsArray,
      show_in_directory: true,
    });

    await supabaseAdmin.from("messaging_preferences").insert({
      guest_user_id: guestUserData.id,
      allow_messages: true,
      email_notifications: true,
      push_notifications: true,
    });

    await supabaseAdmin
      .from("guest_invitations")
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_by_user_id: authData.user.id,
      })
      .eq("id", invitation.id);

    return jsonResponse({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
});
