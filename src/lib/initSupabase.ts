
// Supabase initialization with environment variable fallback
// This ensures the app doesn't crash if env vars are temporarily unavailable

export const getSupabaseConfig = () => {
  // Try to get from Vite env vars (auto-managed by Lovable Cloud)
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    console.warn('Supabase environment variables not found - using fallback');
  }
  
  return {
    url: url || 'https://byipbdumfzuiykkeqezv.supabase.co',
    key: key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aXBiZHVtZnp1aXlra2VxZXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDUwMDIsImV4cCI6MjA4NTMyMTAwMn0.j_1X1KaHGM9JDz6stolHnSnZvibuqBiS0cpdQv5edW8'
  };
};
