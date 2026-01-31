-- Drop the SECURITY DEFINER view and recreate as normal view with RLS
DROP VIEW IF EXISTS profiles_public;

-- Create the view without SECURITY DEFINER (normal view)
CREATE OR REPLACE VIEW profiles_public AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  cover_url,
  bio,
  headline,
  location,
  is_verified,
  is_expert,
  is_premium,
  followers_count,
  following_count,
  posts_count,
  trust_level,
  trust_score,
  tier,
  interests,
  goals,
  profile_completeness_score,
  created_at,
  updated_at,
  linkedin_url,
  twitter_url,
  instagram_url,
  website,
  privacy_experience,
  privacy_education,
  privacy_certifications,
  privacy_skills
FROM profiles;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON profiles_public TO authenticated;
GRANT SELECT ON profiles_public TO anon;