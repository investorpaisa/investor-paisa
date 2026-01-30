
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define news source interfaces
interface NewsSource {
  name: string;
  url: string;
  category: string;
  extract: (html: string) => NewsArticle[];
}

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('Starting financial news fetch at', new Date().toISOString());

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
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
    
    // Fetch news from Yahoo Finance API or other sources if needed
    if (YAHOO_FINANCE_API_KEY) {
      // Similar implementation as Alpha Vantage...
      console.log('Yahoo Finance API key found, but implementation not completed');
    }
    
    // Add mock data if no articles were fetched (for testing/development)
    if (articles.length === 0 && Deno.env.get('SUPABASE_ENV') === 'development') {
      console.log('No articles fetched, adding mock data for development');
      articles = generateMockArticles();
    }
    
    // Save articles to database
    if (articles.length > 0) {
      console.log(`Attempting to save ${articles.length} articles to database`);
      let newCount = 0;
      
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
          } else {
            newCount++;
          }
        }
      }
      
      console.log(`Saved ${newCount} new articles to database`);
    } else {
      console.log('No articles to save to database');
    }

    const duration = Date.now() - startTime;
    console.log(`News fetch completed in ${duration}ms`);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${articles.length} news articles`,
        articlesAdded: articles.length,
        executionTime: `${duration}ms`
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

// Helper function to generate mock articles for development/testing
function generateMockArticles(): NewsArticle[] {
  const mockArticles: NewsArticle[] = [
    {
      title: "Global Markets Rally as Inflation Concerns Ease",
      summary: "Markets across the globe surged today as new data suggests inflation pressures are beginning to ease, potentially setting the stage for central banks to reconsider their interest rate strategies. Investors responded positively to the news, with technology and consumer discretionary sectors leading the gains.",
      url: "https://example.com/markets-rally",
      source: "Financial Times",
      category: "Markets",
      published_at: new Date().toISOString(),
      thumbnail_url: "https://placeholder.com/markets-rally.jpg",
      relevance_score: 95
    },
    {
      title: "Major Tech Company Reports Record Quarterly Profits",
      summary: "In its latest earnings report released yesterday, the company exceeded analyst expectations with a 22% year-over-year increase in revenue, driven primarily by strong growth in its cloud services division. The company also announced an expanded share buyback program and increased its dividend.",
      url: "https://example.com/tech-profits",
      source: "Bloomberg",
      category: "Earnings",
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      thumbnail_url: "https://placeholder.com/tech-earnings.jpg",
      relevance_score: 90
    },
    {
      title: "Central Bank Signals Pause in Rate Hikes as Economic Growth Slows",
      summary: "In its latest policy statement, the central bank indicated it may temporarily halt its series of interest rate increases as recent economic data points to slowing growth. Policymakers emphasized they remain committed to bringing inflation down to their 2% target but acknowledged the need to balance this goal with maintaining economic stability.",
      url: "https://example.com/central-bank",
      source: "Reuters",
      category: "Economy",
      published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      thumbnail_url: "https://placeholder.com/central-bank.jpg",
      relevance_score: 88
    },
    {
      title: "Oil Prices Surge Amid Supply Concerns",
      summary: "Oil prices jumped more than 3% today following reports of production disruptions in major oil-producing regions and increased geopolitical tensions. Analysts suggest this could lead to higher energy costs for consumers and businesses in the coming months if the situation persists.",
      url: "https://example.com/oil-prices",
      source: "CNBC",
      category: "Commodities",
      published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      thumbnail_url: "https://placeholder.com/oil-prices.jpg",
      relevance_score: 85
    },
    {
      title: "Major Merger Announced in Banking Sector",
      summary: "Two of the country's largest regional banks announced plans to merge in a deal valued at approximately $30 billion. The combined entity would become the fifth-largest bank in the country by assets. Regulatory approval is still pending, with antitrust concerns expected to face scrutiny.",
      url: "https://example.com/bank-merger",
      source: "Wall Street Journal",
      category: "M&A",
      published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      thumbnail_url: "https://placeholder.com/bank-merger.jpg",
      relevance_score: 82
    }
  ];
  
  return mockArticles;
}
