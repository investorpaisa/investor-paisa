import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Provider configuration
const TWELVEDATA_API_KEY = Deno.env.get("TWELVEDATA_API_KEY");
const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Cache TTLs in seconds
const CACHE_TTL = {
  quote: 15,
  history: 180,
  indicator: 300,
  forex: 30,
  crypto: 15,
};

interface NormalizedQuote {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number;
  timestamp: string;
  provider: string;
  stale: boolean;
  marketType: string;
}

interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
}

// ============== TWELVE DATA PROVIDER ==============
async function twelveDataQuote(symbol: string): Promise<ProviderResult<NormalizedQuote>> {
  if (!TWELVEDATA_API_KEY) {
    return { success: false, error: "TWELVEDATA_API_KEY not configured", provider: "twelvedata" };
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, provider: "twelvedata" };
    }

    const data = await response.json();

    if (data.status === "error" || data.code) {
      return { success: false, error: data.message || "API error", provider: "twelvedata" };
    }

    return {
      success: true,
      provider: "twelvedata",
      data: {
        symbol: data.symbol,
        price: parseFloat(data.close) || 0,
        change: parseFloat(data.change) || 0,
        percentChange: parseFloat(data.percent_change) || 0,
        open: parseFloat(data.open) || null,
        high: parseFloat(data.high) || null,
        low: parseFloat(data.low) || null,
        previousClose: parseFloat(data.previous_close) || null,
        volume: parseInt(data.volume) || 0,
        timestamp: data.datetime || new Date().toISOString(),
        provider: "twelvedata",
        stale: false,
        marketType: "stock",
      },
    };
  } catch (error) {
    return { success: false, error: String(error), provider: "twelvedata" };
  }
}

async function twelveDataHistory(symbol: string, interval: string = "1day", outputsize: number = 30): Promise<ProviderResult<any[]>> {
  if (!TWELVEDATA_API_KEY) {
    return { success: false, error: "TWELVEDATA_API_KEY not configured", provider: "twelvedata" };
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, provider: "twelvedata" };
    }

    const data = await response.json();

    if (data.status === "error" || data.code) {
      return { success: false, error: data.message || "API error", provider: "twelvedata" };
    }

    const values = data.values?.map((v: any) => ({
      timestamp: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume) || 0,
    })) || [];

    return { success: true, data: values, provider: "twelvedata" };
  } catch (error) {
    return { success: false, error: String(error), provider: "twelvedata" };
  }
}

