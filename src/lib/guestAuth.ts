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
    return { valid: false, invitation: null, error: 'Unable to validate invitation code' };
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
      return { success: false, error: result.error || 'Failed to create account' };
    }

    // Sign in the user after successful registration
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    });

    if (signInError) {
      return { success: false, error: 'Account created but failed to sign in. Please try logging in manually.' };
    }

    return { success: true, error: null };
  } catch (error) {
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
    return { success: false, error: 'Unable to update profile' };
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
    return { success: false, error: 'Unable to sign out' };
  }
  return { success: true, error: null };
}

export function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomValues = new Uint32Array(8);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (val) => chars[val % chars.length]).join('');
}

import {
  requestPasswordReset as _requestPasswordReset,
  validateResetToken as _validateResetToken,
  resetPasswordWithToken as _resetPasswordWithToken,
} from './passwordReset';

export function requestPasswordReset(email: string) {
  return _requestPasswordReset(email, 'guest');
}

export const validateResetToken = _validateResetToken;
export const resetPasswordWithToken = _resetPasswordWithToken;
