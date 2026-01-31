import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from './utils.ts';
import { crawlArticles } from './crawler-service.ts';

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

// Input validation
const VALID_CATEGORIES = ['Business', 'Finance', 'Markets', 'Economy', 'Cryptocurrency', 'Technology'];

const sanitizeString = (str: unknown, maxLength = 200): string => {
  if (typeof str !== 'string') return '';
  // Remove potentially dangerous characters, keep alphanumeric, spaces, and basic punctuation
  return str.replace(/[<>{}[\]\\]/g, '').slice(0, maxLength);
};

const validateLimit = (limit: unknown): number => {
  const num = typeof limit === 'number' ? limit : parseInt(String(limit), 10);
  if (isNaN(num) || num < 1) return 5;
  return Math.min(num, 10); // Cap at 10 to prevent cost abuse with Gemini API
};

const validateCategory = (category: unknown): string => {
  const str = sanitizeString(category, 50);
  return VALID_CATEGORIES.includes(str) ? str : 'Business';
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const securedCorsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: securedCorsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...securedCorsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...securedCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== News Crawler Function Started ===');
    console.log(`Authenticated user: ${claimsData.user.id}`);
    
    let requestData: Record<string, unknown> = {};
    try {
      requestData = await req.json();
    } catch {
      console.log('No JSON body provided, using defaults');
    }

    // Validate and sanitize all inputs
    const topic = sanitizeString(requestData.topic, 200) || 'financial news';
    const limit = validateLimit(requestData.limit);
    const category = validateCategory(requestData.category);

    console.log(`Crawling with validated params: topic="${topic}", limit=${limit}, category="${category}"`);

    const result = await crawlArticles(topic, limit, category);
    
    console.log('=== Crawler Result ===');
    console.log(`Success: ${result.success}`);
    console.log(`Articles found: ${result.articles?.length || 0}`);

    return new Response(JSON.stringify(result), {
      headers: { ...securedCorsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('=== Critical Error in News Crawler ===');
    console.error('Error message:', errorMessage);
    
    return new Response(JSON.stringify({ 
      error: 'An error occurred while crawling articles',
      success: false,
      articles: []
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
    });
  }
});
