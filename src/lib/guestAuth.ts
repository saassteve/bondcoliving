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
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: {
      data: {
        full_name: invitation.full_name,
        user_type: 'guest',
      },
    },
  });

  if (authError || !authData.user) {
    console.error('Error creating auth user:', authError);
    return { success: false, error: authError?.message || 'Failed to create account' };
  }

  const { error: guestUserError } = await supabase
    .from('guest_users')
    .insert({
      user_id: authData.user.id,
      user_type: invitation.user_type,
      booking_id: invitation.booking_id,
      email: invitation.email,
      full_name: invitation.full_name,
      access_start_date: invitation.access_start_date,
      access_end_date: invitation.access_end_date,
      status: 'active',
    });

  if (guestUserError) {
    console.error('Error creating guest user:', guestUserError);
    return { success: false, error: guestUserError.message };
  }

  const { data: guestUser } = await supabase
    .from('guest_users')
    .select('id')
    .eq('user_id', authData.user.id)
    .single();

  if (guestUser) {
    await supabase.from('guest_profiles').insert({
      guest_user_id: guestUser.id,
      bio: profileData?.bio || null,
      interests: profileData?.interests || [],
      profile_photo_url: profileData?.profilePhotoUrl || null,
      show_in_directory: true,
    });

    await supabase.from('messaging_preferences').insert({
      guest_user_id: guestUser.id,
      allow_messages: true,
      email_notifications: true,
      push_notifications: true,
    });
  }

  await supabase
    .from('guest_invitations')
    .update({
      used: true,
      used_at: new Date().toISOString(),
      used_by_user_id: authData.user.id,
    })
    .eq('id', invitation.id);

  return { success: true, error: null };
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
