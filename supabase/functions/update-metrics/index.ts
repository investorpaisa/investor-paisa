
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
    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables for Supabase connection');
    }
    
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
