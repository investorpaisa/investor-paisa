import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateOTP(): string {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const smsApiKey = Deno.env.get('SMS_GATEWAY_API_KEY')

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

    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: 'Phone number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return new Response(JSON.stringify({ error: 'Invalid phone number format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

    // Delete any existing OTP requests for this user
    await supabase
      .from('mobile_otp_requests')
      .delete()
      .eq('user_id', user.id)

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('mobile_otp_requests')
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      })

    if (insertError) {
      console.error('Failed to store OTP:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to generate OTP' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send OTP via SMS gateway (if configured)
    if (smsApiKey) {
      try {
        // Generic SMS API integration (MSG91 style)
        // You can replace this with your preferred SMS gateway
        const smsResponse = await fetch('https://api.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authkey': smsApiKey,
          },
          body: JSON.stringify({
            mobile: phoneNumber.replace('+', ''),
            otp: otp,
            sender: 'INVPSA',
            message: `Your Investor Paisa verification code is ${otp}. Valid for 10 minutes.`,
          }),
        })

        if (!smsResponse.ok) {
          console.warn('SMS sending failed, but OTP is stored')
        }
      } catch (smsError) {
        console.warn('SMS gateway error:', smsError)
        // Continue even if SMS fails - OTP is stored for demo purposes
      }
    } else {
      // No SMS gateway configured - log OTP for development
      console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`)
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'OTP sent successfully',
      // Include OTP in dev mode for testing
      ...(Deno.env.get('ENVIRONMENT') === 'development' ? { otp } : {})
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('OTP request error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
