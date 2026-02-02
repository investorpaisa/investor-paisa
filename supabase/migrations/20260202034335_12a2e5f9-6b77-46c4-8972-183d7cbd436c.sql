-- Create email_otp_requests table for email OTP verification
CREATE TABLE IF NOT EXISTS public.email_otp_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_email_otp_requests_email ON public.email_otp_requests(email);

-- Enable RLS but allow service role operations
ALTER TABLE public.email_otp_requests ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role (edge functions) to manage OTP requests
CREATE POLICY "Service role can manage email OTP requests" 
ON public.email_otp_requests 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Auto-cleanup expired OTPs (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_email_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_otp_requests WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint on email and username in profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_key' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
EXCEPTION WHEN others THEN
  -- If constraint already exists or other error, ignore
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;