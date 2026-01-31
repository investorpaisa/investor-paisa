-- Fix 1: Restrict profile updates to prevent privilege escalation
-- Drop existing update policy and create one that prevents changing sensitive fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  -- Prevent users from changing sensitive fields that control privileges
  (tier IS NOT DISTINCT FROM (SELECT tier FROM public.profiles WHERE id = auth.uid())) AND
  (is_expert IS NOT DISTINCT FROM (SELECT is_expert FROM public.profiles WHERE id = auth.uid())) AND
  (is_verified IS NOT DISTINCT FROM (SELECT is_verified FROM public.profiles WHERE id = auth.uid())) AND
  (trust_level IS NOT DISTINCT FROM (SELECT trust_level FROM public.profiles WHERE id = auth.uid())) AND
  (trust_score IS NOT DISTINCT FROM (SELECT trust_score FROM public.profiles WHERE id = auth.uid()))
);

-- Fix 2: Create a public view for profiles that excludes sensitive fields
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id, 
  username, 
  full_name, 
  avatar_url, 
  cover_url, 
  bio, 
  headline,
  location, 
  website, 
  goals, 
  interests, 
  trust_level, 
  trust_score,
  is_verified, 
  is_premium, 
  is_expert,
  tier,
  followers_count, 
  following_count, 
  posts_count,
  streak_days,
  upvote_rate,
  language,
  mobile_verified,
  linkedin_verified,
  profile_completeness_score,
  onboarding_completed,
  linkedin_id,
  created_at, 
  updated_at
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Note: The profiles table email field remains accessible only to the owner via direct query
-- For public profile displays, use the profiles_public view which excludes email