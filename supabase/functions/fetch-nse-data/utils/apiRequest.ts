
import { RAPIDAPI_HOST, RAPIDAPI_KEY, RATE_LIMITS, requestTracker } from "./config.ts";
import { corsHeaders } from "./cors.ts";

// Main API request function with rate limit handling
export async function makeRapidApiRequest(url: string, fallbackFn?: Function, attempts = 1) {
  try {
    const now = Date.now();
    const timeSinceLastRequest = now - requestTracker.lastRequestTime;
    
    // If we've made too many requests in the last minute, delay or use fallback
    if (requestTracker.requestsThisMinute >= RATE_LIMITS.REQUESTS_PER_MIN) {
      if (timeSinceLastRequest < 60000) {
        console.warn(`Rate limit approached: ${requestTracker.requestsThisMinute} requests in the last minute`);
        
        // If this is the first attempt and we haven't waited the full minute yet, wait and retry
        if (attempts === 1 && timeSinceLastRequest > 40000) {
          console.log("Waiting for rate limit reset...");
          await new Promise(resolve => setTimeout(resolve, 65000 - timeSinceLastRequest));
          return makeRapidApiRequest(url, fallbackFn, attempts + 1);
        }
        
        // If we've already tried waiting or it would be too long to wait, use fallback
        if (fallbackFn) {
          console.log("Using fallback data due to rate limiting");
          return fallbackFn();
        }
        
        throw new Error("Rate limit exceeded and no fallback provided");
      }
      
      // If it's been more than a minute since the last request, reset the counter
      requestTracker.reset();
    }
    
    // Update request tracking
    requestTracker.requestsThisMinute++;
    requestTracker.requestsToday++;
    requestTracker.lastRequestTime = now;
    
    console.log(`Making API request to: ${url}`);
    console.log(`Request count: ${requestTracker.requestsThisMinute}/min, ${requestTracker.requestsToday}/day`);
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    
    // Handle rate limiting responses
    if (response.status === 429) {
      console.error("Rate limit exceeded (429 response)");
      
      if (fallbackFn) {
        console.log("Using fallback data due to 429 response");
        return fallbackFn();
      }
      
      throw new Error("Rate limit exceeded (429) and no fallback provided");
    }
    
    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      
      if (fallbackFn) {
        console.log(`Falling back due to error response: ${response.status}`);
        return fallbackFn();
      }
      
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in API request: ${errorMessage}`);
    
    if (fallbackFn) {
      console.log("Using fallback data due to error");
      return fallbackFn();
    }
    
    throw error;
  }
}

// Function to create a standardized error response
export function createErrorResponse(message: string, fallbackData?: any, status = 500) {
  return new Response(
    JSON.stringify({
      error: message,
      ...(fallbackData ? { fallbackData } : {}),
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status
    }
  );
}
