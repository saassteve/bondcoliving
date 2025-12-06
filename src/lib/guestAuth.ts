import { supabase } from './supabase';

export interface GuestUser {
  id: string;
  user_id: string;
  user_type: 'overnight' | 'coworking';
  status: 'active' | 'expired' | 'revoked';
  booking_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  access_start_date: string;
  access_end_date: string;
  grace_period_days: number;
  created_at: string;
  updated_at: string;
}

export interface GuestInvitation {
  id: string;
  invitation_code: string;
  user_type: 'overnight' | 'coworking';
  booking_id: string | null;
  email: string;
  full_name: string;
  access_start_date: string;
  access_end_date: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
}

export async function validateInvitationCode(code: string) {
  const { data, error } = await supabase
    .from('guest_invitations')
    .select('*')
    .eq('invitation_code', code)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error('Error validating invitation:', error);
    return { valid: false, invitation: null, error: error.message };
  }

  if (!data) {
    return { valid: false, invitation: null, error: 'Invalid or expired invitation code' };
  }

  return { valid: true, invitation: data as GuestInvitation, error: null };
}

export async function registerGuestUser(
  invitation: GuestInvitation,
  password: string,
  profileData?: {
    bio?: string;
    interests?: string[];
    profilePhotoUrl?: string;
  }
) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/guest-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        invitationCode: invitation.invitation_code,
        password,
        bio: profileData?.bio,
        interests: profileData?.interests?.join(', '),
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Error creating guest account:', result.error);
      return { success: false, error: result.error || 'Failed to create account' };
    }

    // Sign in the user after successful registration
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    });

    if (signInError) {
      console.error('Error signing in after registration:', signInError);
      return { success: false, error: 'Account created but failed to sign in. Please try logging in manually.' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error during registration:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function getCurrentGuestUser(): Promise<GuestUser | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('guest_users')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching guest user:', error);
    return null;
  }

  return data as GuestUser | null;
}

export async function getGuestProfile(guestUserId: string) {
  const { data, error } = await supabase
    .from('guest_profiles')
    .select('*')
    .eq('guest_user_id', guestUserId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching guest profile:', error);
    return null;
  }

  return data;
}

export async function updateGuestProfile(
  guestUserId: string,
  updates: {
    bio?: string;
    interests?: string[];
    profile_photo_url?: string;
    social_links?: Record<string, string>;
    show_in_directory?: boolean;
  }
) {
  const { error } = await supabase
    .from('guest_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('guest_user_id', guestUserId);

  if (error) {
    console.error('Error updating guest profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function signInGuest(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const guestUser = await getCurrentGuestUser();

  if (!guestUser) {
    await supabase.auth.signOut();
    return { success: false, error: 'No guest account found' };
  }

  if (guestUser.status !== 'active') {
    await supabase.auth.signOut();
    return { success: false, error: 'Your access has expired' };
  }

  return { success: true, error: null, guestUser };
}

export async function signOutGuest() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}

export function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
