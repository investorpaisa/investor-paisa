-- Fix the profiles_public view to use security_invoker
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
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