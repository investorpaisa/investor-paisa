import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  const initializingRef = useRef(false);
  const oauthProcessedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    if (!supabase) return null;
    
    try {
      // First try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Profile exists - return it
      if (data) {
        return data as Profile;
      }

      // If there's an error (not just "no data"), log and return null
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // Profile doesn't exist - try to create it using upsert to avoid duplicate key errors
      const username = userEmail ? userEmail.split('@')[0] : `user_${userId.slice(0, 8)}`;
      const { data: newProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username,
          email: userEmail,
        }, { 
          onConflict: 'id',
          ignoreDuplicates: true 
        })
        .select()
        .single();
      
      if (upsertError) {
        // If upsert fails, try to fetch again (profile might have been created by trigger)
        console.log('Upsert failed, fetching existing profile:', upsertError.message);
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (existingProfile) {
          return existingProfile as Profile;
        }
        return null;
      }
      return newProfile as Profile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
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
    // Skip if already initializing
    if (initializingRef.current) {
      return;
    }
    
    // Handle case where supabase client isn't available
    if (!supabase) {
      console.warn('Supabase client not available');
      setIsLoading(false);
      return;
    }

    initializingRef.current = true;
    let isMounted = true;

    // Handle OAuth callback - detect tokens in hash and process them BEFORE anything else
    const processOAuthCallback = async (): Promise<boolean> => {
      const hash = window.location.hash;
      
      // Check if this is an OAuth callback with tokens
      if (!hash || !hash.includes('access_token') || oauthProcessedRef.current) {
        return false;
      }
      
      console.log('[Auth] OAuth callback detected, processing tokens...');
      oauthProcessedRef.current = true;
      
      // Parse the hash to extract tokens
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        try {
          // Manually set the session with the tokens from the URL
          const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          // Clear the hash AFTER setting session to prevent issues
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', cleanUrl);
          
          if (setSessionError) {
            console.error('[Auth] Failed to set session from OAuth tokens:', setSessionError);
            return false;
          }
          
          if (sessionData.session && isMounted) {
            console.log('[Auth] OAuth session established successfully for:', sessionData.session.user.email);
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            
            // Fetch profile
            const profileData = await fetchProfile(
              sessionData.session.user.id, 
              sessionData.session.user.email ?? undefined
            );
            if (isMounted) setProfile(profileData);
            
            return true;
          }
        } catch (err) {
          console.error('[Auth] Error processing OAuth callback:', err);
          // Clear hash even on error
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', cleanUrl);
        }
      }
      
      return false;
    };

    // Initialize session
    const initSession = async () => {
      try {
        // First check for OAuth callback
        const oauthHandled = await processOAuthCallback();
        
        if (oauthHandled) {
          if (isMounted) setIsLoading(false);
          return;
        }
        
        // No OAuth callback - get existing session normally
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          const profileData = await fetchProfile(initialSession.user.id, initialSession.user.email ?? undefined);
          if (isMounted) setProfile(profileData);
        }
      } catch (error) {
        console.error('[Auth] Error initializing session:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Set up auth state change listener FIRST, then init session
    // This ensures we catch any auth state changes during initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      
      console.log('[Auth] Auth state change:', event, newSession?.user?.email);
      
      // Handle specific events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          const profileData = await fetchProfile(newSession.user.id, newSession.user.email ?? undefined);
          if (isMounted) setProfile(profileData);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      if (isMounted) setIsLoading(false);
    });

    // Now init session
    initSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Reset the OAuth processed flag before initiating new login
    oauthProcessedRef.current = false;
    
    // Use Lovable managed OAuth
    const { lovable } = await import('@/integrations/lovable');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin + '/feed',
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
