
// Supabase Client - with resilient initialization
// This wraps the auto-generated client with fallback handling
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lovable Cloud project credentials (these are public anon keys)
const FALLBACK_URL = 'https://mgjxxihralfncarbuvqs.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nanh4aWhyYWxmbmNhcmJ1dnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NjAxNDIsImV4cCI6MjA4NTUzNjE0Mn0.DqtdQhGExR8KVJwcs_RFaSYsA6bYSKOR1w8_8ZRgbvI';

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

// Export URL and key for edge function calls
export const getSupabaseUrl = () => SUPABASE_URL;
export const getSupabaseAnonKey = () => SUPABASE_PUBLISHABLE_KEY;
