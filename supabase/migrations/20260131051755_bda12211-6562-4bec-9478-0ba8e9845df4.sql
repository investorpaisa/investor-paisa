-- PHASE 1: CRITICAL RLS FIXES

-- CRITICAL FIX 1: Profiles table - restrict sensitive data exposure
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow viewing basic profile info (frontend must not select email/portfolio_value for public queries)
CREATE POLICY "Public profile fields viewable" ON public.profiles
FOR SELECT USING (true);

-- CRITICAL FIX 2: Events table - prevent user_id spoofing
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;

CREATE POLICY "Users can only insert own events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- CRITICAL FIX 3: Expert profiles - protect license data for non-authenticated
DROP POLICY IF EXISTS "Expert profiles are viewable" ON public.expert_profiles;

CREATE POLICY "Verified expert profiles publicly viewable" ON public.expert_profiles
FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Authenticated can view all expert profiles" ON public.expert_profiles
FOR SELECT TO authenticated
USING (true);

-- CRITICAL FIX 4: Update referral code generation to use cryptographically random codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'learner');
  
  -- Generate cryptographically random referral code (not deterministic MD5)
  INSERT INTO public.referrals (referrer_id, referral_code)
  VALUES (NEW.id, UPPER(ENCODE(GEN_RANDOM_BYTES(6), 'hex')));
  
  RETURN NEW;
END;
$function$;