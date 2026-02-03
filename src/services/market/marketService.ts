import { supabase, getSupabaseUrl, getSupabaseAnonKey } from "@/integrations/supabase/client";

const getMarketDataUrl = () => `${getSupabaseUrl()}/functions/v1/market-data`;
const getMarketAiUrl = () => `${getSupabaseUrl()}/functions/v1/market-ai`;

export interface MarketQuote {
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

export interface OHLCData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ForexRate {
  pair: string;
  rate: number;
  change?: number;
  percentChange?: number;
  timestamp: string;
  provider: string;
}

export interface CryptoQuote {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  high24h: number | null;
  low24h: number | null;
  volume24h: number;
  marketCap?: number | null;
  timestamp: string;
  provider: string;
}

export interface MarketResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cache?: string;
  latency_ms?: number;
}

async function fetchMarketData<T>(endpoint: string, params: Record<string, string>): Promise<MarketResponse<T>> {
  const queryParams = new URLSearchParams({ endpoint, ...params });
  
  const response = await fetch(`${getMarketDataUrl()}?${queryParams}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getSupabaseAnonKey()}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Market API error: ${response.status} - ${text}`);
  }

  return response.json();
}

export const marketService = {
  async getQuote(symbol: string): Promise<MarketQuote | null> {
    const result = await fetchMarketData<MarketQuote>("quote", { symbol });
    return result.success ? result.data! : null;
  },

  async getHistory(symbol: string, interval: string = "1day", outputsize: number = 30): Promise<OHLCData[]> {
    const result = await fetchMarketData<OHLCData[]>("history", { 
      symbol, 
      interval, 
      outputsize: String(outputsize) 
    });
    return result.success ? result.data! : [];
  },

  async getIndicator(symbol: string, indicator: string, interval: string = "1day", period: number = 14): Promise<any[]> {
    const result = await fetchMarketData<any[]>("indicator", { 
      symbol, 
      indicator, 
      interval, 
      period: String(period) 
    });
    return result.success ? result.data! : [];
  },

  async getBatchQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const result = await fetchMarketData<MarketQuote[]>("batch", { 
      symbols: symbols.join(",") 
    });
    return result.success ? result.data! : [];
  },

  async getForexRate(pair: string): Promise<ForexRate | null> {
    const result = await fetchMarketData<ForexRate>("forex", { pair });
    return result.success ? result.data! : null;
  },

  async getCryptoQuote(symbol: string): Promise<CryptoQuote | null> {
    const result = await fetchMarketData<CryptoQuote>("crypto", { symbol });
    return result.success ? result.data! : null;
  },

  async getHealth(): Promise<{ twelvedata: boolean; finnhub: boolean }> {
    const result = await fetchMarketData<{ providers: { twelvedata: boolean; finnhub: boolean } }>("health", {});
    return result.success ? result.data!.providers : { twelvedata: false, finnhub: false };
  },
};

export const marketAIService = {
  async getMarketInsight(symbol: string, context?: {
    price?: number;
    change?: number;
    percentChange?: number;
    history?: OHLCData[];
    indicators?: Record<string, any[]>;
  }): Promise<string> {
    const response = await fetch(getMarketAiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getSupabaseAnonKey()}`,
      },
      body: JSON.stringify({
        type: "market-insight",
        symbol,
        context,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limits exceeded. Please try again later.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add funds.");
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to get insight");
    }

    return result.data;
  },

  async getStockSummary(symbol: string, context?: {
    price?: number;
    change?: number;
    percentChange?: number;
    history?: OHLCData[];
  }): Promise<string> {
    const response = await fetch(getMarketAiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getSupabaseAnonKey()}`,
      },
      body: JSON.stringify({
        type: "stock-summary",
        symbol,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data : "Unable to generate summary.";
  },

  async explainIndicator(symbol: string, indicator: string, values: any[]): Promise<string> {
    const response = await fetch(getMarketAiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getSupabaseAnonKey()}`,
      },
      body: JSON.stringify({
        type: "indicator-explainer",
        symbol,
        context: { indicator, values },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data : "Unable to explain indicator.";
  },
};
