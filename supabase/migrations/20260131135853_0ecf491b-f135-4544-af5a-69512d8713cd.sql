-- Create reposts table for repost functionality
CREATE TABLE IF NOT EXISTS public.reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- Users can view all reposts
CREATE POLICY "Reposts are viewable by everyone" 
  ON public.reposts 
  FOR SELECT 
  USING (true);

-- Users can manage their own reposts
CREATE POLICY "Users can create own reposts" 
  ON public.reposts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reposts" 
  ON public.reposts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON public.reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON public.reposts(user_id);

-- Add linkedin_id column to profiles for LinkedIn OAuth
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_id TEXT;

-- Add community_id to posts for community posting
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.communities(id);

-- Add image_url and country to news_articles
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS country TEXT;