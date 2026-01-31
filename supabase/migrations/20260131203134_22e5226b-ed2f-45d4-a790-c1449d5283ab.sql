-- Update compute_profile_completeness function
-- Remove avatar from calculation, add more weight to goals
CREATE OR REPLACE FUNCTION public.compute_profile_completeness()
RETURNS trigger AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Name (10 points)
  IF NEW.full_name IS NOT NULL AND length(trim(NEW.full_name)) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Bio (10 points - increased from 5)
  IF NEW.bio IS NOT NULL AND length(trim(NEW.bio)) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Headline (10 points)
  IF NEW.headline IS NOT NULL AND length(trim(NEW.headline)) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Location (10 points)
  IF NEW.location IS NOT NULL AND length(trim(NEW.location)) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Avatar removed from scoring (was 10 points) - user request
  
  -- Interests (10 points) - if array has items
  IF NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0 THEN 
    score := score + 10; 
  END IF;
  
  -- Goals (15 points - increased from 10 since avatar was removed)
  IF NEW.goals IS NOT NULL AND array_length(NEW.goals, 1) > 0 THEN 
    score := score + 15; 
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
$$ LANGUAGE plpgsql SET search_path = public;