
export const RAPIDAPI_HOST = "alpha-vantage.p.rapidapi.com";
export const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY") || "";
export const ALPHA_VANTAGE_API_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY") || "";

// Validate API key is configured
if (!RAPIDAPI_KEY) {
  console.error("RAPIDAPI_KEY is not configured in environment variables");
}

export function isApiConfigured(): boolean {
  return !!RAPIDAPI_KEY;
}

// Alpha Vantage rate limits
export const RATE_LIMITS = {
  REQUESTS_PER_MIN: 5,
  REQUESTS_PER_DAY: 500
};

// Request tracking to avoid hitting rate limits
export const requestTracker = {
  lastRequestTime: 0,
  requestsThisMinute: 0,
  requestsToday: 0,
  reset() {
    this.requestsThisMinute = 0;
    this.lastRequestTime = Date.now();
  }
};

// API function names for different data categories
export const API_FUNCTIONS = {
  STOCK: {
    QUOTE: "GLOBAL_QUOTE",
    DAILY: "TIME_SERIES_DAILY",
    INTRADAY: "TIME_SERIES_INTRADAY",
    WEEKLY: "TIME_SERIES_WEEKLY",
    MONTHLY: "TIME_SERIES_MONTHLY"
  },
  FOREX: {
    RATE: "CURRENCY_EXCHANGE_RATE",
    INTRADAY: "FX_INTRADAY",
    DAILY: "FX_DAILY",
    WEEKLY: "FX_WEEKLY",
    MONTHLY: "FX_MONTHLY"
  },
  CRYPTO: {
    RATE: "CURRENCY_EXCHANGE_RATE",
    DAILY: "DIGITAL_CURRENCY_DAILY",
    WEEKLY: "DIGITAL_CURRENCY_WEEKLY",
    MONTHLY: "DIGITAL_CURRENCY_MONTHLY"
  },
  TECHNICAL: {
    SMA: "SMA",
    EMA: "EMA",
    MACD: "MACD",
    RSI: "RSI",
    STOCH: "STOCH",
    BBANDS: "BBANDS",
    ADX: "ADX"
  }
};
