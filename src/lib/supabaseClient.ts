
// Supabase client with fallback for environment variable issues
// This file provides a resilient Supabase client that works even when
// Lovable Cloud env vars aren't immediately available
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Lovable Cloud Supabase project credentials
// These are the published/public values for this project
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://byipbdumfzuiykkeqezv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aXBiZHVtZnp1aXlra2VxZXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDUwMDIsImV4cCI6MjA4NTMyMTAwMn0.j_1X1KaHGM9JDz6stolHnSnZvibuqBiS0cpdQv5edW8';

// Create and export the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export the URL for edge function calls
export const VITE_SUPABASE_URL = SUPABASE_URL;
