import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  uri: string;
  title: string;
  body: string;
  url: string;
  source: { title: string };
  image?: string;
  dateTimePub: string;
  categories?: { uri: string }[];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NEWSAPI_AI_KEY = Deno.env.get('NEWSAPI_AI_KEY');
    if (!NEWSAPI_AI_KEY) {
      throw new Error('NEWSAPI_AI_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch articles from NewsAPI.ai
    const response = await fetch('https://newsapi.ai/api/v1/article/getArticles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: NEWSAPI_AI_KEY,
        resultType: 'articles',
        articlesSortBy: 'date',
        articlesCount: 50,
        lang: 'eng',
        categoryUri: [
          'dmoz/Business',
          'dmoz/Business/Financial_Services',
          'dmoz/Business/Investing',
        ],
        sourceLocationUri: [
          'http://en.wikipedia.org/wiki/India',
          'http://en.wikipedia.org/wiki/United_States',
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`NewsAPI.ai returned ${response.status}`);
    }

    const data = await response.json();
    const articles: NewsArticle[] = data.articles?.results || [];

    console.log(`Fetched ${articles.length} articles from NewsAPI.ai`);

    // Upsert articles into the database
    const articlesToInsert = articles.map((article: NewsArticle) => ({
      id: article.uri,
      title: article.title.substring(0, 500),
      summary: article.body?.substring(0, 1000) || null,
      url: article.url,
      source: article.source?.title || 'Unknown',
      category: 'finance',
      published_at: article.dateTimePub,
      thumbnail_url: article.image || null,
      image_url: article.image || null,
      relevance_score: 50,
      country: 'global',
    }));

    if (articlesToInsert.length > 0) {
      const { error } = await supabase
        .from('news_articles')
        .upsert(articlesToInsert, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error upserting articles:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${articlesToInsert.length} articles` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('News fetch error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
