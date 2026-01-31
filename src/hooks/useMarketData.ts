import { useQuery, useQueryClient } from "@tanstack/react-query";
import { marketService, marketAIService, MarketQuote, OHLCData, ForexRate, CryptoQuote } from "@/services/market/marketService";

// Query keys
const MARKET_KEYS = {
  quote: (symbol: string) => ["market", "quote", symbol],
  history: (symbol: string, interval: string) => ["market", "history", symbol, interval],
  indicator: (symbol: string, indicator: string, interval: string, period: number) => 
    ["market", "indicator", symbol, indicator, interval, period],
  batch: (symbols: string[]) => ["market", "batch", symbols.join(",")],
  forex: (pair: string) => ["market", "forex", pair],
  crypto: (symbol: string) => ["market", "crypto", symbol],
  health: () => ["market", "health"],
  insight: (symbol: string) => ["market", "ai", "insight", symbol],
  summary: (symbol: string) => ["market", "ai", "summary", symbol],
};

export function useMarketQuote(symbol: string, enabled = true) {
  return useQuery({
    queryKey: MARKET_KEYS.quote(symbol),
    queryFn: () => marketService.getQuote(symbol),
    enabled: !!symbol && enabled,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useMarketHistory(symbol: string, interval: string = "1day", outputsize: number = 30, enabled = true) {
  return useQuery({
    queryKey: MARKET_KEYS.history(symbol, interval),
    queryFn: () => marketService.getHistory(symbol, interval, outputsize),
    enabled: !!symbol && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useMarketIndicator(
  symbol: string, 
  indicator: string, 
  interval: string = "1day", 
  period: number = 14,
  enabled = true
) {
  return useQuery({
    queryKey: MARKET_KEYS.indicator(symbol, indicator, interval, period),
    queryFn: () => marketService.getIndicator(symbol, indicator, interval, period),
    enabled: !!symbol && !!indicator && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMarketBatch(symbols: string[], enabled = true) {
  return useQuery({
    queryKey: MARKET_KEYS.batch(symbols),
    queryFn: () => marketService.getBatchQuotes(symbols),
    enabled: symbols.length > 0 && enabled,
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useForexRate(pair: string, enabled = true) {
  return useQuery({
    queryKey: MARKET_KEYS.forex(pair),
    queryFn: () => marketService.getForexRate(pair),
    enabled: !!pair && enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useCryptoQuote(symbol: string, enabled = true) {
  return useQuery({
    queryKey: MARKET_KEYS.crypto(symbol),
    queryFn: () => marketService.getCryptoQuote(symbol),
    enabled: !!symbol && enabled,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useMarketHealth() {
  return useQuery({
    queryKey: MARKET_KEYS.health(),
    queryFn: () => marketService.getHealth(),
    staleTime: 60 * 1000,
  });
}

export function useMarketInsight(symbol: string, context?: {
  price?: number;
  change?: number;
  percentChange?: number;
  history?: OHLCData[];
  indicators?: Record<string, any[]>;
}, enabled = true) {
  return useQuery({
    queryKey: MARKET_KEYS.insight(symbol),
    queryFn: () => marketAIService.getMarketInsight(symbol, context),
    enabled: !!symbol && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - AI insights don't need frequent updates
    retry: 1,
  });
}

export function useStockSummary(symbol: string, context?: {
  price?: number;
  change?: number;
  percentChange?: number;
  history?: OHLCData[];
}, enabled = true) {
  return useQuery({
    queryKey: MARKET_KEYS.summary(symbol),
    queryFn: () => marketAIService.getStockSummary(symbol, context),
    enabled: !!symbol && enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Custom hook for indicators panel with multiple indicators
export function useMultipleIndicators(symbol: string, indicators: string[], interval: string = "1day", enabled = true) {
  const queryClient = useQueryClient();
  
  const queries = indicators.map(indicator => ({
    queryKey: MARKET_KEYS.indicator(symbol, indicator, interval, 14),
    queryFn: () => marketService.getIndicator(symbol, indicator, interval, 14),
    enabled: !!symbol && enabled,
    staleTime: 5 * 60 * 1000,
  }));

  // Using parallel queries
  return useQuery({
    queryKey: ["market", "indicators", symbol, indicators.join(","), interval],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      await Promise.all(
        indicators.map(async (indicator) => {
          const data = await marketService.getIndicator(symbol, indicator, interval, 14);
          results[indicator] = data;
        })
      );
      return results;
    },
    enabled: !!symbol && indicators.length > 0 && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
