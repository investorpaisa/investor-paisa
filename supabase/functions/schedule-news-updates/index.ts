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
    // This function should only be called by admin users
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

    // Verify user token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
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

    console.log(`Schedule news updates authorized for admin user: ${claimsData.user.id}`);
    console.log('Setting up scheduled news fetch...');

    // Create a connection to the database
    const { data: connectionData, error: connectionError } = await supabase.rpc('get_pg_connection');
    if (connectionError) {
      throw new Error(`Failed to get database connection: ${connectionError.message}`);
    }
    
    // Schedule the news fetch to run every hour
    const { data, error } = await supabase.rpc('create_cron_job', {
      job_name: 'hourly_news_fetch',
      schedule: '0 * * * *', // Run every hour at minute 0
      command: `SELECT net.http_post(
        url:='${supabaseUrl}/functions/v1/fetch-financial-news-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseServiceKey}"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;`
    });

    if (error) {
      throw new Error(`Failed to create cron job: ${error.message}`);
    }

    console.log('Successfully scheduled news fetch to run hourly');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'News fetch scheduled to run hourly',
        data
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
    console.error('Error setting up scheduled news fetch:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred while scheduling news updates'
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
