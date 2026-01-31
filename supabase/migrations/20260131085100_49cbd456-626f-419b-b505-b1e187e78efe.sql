-- Create news_articles table if it doesn't exist with proper RLS
CREATE TABLE IF NOT EXISTS public.news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  thumbnail_url TEXT,
  relevance_score INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read news articles" ON public.news_articles;
DROP POLICY IF EXISTS "Service can manage news articles" ON public.news_articles;

-- Public read access for all users (news is public content)
CREATE POLICY "Anyone can read news articles" 
  ON public.news_articles 
  FOR SELECT 
  USING (true);

-- Only service role (edge functions) can insert/update/delete
-- Note: Service role key bypasses RLS, so authenticated users cannot modify
CREATE POLICY "Authenticated users cannot modify news" 
  ON public.news_articles 
  FOR ALL 
  USING (false)
  WITH CHECK (false);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON public.news_articles(published_at DESC);