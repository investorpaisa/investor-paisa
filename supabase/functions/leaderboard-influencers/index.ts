import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const category = url.searchParams.get('category') // Optional: filter by interest category

    // Build query for top influencers
    let query = supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, headline, is_verified, is_expert, followers_count, posts_count, upvote_rate, tier, interests')
      .or('tier.eq.influencer,tier.eq.expert')
      .order('followers_count', { ascending: false })
      .limit(limit)

    // Optional category filter
    if (category) {
      query = query.contains('interests', [category])
    }

    const { data: influencers, error: influencersError } = await query

    if (influencersError) {
      console.error('Failed to fetch influencers:', influencersError)
      return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Add rank to each influencer
    const rankedInfluencers = influencers?.map((inf, index) => ({
      ...inf,
      rank: index + 1,
      badge: index < 3 ? ['🥇', '🥈', '🥉'][index] : null
    }))

    // Get some quick stats
    const { count: totalExperts } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'expert')

    const { count: totalInfluencers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'influencer')

    return new Response(JSON.stringify({ 
      leaderboard: rankedInfluencers,
      stats: {
        totalExperts: totalExperts || 0,
        totalInfluencers: totalInfluencers || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
