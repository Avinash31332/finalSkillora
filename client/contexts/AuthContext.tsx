import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string; success?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        return { success: true, error: 'Please check your email to verify your account' };
      }

      return { success: true };
    } catch (error) {
      return { error: 'Signup failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        return { error: 'Please verify your email before signing in' };
      }

      return { success: true };
    } catch (error) {
      return { error: 'Login failed' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isEmailVerified: !!user?.email_confirmed_at,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for protecting routes
export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setRedirectTo('/signin');
    }
  }, [isAuthenticated, loading]);

  return { redirectTo, loading };
}
