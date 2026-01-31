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
    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }
    
    console.log('Fetching financial trends from Alpha Vantage...');
    
    // Fetch from Alpha Vantage with validated limit
    const alphaVantageUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=finance,economy&sort=RELEVANCE&limit=${limit}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(alphaVantageUrl);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage error: ${JSON.stringify(data)}`);
    }
    
    // Transform the articles
    const articles: NewsArticle[] = [];
    
    if (data.feed && data.feed.length > 0) {
      for (const item of data.feed) {
        const newsArticle: NewsArticle = {
          title: item.title,
          summary: item.summary || '',
          url: item.url,
          source: item.source,
          category: 'Financial',
          published_at: item.time_published || new Date().toISOString(),
          thumbnail_url: item.banner_image,
          relevance_score: calculateRelevanceScore(item)
        };
        
        // Add to array
        articles.push(newsArticle);
        
        // Also store in database for future retrieval
        await supabase
          .from('news_articles')
          .upsert(
            { 
              ...newsArticle,
              id: `alphavantage-${item.url.split('/').pop() || Math.random().toString(36).substring(2)}` 
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
    console.error('Error fetching financial trends:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An error occurred while fetching trends'
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

// Helper function to calculate relevance score based on various factors
function calculateRelevanceScore(article: any): number {
  let score = 50; // Base score
  
  // Factor 1: Overall sentiment
  if (article.overall_sentiment_score) {
    score += Math.abs(article.overall_sentiment_score) * 10;
  }
  
  // Factor 2: Recency
  const publishedDate = new Date(article.time_published);
  const now = new Date();
  const hoursSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
  if (hoursSincePublished < 24) {
    score += 20;
  } else if (hoursSincePublished < 48) {
    score += 10;
  }
  
  // Factor 3: Source reputation
  const highQualitySources = ['Bloomberg', 'Reuters', 'Financial Times', 'Wall Street Journal', 'CNBC'];
  if (highQualitySources.includes(article.source)) {
    score += 15;
  }
  
  // Factor 4: Number of tickers mentioned
  if (article.ticker_sentiment && article.ticker_sentiment.length > 0) {
    score += Math.min(article.ticker_sentiment.length * 2, 10);
  }
  
  return Math.min(score, 100);
}
