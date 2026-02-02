import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Email OTP Verify] Starting verification...')

    const { email, otp } = await req.json()

    if (!email || !otp) {
      console.error('[Email OTP Verify] Missing email or OTP')
      return new Response(JSON.stringify({ error: 'Email and OTP are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const otpHash = await hashOTP(otp)

    console.log('[Email OTP Verify] Verifying for email:', normalizedEmail)
    console.log('[Email OTP Verify] OTP hash:', otpHash.substring(0, 16) + '...')

    // Try email_otp_requests table first
    let { data: otpRequest, error: fetchError } = await supabase
      .from('email_otp_requests')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Fallback to mobile_otp_requests if email table doesn't exist or no record found
    if (fetchError || !otpRequest) {
      console.log('[Email OTP Verify] Trying fallback table...')
      const { data: fallbackRequest, error: fallbackError } = await supabase
        .from('mobile_otp_requests')
        .select('*')
        .eq('phone_number', `email:${normalizedEmail}`)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fallbackError || !fallbackRequest) {
        console.error('[Email OTP Verify] No OTP request found')
        return new Response(JSON.stringify({ 
          success: false,
          error: 'No pending verification. Please request a new code.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check expiry
      if (new Date(fallbackRequest.expires_at) < new Date()) {
        await supabase.from('mobile_otp_requests').delete().eq('id', fallbackRequest.id)
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Code expired. Please request a new one.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verify OTP (plain text comparison for fallback)
      if (fallbackRequest.otp_code !== otp) {
        console.error('[Email OTP Verify] Invalid OTP')
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Invalid code. Please try again.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Mark as verified and cleanup
      await supabase.from('mobile_otp_requests').delete().eq('id', fallbackRequest.id)

      console.log('[Email OTP Verify] OTP verified successfully (fallback)')
      return new Response(JSON.stringify({
        success: true,
        email: normalizedEmail,
        verified: true,
        message: 'Email verified successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check expiry
    if (new Date(otpRequest.expires_at) < new Date()) {
      await supabase.from('email_otp_requests').delete().eq('id', otpRequest.id)
      console.error('[Email OTP Verify] OTP expired')
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Code expired. Please request a new one.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify OTP hash
    if (otpRequest.otp_hash !== otpHash) {
      console.error('[Email OTP Verify] Invalid OTP hash')
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid code. Please try again.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mark as verified and cleanup
    await supabase.from('email_otp_requests').delete().eq('id', otpRequest.id)

    console.log('[Email OTP Verify] OTP verified successfully')

    return new Response(JSON.stringify({
      success: true,
      email: normalizedEmail,
      verified: true,
      message: 'Email verified successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Email OTP Verify] Error:', error)
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