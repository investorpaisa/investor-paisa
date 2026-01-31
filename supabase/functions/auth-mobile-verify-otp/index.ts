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

    const { otp, phoneNumber } = await req.json()

    if (!otp || !phoneNumber) {
      return new Response(JSON.stringify({ error: 'OTP and phone number are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find the OTP request
    const { data: otpRequest, error: fetchError } = await supabase
      .from('mobile_otp_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone_number', phoneNumber)
      .eq('verified', false)
      .single()

    if (fetchError || !otpRequest) {
      return new Response(JSON.stringify({ error: 'No pending OTP request found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if OTP has expired
    if (new Date(otpRequest.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase
        .from('mobile_otp_requests')
        .delete()
        .eq('id', otpRequest.id)

      return new Response(JSON.stringify({ error: 'OTP has expired. Please request a new one.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify OTP
    if (otpRequest.otp_code !== otp) {
      return new Response(JSON.stringify({ error: 'Invalid OTP' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mark OTP as verified
    await supabase
      .from('mobile_otp_requests')
      .update({ verified: true })
      .eq('id', otpRequest.id)

    // Update user profile - set mobile_verified to true
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ mobile_verified: true })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update profile:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to verify mobile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Clean up old OTP requests
    await supabase
      .from('mobile_otp_requests')
      .delete()
      .eq('user_id', user.id)

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Mobile number verified successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
