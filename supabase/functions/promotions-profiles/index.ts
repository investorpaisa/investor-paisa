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
    const type = url.searchParams.get('type') || 'profile'
    const limit = parseInt(url.searchParams.get('limit') || '5')

    // Get active promotions
    const now = new Date().toISOString()
    const { data: promotions, error: promotionsError } = await supabase
      .from('promotions')
      .select('entity_id, priority')
      .eq('type', type)
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('priority', { ascending: false })
      .limit(limit)

    if (promotionsError) {
      console.error('Failed to fetch promotions:', promotionsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch promotions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!promotions || promotions.length === 0) {
      return new Response(JSON.stringify({ 
        promotions: [],
        message: 'No active promotions found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const entityIds = promotions.map(p => p.entity_id)

    if (type === 'profile') {
      // Fetch promoted profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified, is_expert, followers_count, tier')
        .in('id', entityIds)

      if (profilesError) {
        console.error('Failed to fetch profiles:', profilesError)
        return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Sort profiles by promotion priority
      const priorityMap = new Map(promotions.map(p => [p.entity_id, p.priority]))
      const sortedProfiles = profiles?.sort((a, b) => 
        (priorityMap.get(b.id) || 0) - (priorityMap.get(a.id) || 0)
      )

      return new Response(JSON.stringify({ promotions: sortedProfiles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (type === 'service') {
      // Fetch promoted services with provider info
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          id, title, description, price, category,
          provider:profiles!provider_id (id, full_name, username, avatar_url, is_verified)
        `)
        .in('id', entityIds)
        .eq('is_active', true)

      if (servicesError) {
        console.error('Failed to fetch services:', servicesError)
        return new Response(JSON.stringify({ error: 'Failed to fetch services' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Sort services by promotion priority
      const priorityMap = new Map(promotions.map(p => [p.entity_id, p.priority]))
      const sortedServices = services?.sort((a, b) => 
        (priorityMap.get(b.id) || 0) - (priorityMap.get(a.id) || 0)
      )

      return new Response(JSON.stringify({ promotions: sortedServices }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid type parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Promotions error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
