
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 10 } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get API key from environment variables
    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }
    
    console.log('Fetching financial trends from Alpha Vantage...');
    
    // Fetch from Alpha Vantage
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
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
    // Absolute value of sentiment matters more than direction
    score += Math.abs(article.overall_sentiment_score) * 10;
  }
  
  // Factor 2: Recency (newer articles get higher scores)
  const publishedDate = new Date(article.time_published);
  const now = new Date();
  const hoursSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
  if (hoursSincePublished < 24) {
    score += 20; // Articles less than a day old
  } else if (hoursSincePublished < 48) {
    score += 10; // Articles less than two days old
  }
  
  // Factor 3: Source reputation (simplified)
  const highQualitySources = ['Bloomberg', 'Reuters', 'Financial Times', 'Wall Street Journal', 'CNBC'];
  if (highQualitySources.includes(article.source)) {
    score += 15;
  }
  
  // Factor 4: Number of tickers mentioned
  if (article.ticker_sentiment && article.ticker_sentiment.length > 0) {
    score += Math.min(article.ticker_sentiment.length * 2, 10);
  }
  
  return Math.min(score, 100); // Cap at 100
}
