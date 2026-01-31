-- Market Data Tables for Time Series Storage

-- Table for OHLC (Open, High, Low, Close) market data
CREATE TABLE IF NOT EXISTS public.market_ohlc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL, -- '1m', '5m', '15m', '1h', '1d', '1w', '1mo'
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume BIGINT DEFAULT 0,
  provider TEXT NOT NULL, -- 'twelvedata', 'finnhub', 'dev_proxy'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(symbol, interval, timestamp)
);

-- Table for computed/fetched technical indicators
CREATE TABLE IF NOT EXISTS public.market_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  indicator TEXT NOT NULL, -- 'RSI', 'MACD', 'SMA', 'EMA', 'BBANDS', etc.
  interval TEXT NOT NULL,
  period INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  value JSONB NOT NULL, -- Flexible for different indicator outputs
  provider TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(symbol, indicator, interval, period, timestamp)
);

-- Table for caching latest quotes
CREATE TABLE IF NOT EXISTS public.market_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  price DECIMAL(20, 8) NOT NULL,
  change DECIMAL(20, 8) DEFAULT 0,
  percent_change DECIMAL(10, 4) DEFAULT 0,
  open DECIMAL(20, 8),
  high DECIMAL(20, 8),
  low DECIMAL(20, 8),
  previous_close DECIMAL(20, 8),
  volume BIGINT DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  provider TEXT NOT NULL,
  market_type TEXT NOT NULL DEFAULT 'stock', -- 'stock', 'forex', 'crypto', 'index'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table for forex rates
CREATE TABLE IF NOT EXISTS public.market_forex (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pair TEXT NOT NULL UNIQUE, -- 'USD/INR', 'EUR/USD'
  rate DECIMAL(20, 8) NOT NULL,
  change DECIMAL(20, 8) DEFAULT 0,
  percent_change DECIMAL(10, 4) DEFAULT 0,
  bid DECIMAL(20, 8),
  ask DECIMAL(20, 8),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  provider TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table for crypto prices
CREATE TABLE IF NOT EXISTS public.market_crypto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE, -- 'BTC/USDT', 'ETH/USDT'
  price DECIMAL(20, 8) NOT NULL,
  change DECIMAL(20, 8) DEFAULT 0,
  percent_change DECIMAL(10, 4) DEFAULT 0,
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  volume_24h DECIMAL(30, 8) DEFAULT 0,
  market_cap DECIMAL(30, 2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  provider TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_market_ohlc_symbol_interval ON public.market_ohlc(symbol, interval);
CREATE INDEX IF NOT EXISTS idx_market_ohlc_timestamp ON public.market_ohlc(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_indicators_symbol ON public.market_indicators(symbol, indicator);
CREATE INDEX IF NOT EXISTS idx_market_quotes_market_type ON public.market_quotes(market_type);
CREATE INDEX IF NOT EXISTS idx_market_quotes_updated ON public.market_quotes(updated_at DESC);

-- Enable RLS
ALTER TABLE public.market_ohlc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_forex ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_crypto ENABLE ROW LEVEL SECURITY;

-- Public read access for market data (no auth required for viewing)
CREATE POLICY "Anyone can read market OHLC" ON public.market_ohlc FOR SELECT USING (true);
CREATE POLICY "Anyone can read market indicators" ON public.market_indicators FOR SELECT USING (true);
CREATE POLICY "Anyone can read market quotes" ON public.market_quotes FOR SELECT USING (true);
CREATE POLICY "Anyone can read forex rates" ON public.market_forex FOR SELECT USING (true);
CREATE POLICY "Anyone can read crypto prices" ON public.market_crypto FOR SELECT USING (true);

-- Service role can insert/update (edge functions use service role)
CREATE POLICY "Service can manage market OHLC" ON public.market_ohlc FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service can manage market indicators" ON public.market_indicators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service can manage market quotes" ON public.market_quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service can manage forex rates" ON public.market_forex FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service can manage crypto prices" ON public.market_crypto FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for quotes (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_forex;
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_crypto;