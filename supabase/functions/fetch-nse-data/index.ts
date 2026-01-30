
// Main entry point for the NSE data edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const endpoint = body.endpoint || 'error';
    const params = body.params || {};
    
    console.log(`Processing request for endpoint: ${endpoint}`);
    console.log(`With params:`, params);
    
    // Based on the endpoint parameter, call the appropriate function
    switch (endpoint) {
      case 'marketStatus':
        return await getMarketStatus(req);
      case 'indices':
        return await getIndices(req, params.index);
      case 'stocks':
        return await getStocks(req, params.symbol);
      case 'gainers':
        return await getTopGainers(req);
      case 'losers':
        return await getTopLosers(req);
      case 'search':
        return await searchStocks(req, params.q);
      case 'forex-rate':
        return await getForexRate(req, params);
      case 'forex-timeseries':
        return await getForexTimeSeries(req, params);
      case 'crypto-rate':
        return await getCryptoRate(req, params);
      case 'crypto-timeseries':
        return await getCryptoTimeSeries(req, params);
      case 'technical-indicator':
        return await getTechnicalIndicator(req, params);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid endpoint specified" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error processing request:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
