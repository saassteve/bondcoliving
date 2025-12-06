import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { invitationCode, password, bio, interests } = await req.json();

    if (!invitationCode || !password) {
      return new Response(
        JSON.stringify({ error: "Invitation code and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate invitation code
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("guest_invitations")
      .select("*")
      .eq("invitation_code", invitationCode.toUpperCase())
      .eq("status", "pending")
      .maybeSingle();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation code" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if invitation is still valid
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Invitation code has expired" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user with admin privileges (bypasses signup restrictions)
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
      return new Response(
        JSON.stringify({ error: authError?.message || "Failed to create account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create guest user record
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
      return new Response(
        JSON.stringify({ error: "Failed to create guest user record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create guest profile
    const interestsArray = interests ? interests.split(",").map((i: string) => i.trim()).filter((i: string) => i) : [];
    await supabaseAdmin.from("guest_profiles").insert({
      guest_user_id: guestUserData.id,
      bio: bio || null,
      interests: interestsArray,
      show_in_directory: true,
    });

    // Create messaging preferences
    await supabaseAdmin.from("messaging_preferences").insert({
      guest_user_id: guestUserData.id,
      allow_messages: true,
      email_notifications: true,
      push_notifications: true,
    });

    // Mark invitation as accepted
    await supabaseAdmin
      .from("guest_invitations")
      .update({
        status: "accepted",
        used: true,
        used_at: new Date().toISOString(),
        used_by_user_id: authData.user.id,
      })
      .eq("id", invitation.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});