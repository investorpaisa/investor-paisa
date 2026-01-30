
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        error: errorMessage
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
