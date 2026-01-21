import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: AdminUser | null;
  loading: boolean;
}

class AuthService {
  private currentUser: AdminUser | null = null;
  private listeners: ((user: AdminUser | null) => void)[] = [];
  private readonly STORAGE_KEY = 'bond_admin_session';

  constructor() {
    // Check for existing session on initialization
    this.checkSession();
  }

  private async checkSession() {
    try {
      // CRITICAL: Always check Supabase session first, not localStorage cache
      // The cache can persist even when the Supabase session expires
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // No valid Supabase session - clear any cached data
        this.clearPersistedSession();
        this.currentUser = null;
        this.notifyListeners();
        return;
      }

      // Check localStorage cache to avoid re-querying admin_users table
      const storedSession = localStorage.getItem(this.STORAGE_KEY);
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          // If cached user matches the current Supabase session, use it
          if (sessionData.user?.email === session.user.email) {
            this.currentUser = sessionData.user;
            this.notifyListeners();
            return;
          }
        } catch (error) {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }

      // No valid cache or cache doesn't match - verify admin status using secure function
      const { data: adminData, error: adminError } = await supabase
        .rpc('verify_admin_user', { p_user_id: session.user.id });

      if (adminError) {
        this.clearPersistedSession();
        this.currentUser = null;
        this.notifyListeners();
        return;
      }

      // The RPC function returns an array, get the first result
      const adminUser = adminData && adminData.length > 0 ? adminData[0] : null;

      if (adminUser) {
        this.currentUser = adminUser;
        this.persistSession(adminUser);
        this.notifyListeners();
      } else {
        this.clearPersistedSession();
        this.currentUser = null;
        this.notifyListeners();
      }
    } catch (error) {
      this.clearPersistedSession();
      this.currentUser = null;
      this.notifyListeners();
    }
  }

  private persistSession(user: AdminUser) {
    const sessionData = {
      user,
      timestamp: Date.now()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
  }

  private clearPersistedSession() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!authData.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Check if this user is an admin using the secure verification function
      const { data: adminData, error: adminError } = await supabase
        .rpc('verify_admin_user', { p_user_id: authData.user.id });

      if (adminError) {
        await supabase.auth.signOut();
        return { success: false, error: 'Failed to verify admin status' };
      }

      // The RPC function returns an array, get the first result
      const adminUser = adminData && adminData.length > 0 ? adminData[0] : null;

      if (!adminUser) {
        await supabase.auth.signOut();
        return { success: false, error: 'Access denied - admin account required' };
      }

      const user = {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      };

      this.currentUser = user;
      this.persistSession(user);
      this.notifyListeners();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Silent fail - clear session anyway
    }
    this.clearPersistedSession();
    this.currentUser = null;
    this.notifyListeners();
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  onAuthStateChange(callback: (user: AdminUser | null) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const authService = new AuthService();

// React hook for auth state
import { useState, useEffect } from 'react';

export function useAuth(): AuthState {
  const [user, setUser] = useState<AdminUser | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    
    const unsubscribe = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'request',
          email,
          userType: 'admin',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send reset email' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function validateResetToken(token: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'validate',
          token,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.valid) {
      return { valid: false, error: data.error || 'Invalid token' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Network error. Please try again.' };
  }
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'reset',
          token,
          newPassword,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to reset password' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}