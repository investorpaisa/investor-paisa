-- Fix news_articles RLS policies for proper service-role access
DROP POLICY IF EXISTS "Authenticated users cannot modify news" ON public.news_articles;
DROP POLICY IF EXISTS "Authenticated users can insert news articles" ON public.news_articles;

-- Allow service role to manage news articles
CREATE POLICY "Service role can manage news" 
ON public.news_articles 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Block regular users from modifying news
CREATE POLICY "Block user modifications to news" 
ON public.news_articles 
FOR INSERT 
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Block user updates to news" 
ON public.news_articles 
FOR UPDATE 
TO authenticated, anon
USING (false);

CREATE POLICY "Block user deletes from news" 
ON public.news_articles 
FOR DELETE 
TO authenticated, anon
USING (false);