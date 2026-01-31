import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// CORS headers with restricted origins
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN') || 'https://investor-paisa.lovable.app',
    'https://id-preview--14ca1bc6-3a3e-4389-94f1-5fe01fd1bbce.lovable.app',
    'http://localhost:8080',
    'http://localhost:5173'
  ];
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0];
};

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
});

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function should only be called by cron jobs or admin users
    // Check for service role key in Authorization header for cron jobs
    // Or verify admin role for user requests
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables for Supabase connection');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Check if this is a service role key call (from cron)
    if (token === supabaseServiceKey) {
      console.log('Metrics update authorized via service role key (cron job)');
    } else {
      // Verify user token and check for admin role
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
      
      if (claimsError || !claimsData?.user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user has admin role
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', claimsData.user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !roleData) {
        return new Response(
          JSON.stringify({ error: 'Forbidden - Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Metrics update authorized for admin user: ${claimsData.user.id}`);
    }
    
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call the database functions to update metrics
    const { error: dailyMetricsError } = await supabase.rpc('update_daily_metrics');
    if (dailyMetricsError) throw dailyMetricsError;
    
    const { error: topCirclesError } = await supabase.rpc('update_top_circles_metrics');
    if (topCirclesError) throw topCirclesError;
    
    console.log('Metrics update completed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Metrics updated successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating metrics:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An error occurred while updating metrics'
      }),
      { 
        status: 500,
        headers: { 
          ...getCorsHeaders(req.headers.get('Origin')), 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
