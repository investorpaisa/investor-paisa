-- Fix 1: Conversations INSERT policy - require authenticated user
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: AI Requests INSERT policy - require user_id matches authenticated user
DROP POLICY IF EXISTS "System can insert ai requests" ON public.ai_requests;
DROP POLICY IF EXISTS "Authenticated users can insert ai requests" ON public.ai_requests;

CREATE POLICY "Authenticated users can insert ai requests" 
ON public.ai_requests
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix 3: Remove unused SECURITY DEFINER functions that can manipulate post metrics
DROP FUNCTION IF EXISTS public.increment_reposts(UUID);
DROP FUNCTION IF EXISTS public.decrement_reposts(UUID);

-- Fix 4: Tighten market data policies - service-role only for INSERT/UPDATE/DELETE
-- Market Crypto
DROP POLICY IF EXISTS "Service can manage crypto prices" ON public.market_crypto;
CREATE POLICY "Service role can manage crypto prices" 
ON public.market_crypto 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Market Forex  
DROP POLICY IF EXISTS "Service can manage forex rates" ON public.market_forex;
CREATE POLICY "Service role can manage forex rates" 
ON public.market_forex 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Market Indicators
DROP POLICY IF EXISTS "Service can manage market indicators" ON public.market_indicators;
CREATE POLICY "Service role can manage market indicators" 
ON public.market_indicators 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Market OHLC
DROP POLICY IF EXISTS "Service can manage market OHLC" ON public.market_ohlc;
CREATE POLICY "Service role can manage market OHLC" 
ON public.market_ohlc 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Market Quotes
DROP POLICY IF EXISTS "Service can manage market quotes" ON public.market_quotes;
CREATE POLICY "Service role can manage market quotes" 
ON public.market_quotes 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);