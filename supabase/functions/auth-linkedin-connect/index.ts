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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const linkedinClientId = Deno.env.get('LINKEDIN_CLIENT_ID')
    const linkedinClientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET')

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

    const { action, code, redirectUri } = await req.json()

    // Action: Get authorization URL
    if (action === 'get_auth_url') {
      if (!linkedinClientId) {
        return new Response(JSON.stringify({ 
          error: 'LinkedIn OAuth not configured',
          message: 'Contact admin to configure LinkedIn integration'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const state = crypto.randomUUID()
      const scopes = ['openid', 'profile', 'email']
      
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${linkedinClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(scopes.join(' '))}`

      return new Response(JSON.stringify({ authUrl, state }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: Exchange code for token and update profile
    if (action === 'exchange_code') {
      if (!linkedinClientId || !linkedinClientSecret) {
        return new Response(JSON.stringify({ 
          error: 'LinkedIn OAuth not configured' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: linkedinClientId,
          client_secret: linkedinClientSecret,
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        console.error('LinkedIn token exchange failed:', error)
        return new Response(JSON.stringify({ error: 'Failed to exchange code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      // Fetch LinkedIn profile using userinfo endpoint (OpenID Connect)
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!profileResponse.ok) {
        console.error('Failed to fetch LinkedIn profile')
        return new Response(JSON.stringify({ error: 'Failed to fetch LinkedIn profile' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const profileData = await profileResponse.json()
      const linkedinId = profileData.sub // OpenID subject (unique identifier)

      // Update the user's profile with LinkedIn ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          linkedin_id: linkedinId,
          linkedin_verified: true 
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ 
        success: true,
        linkedinId,
        name: profileData.name || `${profileData.given_name} ${profileData.family_name}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('LinkedIn connect error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
