// Main entry point for the NSE data edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { 
  getMarketStatus, 
  getIndices, 
  getStocks, 
  getTopGainers, 
  getTopLosers, 
  searchStocks,
  getForexRate,
  getForexTimeSeries,
  getCryptoRate,
  getCryptoTimeSeries,
  getTechnicalIndicator
} from "./handlers/index.ts";

// CORS headers with restricted origins
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN') || 'https://investor-paisa.lovable.app',
    'https://id-preview--14ca1bc6-3a3e-4389-94f1-5fe01fd1bbce.lovable.app',
    'http://localhost:8080',
    'http://localhost:5173'
  ];
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0];
};

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
});

// Valid endpoints whitelist
const VALID_ENDPOINTS = [
  'marketStatus', 'indices', 'stocks', 'gainers', 'losers', 'search',
  'forex-rate', 'forex-timeseries', 'crypto-rate', 'crypto-timeseries', 'technical-indicator'
];

// Input validation helpers
const sanitizeString = (str: unknown, maxLength = 50): string => {
  if (typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9\s\-_.]/g, '').slice(0, maxLength);
};

const validateSymbol = (symbol: unknown): string | null => {
  const sanitized = sanitizeString(symbol, 20);
  if (!sanitized || !/^[A-Z0-9\-_.]+$/i.test(sanitized)) return null;
  return sanitized.toUpperCase();
};

const validateInterval = (interval: unknown): string => {
  const valid = ['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'];
  const str = sanitizeString(interval, 10).toLowerCase();
  return valid.includes(str) ? str : 'daily';
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const endpoint = sanitizeString(body.endpoint, 30);
    const rawParams = body.params || {};
    
    // Validate endpoint
    if (!VALID_ENDPOINTS.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint specified' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Sanitize and validate params based on endpoint
    const params: Record<string, unknown> = {};
    
    if (rawParams.symbol) {
      params.symbol = validateSymbol(rawParams.symbol);
    }
    if (rawParams.index) {
      params.index = sanitizeString(rawParams.index, 30);
    }
    if (rawParams.q) {
      params.q = sanitizeString(rawParams.q, 100);
    }
    if (rawParams.from_currency) {
      params.from_currency = sanitizeString(rawParams.from_currency, 10).toUpperCase();
    }
    if (rawParams.to_currency) {
      params.to_currency = sanitizeString(rawParams.to_currency, 10).toUpperCase();
    }
    if (rawParams.interval) {
      params.interval = validateInterval(rawParams.interval);
    }
    if (rawParams.indicator) {
      params.indicator = sanitizeString(rawParams.indicator, 20).toUpperCase();
    }
    if (rawParams.period) {
      const period = parseInt(String(rawParams.period), 10);
      params.period = isNaN(period) ? 14 : Math.min(Math.max(period, 1), 200);
    }
    
    console.log(`Processing request for endpoint: ${endpoint}`);
    console.log(`With validated params:`, params);
    
    // Based on the endpoint parameter, call the appropriate function
    switch (endpoint) {
      case 'marketStatus':
        return await getMarketStatus(req);
      case 'indices':
        return await getIndices(req, params.index as string);
      case 'stocks':
        return await getStocks(req, params.symbol as string);
      case 'gainers':
        return await getTopGainers(req);
      case 'losers':
        return await getTopLosers(req);
      case 'search':
        return await searchStocks(req, params.q as string);
      case 'forex-rate':
        return await getForexRate(req, {
          from_currency: params.from_currency as string || 'USD',
          to_currency: params.to_currency as string || 'INR'
        });
      case 'forex-timeseries':
        return await getForexTimeSeries(req, {
          from_currency: params.from_currency as string || 'USD',
          to_currency: params.to_currency as string || 'INR',
          interval: params.interval as string,
          period: String(params.period || '14')
        });
      case 'crypto-rate':
        return await getCryptoRate(req, {
          symbol: params.symbol as string || 'BTC',
          market: 'USD'
        });
      case 'crypto-timeseries':
        return await getCryptoTimeSeries(req, {
          symbol: params.symbol as string || 'BTC',
          market: 'USD',
          interval: params.interval as string
        });
      case 'technical-indicator':
        return await getTechnicalIndicator(req, {
          symbol: params.symbol as string || '',
          indicator: params.indicator as string || 'SMA',
          interval: params.interval as string,
          time_period: params.period as number
        });
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint specified' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing request:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing the request' }),
      { 
        headers: { ...getCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
