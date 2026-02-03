import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  completeOnboarding: () => Promise<void>;
  // Aliases for backward compatibility
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  login: (email: string, password: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Profile doesn't exist - create it as fallback
      if (!data && !error) {
        const username = userEmail ? userEmail.split('@')[0] : `user_${userId.slice(0, 8)}`;
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username,
            email: userEmail,
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          return null;
        }
        return newProfile as Profile;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, user.email ?? undefined);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let authChangeTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    // Check for OAuth callback in URL hash (for Google auth)
    const checkOAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // Clear the hash to prevent re-processing
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
        // Wait for Supabase to process the token from the URL
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    // Get initial session
    const initSession = async () => {
      await checkOAuthCallback();
      
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!isMounted) return;
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        const profileData = await fetchProfile(initialSession.user.id, initialSession.user.email ?? undefined);
        if (isMounted) setProfile(profileData);
      }
      
      if (isMounted) setIsLoading(false);
    };

    initSession();

    // Listen for auth changes with debouncing to prevent rapid state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Debounce auth state changes to prevent flickering during token refresh
      if (authChangeTimeout) clearTimeout(authChangeTimeout);
      
      authChangeTimeout = setTimeout(async () => {
        if (!isMounted) return;
        
        // Only update state if there's an actual change
        const sessionChanged = newSession?.access_token !== session?.access_token;
        const userChanged = newSession?.user?.id !== user?.id;
        
        if (sessionChanged || userChanged || event === 'SIGNED_OUT') {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user) {
            const profileData = await fetchProfile(newSession.user.id, newSession.user.email ?? undefined);
            if (isMounted) setProfile(profileData);
          } else {
            setProfile(null);
          }
        }

        if (isMounted) setIsLoading(false);
      }, 100);
    });

    return () => {
      isMounted = false;
      if (authChangeTimeout) clearTimeout(authChangeTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile, session?.access_token, user?.id]);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Use Lovable managed OAuth
    const { lovable } = await import('@/integrations/lovable');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    
    if (result.error) {
      throw result.error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!supabase || !user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (!error) {
      await refreshProfile();
    }
    
    return { error: error as Error | null };
  };

  const completeOnboarding = async () => {
    await updateProfile({ onboarding_completed: true });
  };

  // Alias for login - returns user on success
  const login = async (email: string, password: string): Promise<User | null> => {
    const result = await signInWithEmail(email, password);
    if (result.error) {
      console.error('Login error:', result.error);
      return null;
    }
    return user;
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    loading: isLoading, // Alias
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshProfile,
    updateProfile,
    completeOnboarding,
    // Aliases
    signIn: signInWithEmail,
    signUp: signUpWithEmail,
    login,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
