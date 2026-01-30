
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
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    
    if (!NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not configured');
    }
    
    console.log('Fetching economic news from NewsAPI...');
    
    // Fetch from NewsAPI
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
