-- Add privacy settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_experience boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_education boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_certifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_skills boolean DEFAULT true;

-- Update the compute_profile_completeness function to remove avatar and add goals weight
CREATE OR REPLACE FUNCTION public.compute_profile_completeness(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  score integer := 0;
  profile_row record;
  exp_count integer;
  edu_count integer;
  skill_count integer;
  cert_count integer;
BEGIN
  -- Get profile
  SELECT * INTO profile_row FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Full name (10 pts)
  IF profile_row.full_name IS NOT NULL AND length(trim(profile_row.full_name)) >= 2 THEN
    score := score + 10;
  END IF;

  -- Bio (10 pts) - increased from previous
  IF profile_row.bio IS NOT NULL AND length(trim(profile_row.bio)) >= 10 THEN
    score := score + 10;
  END IF;

  -- Goals (15 pts) - new high-weight field
  IF profile_row.goals IS NOT NULL AND array_length(profile_row.goals, 1) >= 1 THEN
    score := score + 15;
  END IF;

  -- Headline (5 pts)
  IF profile_row.headline IS NOT NULL AND length(trim(profile_row.headline)) >= 3 THEN
    score := score + 5;
  END IF;

  -- Location (5 pts)
  IF profile_row.location IS NOT NULL AND length(trim(profile_row.location)) >= 2 THEN
    score := score + 5;
  END IF;

  -- Interests (5 pts)
  IF profile_row.interests IS NOT NULL AND array_length(profile_row.interests, 1) >= 1 THEN
    score := score + 5;
  END IF;

  -- Mobile verified (10 pts)
  IF profile_row.mobile_verified = true THEN
    score := score + 10;
  END IF;

  -- LinkedIn verified (10 pts)
  IF profile_row.linkedin_verified = true THEN
    score := score + 10;
  END IF;

  -- Experience (10 pts)
  SELECT COUNT(*) INTO exp_count FROM user_experiences WHERE user_id = p_user_id;
  IF exp_count >= 1 THEN
    score := score + 10;
  END IF;

  -- Education (10 pts)
  SELECT COUNT(*) INTO edu_count FROM user_educations WHERE user_id = p_user_id;
  IF edu_count >= 1 THEN
    score := score + 10;
  END IF;

  -- Skills (5 pts)
  SELECT COUNT(*) INTO skill_count FROM user_skills WHERE user_id = p_user_id;
  IF skill_count >= 3 THEN
    score := score + 5;
  END IF;

  -- Certifications (5 pts - bonus)
  SELECT COUNT(*) INTO cert_count FROM user_certifications WHERE user_id = p_user_id;
  IF cert_count >= 1 THEN
    score := score + 5;
  END IF;

  -- Clamp to 100
  IF score > 100 THEN score := 100; END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update profiles_public view to include privacy fields (for checking visibility)
DROP VIEW IF EXISTS profiles_public;
CREATE VIEW profiles_public AS
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