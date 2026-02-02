import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Email OTP Request] Starting...')
    console.log('[Email OTP Request] Resend API Key configured:', !!resendApiKey)

    const { email } = await req.json()

    if (!email) {
      console.error('[Email OTP Request] Email is missing')
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('[Email OTP Request] Invalid email format:', email)
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log('[Email OTP Request] Processing email:', normalizedEmail)

    // Generate OTP and hash
    const otp = generateOTP()
    const otpHash = await hashOTP(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    console.log('[Email OTP Request] Generated OTP:', otp)
    console.log('[Email OTP Request] OTP hash:', otpHash.substring(0, 16) + '...')

    // Delete any existing OTP requests for this email
    await supabase
      .from('email_otp_requests')
      .delete()
      .eq('email', normalizedEmail)

    // Store OTP hash in database
    const { error: insertError } = await supabase
      .from('email_otp_requests')
      .insert({
        email: normalizedEmail,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        verified: false
      })

    if (insertError) {
      console.error('[Email OTP Request] Failed to store OTP:', insertError)
      
      // If table doesn't exist, try mobile_otp_requests as fallback
      // Use a temporary user_id for email-based OTPs
      const tempUserId = crypto.randomUUID()
      const { error: fallbackError } = await supabase
        .from('mobile_otp_requests')
        .insert({
          user_id: tempUserId,
          phone_number: `email:${normalizedEmail}`,
          otp_code: otp, // Store plain for fallback (mobile_otp_requests structure)
          expires_at: expiresAt.toISOString(),
          verified: false
        })
      
      if (fallbackError) {
        console.error('[Email OTP Request] Fallback also failed:', fallbackError)
        return new Response(JSON.stringify({ error: 'Failed to generate OTP' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    console.log('[Email OTP Request] OTP stored successfully')

    // Send email via Resend if configured
    let emailSent = false
    let emailError: string | null = null

    if (resendApiKey) {
      try {
        console.log('[Email OTP Request] Sending email via Resend...')
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'InvestorPaisa <noreply@investorpaisa.com>',
            to: [normalizedEmail],
            subject: 'Your InvestorPaisa verification code',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #1a1a1a;">
                  Investor<span style="color: #6366f1;">Paisa</span>
                </h1>
                <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 24px;">
                  Your verification code is:
                </p>
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                  ${otp}
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                  This code expires in 10 minutes.
                </p>
                <p style="font-size: 14px; color: #6b7280;">
                  If you didn't request this code, you can safely ignore this email.
                </p>
              </div>
            `,
          }),
        })

        const responseText = await emailResponse.text()
        console.log('[Email OTP Request] Resend response:', emailResponse.status, responseText)

        if (emailResponse.ok) {
          emailSent = true
          console.log('[Email OTP Request] Email sent successfully')
        } else {
          emailError = `Resend API error: ${responseText}`
          console.error('[Email OTP Request] Email send failed:', responseText)
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Email gateway error'
        console.error('[Email OTP Request] Email send error:', err)
      }
    } else {
      console.log('[Email OTP Request] [DEV MODE] Resend not configured')
      console.log('[Email OTP Request] [DEV MODE] OTP for testing:', otp)
    }

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      message: emailSent ? 'Verification code sent to your email' : 'OTP generated',
      emailSent,
    }

    // Include OTP in dev mode or if email failed
    if (!emailSent) {
      response.dev_otp = otp
      if (emailError) {
        response.emailError = emailError
      }
    }

    console.log('[Email OTP Request] Response:', { ...response, dev_otp: response.dev_otp ? '***' : undefined })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Email OTP Request] Error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})