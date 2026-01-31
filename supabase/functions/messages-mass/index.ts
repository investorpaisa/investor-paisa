import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AudienceFilter {
  interests?: string[]
  tier?: string[]
  follower_count_min?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is an expert
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier, is_expert')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Only experts can send mass messages
    if (profile.tier !== 'expert' && !profile.is_expert) {
      return new Response(JSON.stringify({ 
        error: 'Only experts can send mass messages' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { body, audience_filter }: { body: string; audience_filter?: AudienceFilter } = await req.json()

    if (!body || body.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message body is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build query for recipients
    let query = supabase
      .from('profiles')
      .select('id')
      .neq('id', user.id) // Exclude sender

    // Apply audience filters
    if (audience_filter) {
      if (audience_filter.tier && audience_filter.tier.length > 0) {
        query = query.in('tier', audience_filter.tier)
      }
      if (audience_filter.follower_count_min) {
        query = query.gte('followers_count', audience_filter.follower_count_min)
      }
      if (audience_filter.interests && audience_filter.interests.length > 0) {
        // Use overlaps for array matching
        query = query.overlaps('interests', audience_filter.interests)
      }
    }

    // Limit to 500 recipients max per broadcast
    query = query.limit(500)

    const { data: recipients, error: recipientsError } = await query

    if (recipientsError) {
      console.error('Failed to fetch recipients:', recipientsError)
      return new Response(JSON.stringify({ error: 'Failed to find recipients' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No recipients match the specified criteria' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create individual conversations and messages for each recipient
    const results = {
      sent: 0,
      failed: 0,
      total: recipients.length
    }

    for (const recipient of recipients) {
      try {
        // Check if conversation already exists between sender and recipient
        const { data: existingParticipation } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id)

        let conversationId: string | null = null

        if (existingParticipation) {
          for (const p of existingParticipation) {
            const { data: otherParticipant } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', p.conversation_id)
              .eq('user_id', recipient.id)
              .single()

            if (otherParticipant) {
              conversationId = p.conversation_id
              break
            }
          }
        }

        // Create new conversation if none exists
        if (!conversationId) {
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              is_group: false,
              type: 'direct'
            })
            .select('id')
            .single()

          if (convError || !newConv) {
            results.failed++
            continue
          }

          conversationId = newConv.id

          // Add participants
          await supabase
            .from('conversation_participants')
            .insert([
              { conversation_id: conversationId, user_id: user.id },
              { conversation_id: conversationId, user_id: recipient.id }
            ])
        }

        // Send message with mass broadcast flag in metadata
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            body: `[Expert Broadcast]\n\n${body}`,
            status: 'sent'
          })

        if (msgError) {
          results.failed++
        } else {
          results.sent++
        }

      } catch (error) {
        console.error('Error sending to recipient:', recipient.id, error)
        results.failed++
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      results,
      message: `Mass message sent to ${results.sent} recipients`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Mass message error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
