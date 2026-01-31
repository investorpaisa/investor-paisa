-- Add user tier system to profiles
-- Tier enum for role-aware permissions
CREATE TYPE public.user_tier AS ENUM (
  'guest',
  'unverified_user',
  'verified_user',
  'influencer',
  'expert'
);

-- Add tier-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tier public.user_tier DEFAULT 'unverified_user',
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS upvote_rate DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS linkedin_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completeness_score INTEGER DEFAULT 0;

-- Function to compute profile completeness score
CREATE OR REPLACE FUNCTION public.compute_profile_completeness()
RETURNS trigger AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Name (10 points)
  IF NEW.full_name IS NOT NULL AND length(trim(NEW.full_name)) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Bio (5 points)
  IF NEW.bio IS NOT NULL AND length(trim(NEW.bio)) > 0 THEN 
    score := score + 5; 
  END IF;
  
  -- Headline (10 points)
  IF NEW.headline IS NOT NULL AND length(trim(NEW.headline)) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Location (10 points)
  IF NEW.location IS NOT NULL AND length(trim(NEW.location)) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Avatar (10 points)
  IF NEW.avatar_url IS NOT NULL AND length(trim(NEW.avatar_url)) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Interests (10 points) - if array has items
  IF NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Goals (10 points) - if array has items
  IF NEW.goals IS NOT NULL AND array_length(NEW.goals, 1) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Mobile verified (20 points)
  IF NEW.mobile_verified = true THEN 
    score := score + 20; 
  END IF;
  
  -- LinkedIn verified (15 points)
  IF NEW.linkedin_verified = true THEN 
    score := score + 15; 
  END IF;
  
  NEW.profile_completeness_score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-compute profile completeness on insert/update
DROP TRIGGER IF EXISTS trigger_compute_profile_completeness ON public.profiles;
CREATE TRIGGER trigger_compute_profile_completeness
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_profile_completeness();

-- Function to compute user tier based on profile data
CREATE OR REPLACE FUNCTION public.compute_user_tier()
RETURNS trigger AS $$
BEGIN
  -- Expert tier: is_expert flag set by admin
  IF NEW.is_expert = true THEN
    NEW.tier := 'expert';
  -- Influencer tier: 50+ day streak AND 70%+ upvote rate
  ELSIF NEW.streak_days >= 50 AND NEW.upvote_rate >= 0.7 THEN
    NEW.tier := 'influencer';
  -- Verified tier: mobile or linkedin verified
  ELSIF NEW.mobile_verified = true OR NEW.linkedin_verified = true THEN
    NEW.tier := 'verified_user';
  -- Default: unverified user (email signup only)
  ELSE
    NEW.tier := 'unverified_user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-compute user tier on insert/update
DROP TRIGGER IF EXISTS trigger_compute_user_tier ON public.profiles;
CREATE TRIGGER trigger_compute_user_tier
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_user_tier();

-- Add conversation type column
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'mass'));

-- Add new notification types
DO $$ 
BEGIN
  -- Check if the value already exists before adding
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'message' AND enumtypid = 'public.notification_type'::regtype) THEN
    ALTER TYPE public.notification_type ADD VALUE 'message';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'community_post' AND enumtypid = 'public.notification_type'::regtype) THEN
    ALTER TYPE public.notification_type ADD VALUE 'community_post';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tier_change' AND enumtypid = 'public.notification_type'::regtype) THEN
    ALTER TYPE public.notification_type ADD VALUE 'tier_change';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;