async function twelveDataIndicator(symbol: string, indicator: string, interval: string = "1day", period: number = 14): Promise<ProviderResult<any[]>> {
  if (!TWELVEDATA_API_KEY) {
    return { success: false, error: "TWELVEDATA_API_KEY not configured", provider: "twelvedata" };
  }

  try {
    const indicatorLower = indicator.toLowerCase();
    let url = `https://api.twelvedata.com/${indicatorLower}?symbol=${encodeURIComponent(symbol)}&interval=${interval}&time_period=${period}&apikey=${TWELVEDATA_API_KEY}`;

    // Special handling for MACD
    if (indicatorLower === "macd") {
      url = `https://api.twelvedata.com/macd?symbol=${encodeURIComponent(symbol)}&interval=${interval}&apikey=${TWELVEDATA_API_KEY}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, provider: "twelvedata" };
    }

    const data = await response.json();

    if (data.status === "error" || data.code) {
      return { success: false, error: data.message || "API error", provider: "twelvedata" };
    }

    return { success: true, data: data.values || [], provider: "twelvedata" };
  } catch (error) {
    return { success: false, error: String(error), provider: "twelvedata" };
  }
}

async function twelveDataForex(pair: string): Promise<ProviderResult<any>> {
  if (!TWELVEDATA_API_KEY) {
    return { success: false, error: "TWELVEDATA_API_KEY not configured", provider: "twelvedata" };
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/exchange_rate?symbol=${encodeURIComponent(pair)}&apikey=${TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, provider: "twelvedata" };
    }

    const data = await response.json();

    if (data.status === "error" || data.code) {
      return { success: false, error: data.message || "API error", provider: "twelvedata" };
    }

    return {
      success: true,
      provider: "twelvedata",
      data: {
        pair: data.symbol,
        rate: parseFloat(data.rate) || 0,
        timestamp: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: String(error), provider: "twelvedata" };
  }
}

async function twelveDataCrypto(symbol: string): Promise<ProviderResult<any>> {
  if (!TWELVEDATA_API_KEY) {
    return { success: false, error: "TWELVEDATA_API_KEY not configured", provider: "twelvedata" };
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, provider: "twelvedata" };
    }

    const data = await response.json();

    if (data.status === "error" || data.code) {
      return { success: false, error: data.message || "API error", provider: "twelvedata" };
    }

    return {
      success: true,
      provider: "twelvedata",
      data: {
        symbol: data.symbol,
        price: parseFloat(data.close) || 0,
        change: parseFloat(data.change) || 0,
        percentChange: parseFloat(data.percent_change) || 0,
        high24h: parseFloat(data.high) || null,
        low24h: parseFloat(data.low) || null,
        volume24h: parseInt(data.volume) || 0,
        timestamp: data.datetime || new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: String(error), provider: "twelvedata" };
  }
}

// ============== FINNHUB PROVIDER ==============
async function finnhubQuote(symbol: string): Promise<ProviderResult<NormalizedQuote>> {
  if (!FINNHUB_API_KEY) {
    return { success: false, error: "FINNHUB_API_KEY not configured", provider: "finnhub" };
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, provider: "finnhub" };
    }

    const data = await response.json();

    if (!data.c) {
      return { success: false, error: "No data available", provider: "finnhub" };
    }

    return {
      success: true,
      provider: "finnhub",
      data: {
        symbol,
        price: data.c || 0,
        change: data.d || 0,
        percentChange: data.dp || 0,
        open: data.o || null,
        high: data.h || null,
        low: data.l || null,
        previousClose: data.pc || null,
        volume: 0,
        timestamp: new Date(data.t * 1000).toISOString(),
        provider: "finnhub",
        stale: false,
        marketType: "stock",
      },
    };
  } catch (error) {
    return { success: false, error: String(error), provider: "finnhub" };
  }
}

async function finnhubForex(pair: string): Promise<ProviderResult<any>> {
  if (!FINNHUB_API_KEY) {
    return { success: false, error: "FINNHUB_API_KEY not configured", provider: "finnhub" };
  }

  try {
    // Convert pair format from USD/INR to OANDA:USD_INR
    const [from, to] = pair.split("/");
    const response = await fetch(
      `https://finnhub.io/api/v1/forex/rates?base=${from}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, provider: "finnhub" };
    }

    const data = await response.json();

    if (!data.quote || !data.quote[to]) {
      return { success: false, error: "Pair not found", provider: "finnhub" };
    }

    return {
      success: true,
      provider: "finnhub",
      data: {
        pair,
        rate: data.quote[to],
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: String(error), provider: "finnhub" };
  }
}

// ============== AGGREGATOR WITH FAILOVER ==============
async function getQuoteWithFailover(symbol: string): Promise<NormalizedQuote | null> {
  // Try TwelveData first
  const twelveResult = await twelveDataQuote(symbol);
  if (twelveResult.success && twelveResult.data) {
    console.log(`Quote for ${symbol} from twelvedata`);
    return twelveResult.data;
  }
  console.log(`TwelveData failed for ${symbol}: ${twelveResult.error}`);

  // Fallback to Finnhub
  const finnhubResult = await finnhubQuote(symbol);
  if (finnhubResult.success && finnhubResult.data) {
    console.log(`Quote for ${symbol} from finnhub (fallback)`);
    return finnhubResult.data;
  }
  console.log(`Finnhub failed for ${symbol}: ${finnhubResult.error}`);

  return null;
}

async function getHistoryWithFailover(symbol: string, interval: string, outputsize: number): Promise<any[]> {
  const twelveResult = await twelveDataHistory(symbol, interval, outputsize);
  if (twelveResult.success && twelveResult.data) {
    return twelveResult.data;
  }
  console.log(`TwelveData history failed: ${twelveResult.error}`);
  return [];
}

async function getIndicatorWithFailover(symbol: string, indicator: string, interval: string, period: number): Promise<any[]> {
  const twelveResult = await twelveDataIndicator(symbol, indicator, interval, period);
  if (twelveResult.success && twelveResult.data) {
    return twelveResult.data;
  }
  console.log(`TwelveData indicator failed: ${twelveResult.error}`);
  return [];
}

async function getForexWithFailover(pair: string): Promise<any | null> {
  const twelveResult = await twelveDataForex(pair);
  if (twelveResult.success && twelveResult.data) {
    return { ...twelveResult.data, provider: "twelvedata" };
  }

  const finnhubResult = await finnhubForex(pair);
  if (finnhubResult.success && finnhubResult.data) {
    return { ...finnhubResult.data, provider: "finnhub" };
  }

  return null;
}

async function getCryptoWithFailover(symbol: string): Promise<any | null> {
  const twelveResult = await twelveDataCrypto(symbol);
  if (twelveResult.success && twelveResult.data) {
    return { ...twelveResult.data, provider: "twelvedata" };
  }
  return null;
}

// ============== CACHE HELPERS ==============
async function getCachedQuote(supabase: any, symbol: string): Promise<NormalizedQuote | null> {
  const { data } = await supabase
    .from("market_quotes")
    .select("*")
    .eq("symbol", symbol)
    .single();

  if (data) {
    const updatedAt = new Date(data.updated_at).getTime();
    const now = Date.now();
    const isStale = (now - updatedAt) > CACHE_TTL.quote * 1000;

    return {
      symbol: data.symbol,
      price: parseFloat(data.price),
      change: parseFloat(data.change),
      percentChange: parseFloat(data.percent_change),
      open: data.open ? parseFloat(data.open) : null,
      high: data.high ? parseFloat(data.high) : null,
      low: data.low ? parseFloat(data.low) : null,
      previousClose: data.previous_close ? parseFloat(data.previous_close) : null,
      volume: parseInt(data.volume) || 0,
      timestamp: data.timestamp,
      provider: data.provider,
      stale: isStale,
      marketType: data.market_type,
    };
  }
  return null;
}

async function cacheQuote(supabase: any, quote: NormalizedQuote): Promise<void> {
  await supabase.from("market_quotes").upsert({
    symbol: quote.symbol,
    price: quote.price,
    change: quote.change,
    percent_change: quote.percentChange,
    open: quote.open,
    high: quote.high,
    low: quote.low,
    previous_close: quote.previousClose,
    volume: quote.volume,
    timestamp: quote.timestamp,
    provider: quote.provider,
    market_type: quote.marketType,
    updated_at: new Date().toISOString(),
  }, { onConflict: "symbol" });
}

// ============== REQUEST HANDLERS ==============
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "";
    const symbol = url.searchParams.get("symbol") || "";
    const symbols = url.searchParams.get("symbols") || "";
    const interval = url.searchParams.get("interval") || "1day";
    const indicator = url.searchParams.get("indicator") || "";
    const period = parseInt(url.searchParams.get("period") || "14");
    const pair = url.searchParams.get("pair") || "";
    const outputsize = parseInt(url.searchParams.get("outputsize") || "30");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let result: any;

    switch (endpoint) {
      case "quote": {
        if (!symbol) {
          return new Response(JSON.stringify({ success: false, error: "Symbol required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check cache first
        const cached = await getCachedQuote(supabase, symbol);
        if (cached && !cached.stale) {
          result = { success: true, data: cached, cache: "hit", latency_ms: Date.now() - startTime };
          break;
        }

        // Fetch fresh data
        const quote = await getQuoteWithFailover(symbol);
        if (quote) {
          await cacheQuote(supabase, quote);
          result = { success: true, data: quote, cache: "miss", latency_ms: Date.now() - startTime };
        } else if (cached) {
          result = { success: true, data: cached, cache: "stale", latency_ms: Date.now() - startTime };
        } else {
          result = { success: false, error: "Failed to fetch quote" };
        }
        break;
      }

      case "history": {
        if (!symbol) {
          return new Response(JSON.stringify({ success: false, error: "Symbol required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const history = await getHistoryWithFailover(symbol, interval, outputsize);
        result = { success: true, data: history, latency_ms: Date.now() - startTime };
        break;
      }

      case "indicator": {
        if (!symbol || !indicator) {
          return new Response(JSON.stringify({ success: false, error: "Symbol and indicator required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const indicatorData = await getIndicatorWithFailover(symbol, indicator, interval, period);
        result = { success: true, data: indicatorData, latency_ms: Date.now() - startTime };
        break;
      }

      case "batch": {
        if (!symbols) {
          return new Response(JSON.stringify({ success: false, error: "Symbols required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const symbolList = symbols.split(",").map(s => s.trim()).slice(0, 10); // Limit to 10
        const quotes: NormalizedQuote[] = [];

        for (const sym of symbolList) {
          const cached = await getCachedQuote(supabase, sym);
          if (cached && !cached.stale) {
            quotes.push(cached);
          } else {
            const quote = await getQuoteWithFailover(sym);
            if (quote) {
              await cacheQuote(supabase, quote);
              quotes.push(quote);
            } else if (cached) {
              quotes.push(cached);
            }
          }
        }

        result = { success: true, data: quotes, latency_ms: Date.now() - startTime };
        break;
      }

      case "forex": {
        if (!pair) {
          return new Response(JSON.stringify({ success: false, error: "Pair required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const forexData = await getForexWithFailover(pair);
        if (forexData) {
          // Cache in market_forex table
          await supabase.from("market_forex").upsert({
            pair: forexData.pair,
            rate: forexData.rate,
            timestamp: forexData.timestamp,
            provider: forexData.provider,
            updated_at: new Date().toISOString(),
          }, { onConflict: "pair" });
        }
        result = { success: !!forexData, data: forexData, latency_ms: Date.now() - startTime };
        break;
      }

      case "crypto": {
        if (!symbol) {
          return new Response(JSON.stringify({ success: false, error: "Symbol required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const cryptoData = await getCryptoWithFailover(symbol);
        if (cryptoData) {
          // Cache in market_crypto table
          await supabase.from("market_crypto").upsert({
            symbol: cryptoData.symbol,
            price: cryptoData.price,
            change: cryptoData.change,
            percent_change: cryptoData.percentChange,
            high_24h: cryptoData.high24h,
            low_24h: cryptoData.low24h,
            volume_24h: cryptoData.volume24h,
            timestamp: cryptoData.timestamp,
            provider: cryptoData.provider,
            updated_at: new Date().toISOString(),
          }, { onConflict: "symbol" });
        }
        result = { success: !!cryptoData, data: cryptoData, latency_ms: Date.now() - startTime };
        break;
      }

      case "health": {
        result = {
          success: true,
          providers: {
            twelvedata: !!TWELVEDATA_API_KEY,
            finnhub: !!FINNHUB_API_KEY,
          },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ success: false, error: "Invalid endpoint" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log(`Market data request: ${endpoint}, latency: ${Date.now() - startTime}ms`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market data error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
