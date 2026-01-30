
// Supabase Client - with resilient initialization
// This wraps the auto-generated client with fallback handling
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lovable Cloud project credentials (these are public anon keys)
const FALLBACK_URL = 'https://byipbdumfzuiykkeqezv.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aXBiZHVtZnp1aXlra2VxZXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDUwMDIsImV4cCI6MjA4NTMyMTAwMn0.j_1X1KaHGM9JDz6stolHnSnZvibuqBiS0cpdQv5edW8';

// Get URL and key with fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;

// Create the client with proper configuration
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY, 
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Export URL for edge function calls
export const getSupabaseUrl = () => SUPABASE_URL;
