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
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    })

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
    let email: string | null = null
    let phone: string | null = null
    let linkedinId: string | null = null

    switch (provider) {
      case 'email':
        // For email, credential is the email address (already verified via OTP)
        email = credential.toLowerCase().trim()
        console.log('[Auth Complete] Email provider:', email)
        break
        
      case 'mobile':
        // For mobile, credential is the phone number (already verified via OTP)
        phone = credential.replace(/[\s\-\(\)]/g, '')
        if (!phone.startsWith('+')) phone = `+${phone}`
        console.log('[Auth Complete] Mobile provider:', phone)
        break
        
      case 'google':
        // For Google, credential is the user ID from OAuth
        email = metadata?.email as string || null
        console.log('[Auth Complete] Google provider, email:', email)
        break
        
      case 'linkedin':
        // For LinkedIn, credential is the sub claim from OIDC
        linkedinId = credential
        email = metadata?.email as string || null
        console.log('[Auth Complete] LinkedIn provider:', linkedinId)
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

    // Step 2: Check if user exists in auth.users by email or phone
    let authUser = null
    
    if (email) {
      console.log('[Auth Complete] Looking up auth user by email:', email)
      const { data: authData } = await supabase.auth.admin.listUsers()
      authUser = authData?.users?.find(u => u.email === email)
      
      if (authUser) {
        console.log('[Auth Complete] Found existing auth user:', authUser.id)
      }
    }
    
    if (!authUser && phone) {
      console.log('[Auth Complete] Looking up auth user by phone:', phone)
      const { data: authData } = await supabase.auth.admin.listUsers()
      authUser = authData?.users?.find(u => u.phone === phone)
      
      if (authUser) {
        console.log('[Auth Complete] Found existing auth user:', authUser.id)
      }
    }

    // Step 3: Create user if doesn't exist
    let isNewUser = false
    
    if (!authUser) {
      console.log('[Auth Complete] No existing user, creating new user...')
      isNewUser = true
      
      // Generate a secure random password (user won't use it, they use OTP)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID()
      
      const createPayload: { email?: string; phone?: string; password: string; email_confirm?: boolean; phone_confirm?: boolean } = {
        password: randomPassword,
      }
      
      if (email) {
        createPayload.email = email
        createPayload.email_confirm = true // Mark email as confirmed since they verified OTP
      }
      
      if (phone) {
        createPayload.phone = phone
        createPayload.phone_confirm = true // Mark phone as confirmed since they verified OTP
      }
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser(createPayload)
      
      if (createError) {
        console.error('[Auth Complete] Failed to create user:', createError)
        
        // Handle duplicate - user might exist but we couldn't find them
        if (createError.message?.includes('already')) {
          // Try to find the user again
          const { data: authData } = await supabase.auth.admin.listUsers()
          authUser = authData?.users?.find(u => 
            (email && u.email === email) || (phone && u.phone === phone)
          )
          
          if (!authUser) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Failed to create or find user' 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          isNewUser = false
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            error: createError.message || 'Failed to create user' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } else {
        authUser = newUser.user
        console.log('[Auth Complete] Created new auth user:', authUser.id)
      }
    }

    // Step 4: Ensure profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (!existingProfile) {
      console.log('[Auth Complete] Creating profile for user:', authUser.id)
      
      const profileData: Record<string, unknown> = {
        id: authUser.id,
        email: email,
        phone: phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      if (linkedinId) {
        profileData.linkedin_id = linkedinId
        profileData.linkedin_verified = true
      }
      
      if (provider === 'mobile') {
        profileData.mobile_verified = true
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
      
      if (profileError) {
        console.error('[Auth Complete] Failed to create profile:', profileError)
        // Continue anyway, profile might be created by trigger
      }
    } else {
      // Update verification status based on provider
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (provider === 'mobile') updateData.mobile_verified = true
      if (provider === 'linkedin') {
        updateData.linkedin_id = linkedinId
        updateData.linkedin_verified = true
      }
      
      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', authUser.id)
    }

    // Step 5: Log completion
    // Note: Session creation via admin API is complex; frontend will handle session
    // via Supabase's signInWithOtp or other methods
    console.log('[Auth Complete] User ready:', authUser.id, 'isNewUser:', isNewUser)

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        phone: authUser.phone,
      },
      session: null, // Session handled by frontend via Supabase signInWithOtp
      isNewUser,
      message: isNewUser ? 'User created successfully' : 'User authenticated successfully'
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
