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
    
    // Use OIDC credentials
    const linkedinClientId = Deno.env.get('LINKEDIN_OIDC_CLIENT_ID')
    const linkedinClientSecret = Deno.env.get('LINKEDIN_OIDC_CLIENT_SECRET')

    console.log('[LinkedIn OIDC] Request received')
    console.log('[LinkedIn OIDC] Client ID configured:', !!linkedinClientId)
    console.log('[LinkedIn OIDC] Client Secret configured:', !!linkedinClientSecret)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[LinkedIn OIDC] No authorization header')
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
      console.error('[LinkedIn OIDC] Invalid token:', authError)
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[LinkedIn OIDC] User authenticated:', user.id)

    const { action, code, redirectUri } = await req.json()
    console.log('[LinkedIn OIDC] Action:', action)
    console.log('[LinkedIn OIDC] Redirect URI:', redirectUri)

    // Action: Get authorization URL (OpenID Connect)
    if (action === 'get_auth_url') {
      if (!linkedinClientId) {
        console.error('[LinkedIn OIDC] Client ID not configured')
        return new Response(JSON.stringify({ 
          error: 'LinkedIn OAuth not configured',
          message: 'Contact admin to configure LinkedIn OIDC integration'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const state = crypto.randomUUID()
      // OpenID Connect scopes
      const scopes = ['openid', 'profile', 'email']
      
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${linkedinClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(scopes.join(' '))}`

      console.log('[LinkedIn OIDC] Generated auth URL with state:', state)

      return new Response(JSON.stringify({ authUrl, state }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: Exchange code for token and update profile (OpenID Connect)
    if (action === 'exchange_code') {
      if (!linkedinClientId || !linkedinClientSecret) {
        console.error('[LinkedIn OIDC] Credentials not configured')
        return new Response(JSON.stringify({ 
          error: 'LinkedIn OAuth not configured' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('[LinkedIn OIDC] Exchanging code for access token...')

      // Exchange authorization code for access token
      const tokenRequestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: linkedinClientId,
        client_secret: linkedinClientSecret,
      })

      console.log('[LinkedIn OIDC] Token request params:', {
        grant_type: 'authorization_code',
        code: code?.substring(0, 20) + '...',
        redirect_uri: redirectUri,
        client_id: linkedinClientId,
      })

      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenRequestBody,
      })

      const tokenResponseText = await tokenResponse.text()
      console.log('[LinkedIn OIDC] Token response status:', tokenResponse.status)
      console.log('[LinkedIn OIDC] Token response:', tokenResponseText)

      if (!tokenResponse.ok) {
        console.error('[LinkedIn OIDC] Token exchange failed:', tokenResponseText)
        return new Response(JSON.stringify({ 
          error: 'Failed to exchange code',
          details: tokenResponseText
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const tokenData = JSON.parse(tokenResponseText)
      const accessToken = tokenData.access_token

      console.log('[LinkedIn OIDC] Access token obtained, fetching userinfo...')

      // Fetch LinkedIn profile using OpenID Connect userinfo endpoint
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      const profileResponseText = await profileResponse.text()
      console.log('[LinkedIn OIDC] Userinfo response status:', profileResponse.status)
      console.log('[LinkedIn OIDC] Userinfo response:', profileResponseText)

      if (!profileResponse.ok) {
        console.error('[LinkedIn OIDC] Failed to fetch userinfo:', profileResponseText)
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch LinkedIn profile',
          details: profileResponseText
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const profileData = JSON.parse(profileResponseText)
      
      // Extract OpenID Connect claims
      const linkedinId = profileData.sub // OpenID subject (unique identifier)
      const email = profileData.email
      const name = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim()
      const picture = profileData.picture

      console.log('[LinkedIn OIDC] User data extracted:', {
        sub: linkedinId,
        email: email ? email.substring(0, 5) + '...' : null,
        name,
        hasPicture: !!picture
      })

      // Update the user's profile with LinkedIn ID and set verified
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          linkedin_id: linkedinId,
          linkedin_verified: true 
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('[LinkedIn OIDC] Failed to update profile:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('[LinkedIn OIDC] Profile updated successfully for user:', user.id)

      return new Response(JSON.stringify({ 
        success: true,
        linkedinId,
        name,
        email: email ? `${email.substring(0, 3)}...` : null // Mask email in response
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[LinkedIn OIDC] Error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
