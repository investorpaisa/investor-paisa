import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface AuthCompleteRequest {
  provider: 'email' | 'google' | 'mobile' | 'linkedin';
  credential: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { provider, credential, metadata }: AuthCompleteRequest = await req.json()

    console.log('[Auth Complete] Request received:', { provider, hasCredential: !!credential })

    if (!provider || !credential) {
      console.error('[Auth Complete] Missing provider or credential')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Provider and credential are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 1: Validate credential and derive identity key based on provider
    let identityKey: string
    let email: string | null = null
    let phone: string | null = null
    let linkedinId: string | null = null

    switch (provider) {
      case 'email':
        // For email, credential is the email address (already verified via OTP)
        email = credential.toLowerCase().trim()
        identityKey = `email:${email}`
        console.log('[Auth Complete] Email provider, identity key:', identityKey)
        break
        
      case 'mobile':
        // For mobile, credential is the phone number (already verified via OTP)
        phone = credential.replace(/[\s\-\(\)]/g, '')
        if (!phone.startsWith('+')) phone = `+${phone}`
        identityKey = `phone:${phone}`
        console.log('[Auth Complete] Mobile provider, identity key:', identityKey)
        break
        
      case 'google':
        // For Google, credential is the user ID from OAuth
        email = metadata?.email as string || null
        identityKey = `google:${credential}`
        console.log('[Auth Complete] Google provider, identity key:', identityKey)
        break
        
      case 'linkedin':
        // For LinkedIn, credential is the sub claim from OIDC
        linkedinId = credential
        email = metadata?.email as string || null
        identityKey = `linkedin:${credential}`
        console.log('[Auth Complete] LinkedIn provider, identity key:', identityKey)
        break
        
      default:
        console.error('[Auth Complete] Unknown provider:', provider)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Unknown provider' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    // Step 2: Check if user exists by email or phone
    let existingUser = null
    
    if (email) {
      console.log('[Auth Complete] Looking up user by email:', email)
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      
      if (profileByEmail) {
        existingUser = profileByEmail
        console.log('[Auth Complete] Found existing user by email:', existingUser.id)
      }
    }
    
    if (!existingUser && phone) {
      console.log('[Auth Complete] Looking up user by phone:', phone)
      const { data: profileByPhone } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .maybeSingle()
      
      if (profileByPhone) {
        existingUser = profileByPhone
        console.log('[Auth Complete] Found existing user by phone:', existingUser.id)
      }
    }

    if (!existingUser && linkedinId) {
      console.log('[Auth Complete] Looking up user by LinkedIn ID:', linkedinId)
      const { data: profileByLinkedIn } = await supabase
        .from('profiles')
        .select('*')
        .eq('linkedin_id', linkedinId)
        .maybeSingle()
      
      if (profileByLinkedIn) {
        existingUser = profileByLinkedIn
        console.log('[Auth Complete] Found existing user by LinkedIn ID:', existingUser.id)
      }
    }

    // Step 3: Return existing user or indicate new user needed
    if (existingUser) {
      console.log('[Auth Complete] Returning existing user:', existingUser.id)
      
      // Update verification status based on provider
      const updateData: Record<string, unknown> = {}
      if (provider === 'mobile') updateData.mobile_verified = true
      if (provider === 'linkedin') {
        updateData.linkedin_id = linkedinId
        updateData.linkedin_verified = true
      }
      
      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', existingUser.id)
      }
      
      return new Response(JSON.stringify({
        success: true,
        user: existingUser,
        isNewUser: false,
        message: 'User authenticated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 4: For new users, return that they need to be created
    // The actual user creation happens through Supabase Auth on the frontend
    console.log('[Auth Complete] No existing user found, signaling new user creation needed')
    
    return new Response(JSON.stringify({
      success: true,
      isNewUser: true,
      identityKey,
      email,
      phone,
      message: 'New user - proceed with signup'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Auth Complete] Error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})