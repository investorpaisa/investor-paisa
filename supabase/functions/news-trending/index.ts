import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'all'; // indian, global, crypto, all
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    // Filter by type/category
    if (type === 'indian') {
      query = query.eq('country', 'india');
    } else if (type === 'crypto') {
      query = query.ilike('category', '%crypto%');
    } else if (type === 'global') {
      query = query.neq('country', 'india');
    }

    const { data, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ articles: data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('News trending error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch news' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
