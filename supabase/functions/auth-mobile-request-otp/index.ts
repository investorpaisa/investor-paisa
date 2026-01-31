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
    
    // RCA FIX: OTP_ACCOUNT_SID was an API Key (SK...), not Account SID (AC...)
    // Twilio requires the main Account SID that owns the phone number
    // ALWAYS use TWILIO_ACCOUNT_SID (which starts with AC) as the main account
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')

    console.log('[OTP Request] Starting OTP request...')
    console.log('[OTP Request] TWILIO_ACCOUNT_SID configured:', !!twilioAccountSid)
    console.log('[OTP Request] TWILIO_AUTH_TOKEN configured:', !!twilioAuthToken)
    console.log('[OTP Request] Account SID prefix:', twilioAccountSid ? twilioAccountSid.substring(0, 6) + '...' : 'NONE')

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[OTP Request] No authorization header provided')
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
      console.error('[OTP Request] Invalid token:', authError)
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[OTP Request] User authenticated:', user.id)

    const requestBody = await req.json()
    const { phoneNumber } = requestBody
    console.log('[OTP Request] Phone number received:', phoneNumber)

    if (!phoneNumber) {
      console.error('[OTP Request] Phone number is missing')
      return new Response(JSON.stringify({ error: 'Phone number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate phone number format (basic validation - accepts with or without country code)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
    console.log('[OTP Request] Cleaned phone number:', cleanedPhone)
    
    if (!phoneRegex.test(cleanedPhone)) {
      console.error('[OTP Request] Invalid phone format:', cleanedPhone)
      return new Response(JSON.stringify({ error: 'Invalid phone number format. Include country code (e.g., +91XXXXXXXXXX)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

    console.log('[OTP Request] Generated OTP:', otp)
    console.log('[OTP Request] Expires at:', expiresAt.toISOString())

    // Delete any existing OTP requests for this user
    const { error: deleteError } = await supabase
      .from('mobile_otp_requests')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.warn('[OTP Request] Failed to delete existing OTPs:', deleteError)
    }

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('mobile_otp_requests')
      .insert({
        user_id: user.id,
        phone_number: cleanedPhone,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      })

    if (insertError) {
      console.error('[OTP Request] Failed to store OTP:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to generate OTP' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[OTP Request] OTP stored in database successfully')

    // Send OTP via SMS if credentials are configured
    let smsSent = false
    let smsError: string | null = null

    if (twilioAccountSid && twilioAuthToken) {
      try {
        // Format phone number for Twilio (ensure it starts with +)
        const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`
        
        console.log('[OTP Request] Sending SMS to:', formattedPhone)
        console.log('[OTP Request] Using Account SID:', twilioAccountSid.substring(0, 10) + '...')
        
        // RCA FIX: Use the Account SID that owns the phone number for both auth and API URL
        const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
        
        const smsBody = new URLSearchParams({
          To: formattedPhone,
          From: '+12184534076', // Twilio phone number owned by TWILIO_ACCOUNT_SID
          Body: `Your InvestorPaisa verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
        })

        console.log('[OTP Request] SMS request body:', {
          To: formattedPhone,
          From: '+12184534076',
          Body: `OTP: ${otp.substring(0, 3)}***`
        })

        // RCA FIX: Use twilioAccountSid in the URL path (must match the account that owns the From number)
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: smsBody,
          }
        )

        const twilioResponseText = await twilioResponse.text()
        console.log('[OTP Request] Twilio response status:', twilioResponse.status)
        console.log('[OTP Request] Twilio response:', twilioResponseText)

        if (!twilioResponse.ok) {
          const errorData = JSON.parse(twilioResponseText)
          console.error('[OTP Request] Twilio SMS error:', errorData)
          smsError = errorData.message || 'SMS sending failed'
        } else {
          const successData = JSON.parse(twilioResponseText)
          console.log('[OTP Request] SMS sent successfully! SID:', successData.sid)
          smsSent = true
        }
      } catch (smsErr) {
        console.error('[OTP Request] Twilio gateway error:', smsErr)
        smsError = smsErr instanceof Error ? smsErr.message : 'SMS gateway error'
      }
    } else {
      console.log('[OTP Request] [DEV MODE] SMS credentials not configured')
      console.log('[OTP Request] [DEV MODE] OTP for testing:', otp)
    }

    // Build response
    const response: Record<string, unknown> = { 
      success: true,
      message: smsSent ? 'OTP sent successfully' : 'OTP generated (check logs for dev mode)',
      smsSent,
    }

    // Include OTP in dev mode or if SMS failed
    if (!smsSent) {
      response.dev_otp = otp
      if (smsError) {
        response.smsError = smsError
      }
    }

    console.log('[OTP Request] Final response:', { ...response, dev_otp: response.dev_otp ? '***' : undefined })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[OTP Request] Unhandled error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
