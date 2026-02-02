-- Security Fix 1: Add attempts column to mobile_otp_requests for brute-force prevention
ALTER TABLE public.mobile_otp_requests 
ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

-- Security Fix 2: Restrict device_sessions access to only the user who owns the session
-- First check current policies and update
DROP POLICY IF EXISTS "Users can view own sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.device_sessions;

-- Create strict RLS policies for device_sessions
CREATE POLICY "Users can view own sessions" 
ON public.device_sessions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON public.device_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON public.device_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);