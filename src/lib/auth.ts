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
    // First check localStorage for persisted session
    const storedSession = localStorage.getItem(this.STORAGE_KEY);
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        // Verify the session is still valid (not expired)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (sessionAge < maxAge) {
          this.currentUser = sessionData.user;
          this.notifyListeners();
          return;
        } else {
          // Session expired, remove it
          localStorage.removeItem(this.STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Verify this is an authorized admin user
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id, email, role')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (adminUser) {
          this.currentUser = adminUser;
          this.persistSession(adminUser);
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
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
        console.error('Supabase auth error:', authError);
        return { success: false, error: 'Invalid credentials' };
      }

      if (!authData.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Check if this user is an admin in our admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, email, role')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminUser) {
        // Sign out the user since they're not an admin
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
      console.error('Sign in error:', error);
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