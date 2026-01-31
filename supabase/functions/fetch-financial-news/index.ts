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

// Define news source interfaces
interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  published_at: string;
  thumbnail_url?: string;
  relevance_score: number;
}

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

    // Create Supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get API key from environment variables
    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    const YAHOO_FINANCE_API_KEY = Deno.env.get('YAHOO_FINANCE_API_KEY');
    
    if (!ALPHA_VANTAGE_API_KEY && !YAHOO_FINANCE_API_KEY) {
      throw new Error('No API keys configured for financial data sources');
    }

    // Fetch news from Alpha Vantage API
    let articles: NewsArticle[] = [];
    
    if (ALPHA_VANTAGE_API_KEY) {
      console.log('Fetching news from Alpha Vantage...');
      try {
        const alphaVantageUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets,economy,stocks&sort=LATEST&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const response = await fetch(alphaVantageUrl);
        const data = await response.json();
        
        if (data.feed) {
          const avArticles = data.feed.map((item: any) => ({
            title: item.title,
            summary: item.summary,
            url: item.url,
            source: item.source,
            category: determineCategory(item.topics),
            published_at: new Date(item.time_published).toISOString(),
            thumbnail_url: item.banner_image || null,
            relevance_score: calculateRelevanceScore(item)
          }));
          
          articles = [...articles, ...avArticles];
          console.log(`Fetched ${avArticles.length} articles from Alpha Vantage`);
        }
      } catch (error) {
        console.error('Error fetching from Alpha Vantage:', error);
      }
    }
    
    // Save articles to database
    if (articles.length > 0) {
      for (const article of articles) {
        // Check if article already exists to avoid duplicates
        const { data: existingArticle } = await supabase
          .from('news_articles')
          .select('id')
          .eq('url', article.url)
          .single();
          
        if (!existingArticle) {
          const { error } = await supabase
            .from('news_articles')
            .insert(article);
            
          if (error) {
            console.error('Error inserting article:', error);
          }
        }
      }
      
      console.log(`Saved ${articles.length} new articles to database`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${articles.length} news articles` 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: unknown) {
    console.error('Error in fetch-financial-news function:', error);
    
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

// Helper function to determine the category of an article based on topics
function determineCategory(topics: string[]): string {
  const topicMap: Record<string, string> = {
    'earnings': 'Earnings',
    'ipo': 'IPO',
    'mergers_and_acquisitions': 'M&A',
    'financial_markets': 'Markets',
    'economy_macro': 'Economy',
    'economy_fiscal': 'Economy',
    'economy_monetary': 'Economy',
    'stock_market': 'Markets',
    'forex': 'Forex',
    'crypto': 'Crypto',
    'commodity': 'Commodities',
    'retirement': 'Personal Finance',
    'personal_finance': 'Personal Finance'
  };
  
  for (const topic of topics) {
    if (topicMap[topic]) {
      return topicMap[topic];
    }
  }
  
  return 'Business';
}

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
