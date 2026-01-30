
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './utils.ts';
import { crawlArticles } from './crawler-service.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== News Crawler Function Started ===');
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data:', JSON.stringify(requestData, null, 2));
    } catch (e) {
      console.log('No JSON body provided, using defaults');
      requestData = {};
    }

    const { 
      topic = 'financial news', 
      limit = 5, 
      category = 'Business' 
    } = requestData;

    console.log(`Crawling with params: topic="${topic}", limit=${limit}, category="${category}"`);

    const result = await crawlArticles(topic, limit, category);
    
    console.log('=== Crawler Result ===');
    console.log(`Success: ${result.success}`);
    console.log(`Articles found: ${result.articles?.length || 0}`);
    console.log(`Message: ${result.message}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('=== Critical Error in News Crawler ===');
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);
    
    return new Response(JSON.stringify({ 
      error: `Critical error: ${errorMessage}`,
      success: false,
      articles: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
