import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log('[OTP Verify] Starting OTP verification...')

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[OTP Verify] No authorization header')
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
      console.error('[OTP Verify] Invalid token:', authError)
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[OTP Verify] User authenticated:', user.id)

    const requestBody = await req.json()
    const { otp, phoneNumber } = requestBody

    console.log('[OTP Verify] Verification attempt:', {
      userId: user.id,
      phoneNumber: phoneNumber ? phoneNumber.substring(0, 5) + '...' : null,
      otpProvided: otp ? otp.substring(0, 2) + '****' : null,
    })

    if (!otp || !phoneNumber) {
      console.error('[OTP Verify] Missing OTP or phone number')
      return new Response(JSON.stringify({ error: 'OTP and phone number are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Clean the phone number to match stored format
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
    console.log('[OTP Verify] Cleaned phone:', cleanedPhone.substring(0, 5) + '...')

    // Find the OTP request
    const { data: otpRequest, error: fetchError } = await supabase
      .from('mobile_otp_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('[OTP Verify] OTP request lookup result:', {
      found: !!otpRequest,
      error: fetchError?.message || null,
    })

    if (fetchError || !otpRequest) {
      console.error('[OTP Verify] No pending OTP request found:', fetchError)
      return new Response(JSON.stringify({ error: 'No pending OTP request found. Please request a new OTP.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[OTP Verify] Found OTP request:', {
      id: otpRequest.id,
      storedPhone: otpRequest.phone_number?.substring(0, 5) + '...',
      storedOtp: otpRequest.otp_code?.substring(0, 2) + '****',
      expiresAt: otpRequest.expires_at,
      attempts: otpRequest.attempts || 0,
    })

    // Security: Check if max attempts exceeded (brute-force protection)
    const MAX_ATTEMPTS = 3
    const currentAttempts = otpRequest.attempts || 0
    
    if (currentAttempts >= MAX_ATTEMPTS) {
      // Delete OTP after max failed attempts
      await supabase
        .from('mobile_otp_requests')
        .delete()
        .eq('id', otpRequest.id)
      
      console.error('[OTP Verify] Max attempts exceeded, OTP invalidated')
      return new Response(JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if phone numbers match (compare cleaned versions)
    const storedPhoneCleaned = otpRequest.phone_number?.replace(/[\s\-\(\)]/g, '')
    if (storedPhoneCleaned !== cleanedPhone) {
      console.error('[OTP Verify] Phone number mismatch:', {
        stored: storedPhoneCleaned?.substring(0, 5) + '...',
        provided: cleanedPhone.substring(0, 5) + '...',
      })
      return new Response(JSON.stringify({ error: 'Phone number does not match the OTP request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if OTP has expired
    const expiresAt = new Date(otpRequest.expires_at)
    const now = new Date()
    console.log('[OTP Verify] Expiry check:', {
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
      expired: expiresAt < now,
    })

    if (expiresAt < now) {
      // Delete expired OTP
      await supabase
        .from('mobile_otp_requests')
        .delete()
        .eq('id', otpRequest.id)

      console.error('[OTP Verify] OTP has expired')
      return new Response(JSON.stringify({ error: 'OTP has expired. Please request a new one.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify OTP
    const otpMatch = otpRequest.otp_code === otp
    console.log('[OTP Verify] OTP comparison:', {
      match: otpMatch,
      storedOtp: otpRequest.otp_code?.substring(0, 2) + '****',
      providedOtp: otp?.substring(0, 2) + '****',
    })

    if (!otpMatch) {
      // Increment failed attempts counter
      await supabase
        .from('mobile_otp_requests')
        .update({ attempts: currentAttempts + 1 })
        .eq('id', otpRequest.id)
      
      const remainingAttempts = MAX_ATTEMPTS - currentAttempts - 1
      console.error('[OTP Verify] Invalid OTP provided. Remaining attempts:', remainingAttempts)
      
      return new Response(JSON.stringify({ 
        error: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new OTP.'}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[OTP Verify] OTP verified successfully!')

    // Mark OTP as verified
    const { error: updateOtpError } = await supabase
      .from('mobile_otp_requests')
      .update({ verified: true })
      .eq('id', otpRequest.id)

    if (updateOtpError) {
      console.warn('[OTP Verify] Failed to mark OTP as verified:', updateOtpError)
    }

    // Update user profile - set mobile_verified to true and store phone
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        mobile_verified: true,
        phone: cleanedPhone 
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[OTP Verify] Failed to update profile:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to verify mobile. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[OTP Verify] Profile updated - mobile_verified = true')

    // Clean up old OTP requests for this user
    const { error: cleanupError } = await supabase
      .from('mobile_otp_requests')
      .delete()
      .eq('user_id', user.id)

    if (cleanupError) {
      console.warn('[OTP Verify] Failed to cleanup OTP requests:', cleanupError)
    }

    console.log('[OTP Verify] Verification complete for user:', user.id)

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Mobile number verified successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[OTP Verify] Unhandled error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})