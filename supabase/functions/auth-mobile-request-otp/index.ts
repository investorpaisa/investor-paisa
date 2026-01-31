import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')

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

    // Send OTP via Twilio if configured
    if (twilioAccountSid && twilioAuthToken) {
      try {
        // Format phone number for Twilio (ensure it starts with +)
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
        
        // Create Basic Auth header for Twilio
        const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
        
        // Twilio Verify API - you can also use the SMS API directly
        // For production, consider using Twilio Verify Service
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: formattedPhone,
              From: '+12184534076', // Twilio phone number - update if needed
              Body: `Your InvestorPaisa verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
            }),
          }
        )

        if (!twilioResponse.ok) {
          const errorData = await twilioResponse.json()
          console.error('Twilio SMS error:', errorData)
          // Don't fail the request - OTP is stored in DB for fallback
          console.log('[WARN] SMS sending failed, OTP stored in database for manual verification')
        } else {
          console.log('SMS sent successfully via Twilio')
        }
      } catch (smsError) {
        console.error('Twilio gateway error:', smsError)
        // Continue even if SMS fails - OTP is stored for demo purposes
      }
    } else {
      // No Twilio configured - development mode
      console.log('[DEV MODE] Twilio not configured - OTP stored in database only')
      console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`)
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'OTP sent successfully',
      // In dev mode without SMS, include OTP for testing (remove in production!)
      ...((!twilioAccountSid || !twilioAuthToken) && { dev_otp: otp })
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
