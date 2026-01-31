import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

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

interface NewsArticle {
  id?: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  published_at: string;
  thumbnail_url?: string;
  relevance_score: number;
}

// Input validation
const validateLimit = (limit: unknown): number => {
  const num = typeof limit === 'number' ? limit : parseInt(String(limit), 10);
  if (isNaN(num) || num < 1) return 10;
  return Math.min(num, 50); // Cap at 50 to prevent abuse
};

Deno.serve(async (req) => {
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
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

    // Parse and validate input
    let rawLimit = 10;
    try {
      const body = await req.json();
      rawLimit = body.limit;
    } catch {
      // Use default if no body
    }
    
    const limit = validateLimit(rawLimit);
    
    // Create Supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get API key from environment variables
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    
    if (!NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not configured');
    }
    
    console.log('Fetching economic news from NewsAPI...');
    
    // Fetch from NewsAPI with validated limit
    const newsApiUrl = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=${limit}&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(newsApiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${data.message || response.statusText}`);
    }
    
    // Transform the articles
    const articles: NewsArticle[] = [];
    
    if (data.articles && data.articles.length > 0) {
      for (const article of data.articles) {
        const newsArticle: NewsArticle = {
          title: article.title,
          summary: article.description || '',
          url: article.url,
          source: article.source.name,
          category: 'Economy',
          published_at: article.publishedAt || new Date().toISOString(),
          thumbnail_url: article.urlToImage,
          relevance_score: 70 // Default score
        };
        
        // Add to array
        articles.push(newsArticle);
        
        // Also store in database for future retrieval
        await supabase
          .from('news_articles')
          .upsert(
            { 
              ...newsArticle,
              id: `newsapi-${article.url.split('/').pop() || Math.random().toString(36).substring(2)}` 
            },
            { onConflict: 'id' }
          );
      }
    }
    
    // Return the articles
    return new Response(
      JSON.stringify(articles),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching economic news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An error occurred while fetching news'
      }),
      { 
        status: 500,
        headers: { 
          ...getCorsHeaders(req.headers.get('Origin')), 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
