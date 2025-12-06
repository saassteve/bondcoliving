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
    console.log('AuthService.checkSession() - Starting...');

    // First check localStorage for persisted session
    const storedSession = localStorage.getItem(this.STORAGE_KEY);
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        // Verify the session is still valid (not expired)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (sessionAge < maxAge) {
          console.log('AuthService.checkSession() - Using cached session for:', sessionData.user.email);
          this.currentUser = sessionData.user;
          this.notifyListeners();
          return;
        } else {
          console.log('AuthService.checkSession() - Cached session expired');
          localStorage.removeItem(this.STORAGE_KEY);
        }
      } catch (error) {
        console.error('AuthService.checkSession() - Error parsing stored session:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthService.checkSession() - Supabase session:', session ? 'Found' : 'Not found');

      if (session?.user) {
        console.log('AuthService.checkSession() - User authenticated:', session.user.email);
        console.log('AuthService.checkSession() - User ID (auth.uid):', session.user.id);

        // Verify this is an authorized admin user
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('id, email, role, user_id')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (adminError) {
          console.error('AuthService.checkSession() - Error fetching admin user:', adminError);
        }

        if (adminUser) {
          console.log('AuthService.checkSession() - Admin user verified:', adminUser.email, 'Role:', adminUser.role);
          this.currentUser = adminUser;
          this.persistSession(adminUser);
          this.notifyListeners();
        } else {
          console.warn('AuthService.checkSession() - User is authenticated but not an admin');
        }
      } else {
        console.log('AuthService.checkSession() - No active session');
      }
    } catch (error) {
      console.error('AuthService.checkSession() - Error:', error);
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
      console.log('AuthService.signIn() - Attempting sign in for:', email);

      // First try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('AuthService.signIn() - Supabase auth error:', authError);
        return { success: false, error: 'Invalid credentials' };
      }

      if (!authData.user) {
        console.error('AuthService.signIn() - No user returned from auth');
        return { success: false, error: 'Authentication failed' };
      }

      console.log('AuthService.signIn() - Auth successful, user ID:', authData.user.id);

      // Check if this user is an admin in our admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, email, role, user_id')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminError) {
        console.error('AuthService.signIn() - Error checking admin status:', adminError);
        await supabase.auth.signOut();
        return { success: false, error: 'Failed to verify admin status' };
      }

      if (!adminUser) {
        console.warn('AuthService.signIn() - User is not an admin');
        await supabase.auth.signOut();
        return { success: false, error: 'Access denied - admin account required' };
      }

      console.log('AuthService.signIn() - Admin verified:', adminUser.email, 'Role:', adminUser.role);

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
      console.error('AuthService.signIn() - Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
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