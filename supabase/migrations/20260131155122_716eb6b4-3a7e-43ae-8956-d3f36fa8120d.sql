-- =====================================================
-- Edit Profile Schema Migration
-- Creates tables for user experiences, educations, 
-- certifications, skills, and adds profile columns
-- =====================================================

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 2. Create user_experiences table
CREATE TABLE public.user_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_month INTEGER CHECK (start_month >= 1 AND start_month <= 12),
  start_year INTEGER CHECK (start_year >= 1950 AND start_year <= 2100),
  end_month INTEGER CHECK (end_month >= 1 AND end_month <= 12),
  end_year INTEGER CHECK (end_year >= 1950 AND end_year <= 2100),
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for user_experiences
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_experiences
CREATE POLICY "Users can view own experiences" 
  ON public.user_experiences 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own experiences" 
  ON public.user_experiences 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own experiences" 
  ON public.user_experiences 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own experiences" 
  ON public.user_experiences 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_user_experiences_user_id ON public.user_experiences(user_id);

-- 3. Create user_educations table
CREATE TABLE public.user_educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_month INTEGER CHECK (start_month >= 1 AND start_month <= 12),
  start_year INTEGER CHECK (start_year >= 1950 AND start_year <= 2100),
  end_month INTEGER CHECK (end_month >= 1 AND end_month <= 12),
  end_year INTEGER CHECK (end_year >= 1950 AND end_year <= 2100),
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for user_educations
ALTER TABLE public.user_educations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_educations
CREATE POLICY "Users can view own educations" 
  ON public.user_educations 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own educations" 
  ON public.user_educations 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own educations" 
  ON public.user_educations 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own educations" 
  ON public.user_educations 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_user_educations_user_id ON public.user_educations(user_id);

-- 4. Create user_certifications table
CREATE TABLE public.user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_month INTEGER CHECK (issue_month >= 1 AND issue_month <= 12),
  issue_year INTEGER CHECK (issue_year >= 1950 AND issue_year <= 2100),
  expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year INTEGER CHECK (expiry_year >= 1950 AND expiry_year <= 2100),
  no_expiry BOOLEAN DEFAULT false,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for user_certifications
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_certifications
CREATE POLICY "Users can view own certifications" 
  ON public.user_certifications 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own certifications" 
  ON public.user_certifications 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own certifications" 
  ON public.user_certifications 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own certifications" 
  ON public.user_certifications 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_user_certifications_user_id ON public.user_certifications(user_id);

-- 5. Create user_skills table
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Enable RLS for user_skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_skills
CREATE POLICY "Users can view own skills" 
  ON public.user_skills 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own skills" 
  ON public.user_skills 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own skills" 
  ON public.user_skills 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);

-- 6. Create skill_suggestions table for autocomplete
CREATE TABLE public.skill_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  category TEXT
);

-- Enable RLS for skill_suggestions
ALTER TABLE public.skill_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can read skill suggestions
CREATE POLICY "Anyone can read skill suggestions" 
  ON public.skill_suggestions 
  FOR SELECT 
  USING (true);

-- Service role can manage skill suggestions
CREATE POLICY "Service role can manage skill suggestions" 
  ON public.skill_suggestions 
  FOR ALL 
  TO service_role
  USING (true) 
  WITH CHECK (true);

-- Create index for faster search
CREATE INDEX idx_skill_suggestions_name ON public.skill_suggestions(name);

-- 7. Seed common financial/investment skills
INSERT INTO public.skill_suggestions (name, category) VALUES
  ('Technical Analysis', 'Trading'),
  ('Fundamental Analysis', 'Investment'),
  ('Portfolio Management', 'Investment'),
  ('Risk Management', 'Finance'),
  ('Equity Research', 'Research'),
  ('Fixed Income', 'Investment'),
  ('Derivatives Trading', 'Trading'),
  ('Options Trading', 'Trading'),
  ('Futures Trading', 'Trading'),
  ('Cryptocurrency', 'Trading'),
  ('Mutual Funds', 'Investment'),
  ('ETF Trading', 'Trading'),
  ('Value Investing', 'Investment'),
  ('Growth Investing', 'Investment'),
  ('Dividend Investing', 'Investment'),
  ('Day Trading', 'Trading'),
  ('Swing Trading', 'Trading'),
  ('Algorithmic Trading', 'Technology'),
  ('Quantitative Analysis', 'Research'),
  ('Financial Modeling', 'Finance'),
  ('DCF Analysis', 'Finance'),
  ('SEBI Regulations', 'Compliance'),
  ('Tax Planning', 'Finance'),
  ('Retirement Planning', 'Planning'),
  ('Estate Planning', 'Planning'),
  ('Insurance Planning', 'Planning'),
  ('Real Estate Investment', 'Investment'),
  ('IPO Analysis', 'Research'),
  ('Sector Analysis', 'Research'),
  ('Market Research', 'Research'),
  ('Python', 'Technology'),
  ('R Programming', 'Technology'),
  ('Excel', 'Technology'),
  ('Bloomberg Terminal', 'Technology'),
  ('Reuters Eikon', 'Technology'),
  ('TradingView', 'Technology'),
  ('NSE Trading', 'Trading'),
  ('BSE Trading', 'Trading'),
  ('Commodity Trading', 'Trading'),
  ('Forex Trading', 'Trading')
ON CONFLICT (name) DO NOTHING;

-- 8. Create updated_at trigger for new tables
CREATE TRIGGER update_user_experiences_updated_at
  BEFORE UPDATE ON public.user_experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_educations_updated_at
  BEFORE UPDATE ON public.user_educations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_certifications_updated_at
  BEFORE UPDATE ON public.user_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();