-- Fix the RLS policy to be more restrictive (only service role can access)
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage email OTP requests" ON public.email_otp_requests;

-- The table will be accessible only via service role key (edge functions)
-- No public RLS policies needed since anon users shouldn't access this directly

-- Fix the function search_path issue
DROP FUNCTION IF EXISTS cleanup_expired_email_otps();

CREATE OR REPLACE FUNCTION public.cleanup_expired_email_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_otp_requests WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;