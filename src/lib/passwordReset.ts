const RESET_EMAIL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset-email`;

const resetHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

export async function requestPasswordReset(
  email: string,
  userType: 'admin' | 'guest'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(RESET_EMAIL_URL, {
      method: 'POST',
      headers: resetHeaders,
      body: JSON.stringify({ action: 'request', email, userType }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send reset email' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function validateResetToken(
  token: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(RESET_EMAIL_URL, {
      method: 'POST',
      headers: resetHeaders,
      body: JSON.stringify({ action: 'validate', token }),
    });

    const data = await response.json();

    if (!response.ok || !data.valid) {
      return { valid: false, error: data.error || 'Invalid token' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Network error. Please try again.' };
  }
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(RESET_EMAIL_URL, {
      method: 'POST',
      headers: resetHeaders,
      body: JSON.stringify({ action: 'reset', token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to reset password' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}
