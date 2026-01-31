import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '3');

    if (!query || query.length < 1) {
      return new Response(
        JSON.stringify({ posts: [], users: [], topics: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchTerm = `%${query}%`;

    // Search in parallel
    const [postsResult, usersResult, topicsResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, body, type')
        .eq('moderation_status', 'approved')
        .is('deleted_at', null)
        .or(`title.ilike.${searchTerm},body.ilike.${searchTerm}`)
        .limit(limit),
      supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', searchTerm)
        .limit(limit),
      supabase
        .from('topics')
        .select('id, name, slug, icon')
        .ilike('name', searchTerm)
        .limit(limit),
    ]);

    return new Response(
      JSON.stringify({
        posts: postsResult.data || [],
        users: usersResult.data || [],
        topics: topicsResult.data || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
