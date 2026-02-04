import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RSSFeed {
  url: string;
  category: string;
  country: string;
  limit: number;
}

// RSS Feed configuration
const RSS_FEEDS: RSSFeed[] = [
  // Indian feeds (50 total)
  { url: 'https://news.google.com/rss/search?q=indian+stock+market+NSE+BSE&hl=en-IN&gl=IN&ceid=IN:en', category: 'stocks', country: 'india', limit: 20 },
  { url: 'https://news.google.com/rss/search?q=indian+economy+RBI+inflation&hl=en-IN&gl=IN&ceid=IN:en', category: 'economy', country: 'india', limit: 10 },
  { url: 'https://news.google.com/rss/search?q=gold+oil+commodities+prices&hl=en&gl=US&ceid=US:en', category: 'commodities', country: 'global', limit: 20 },
  
  // Global feeds (50 total)
  { url: 'https://news.google.com/rss/search?q=global+stock+market+NYSE+NASDAQ&hl=en&gl=US&ceid=US:en', category: 'stocks', country: 'global', limit: 20 },
  { url: 'https://news.google.com/rss/search?q=world+economy+federal+reserve&hl=en&gl=US&ceid=US:en', category: 'economy', country: 'global', limit: 10 },
  { url: 'https://news.google.com/rss/search?q=cryptocurrency+bitcoin+ethereum&hl=en&gl=US&ceid=US:en', category: 'crypto', country: 'global', limit: 20 },
];

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
  description?: string;
  imageUrl?: string;
}

// Extract image URL from various formats in RSS
function extractImageUrl(itemXml: string, description: string): string | null {
  // Try to find media:content or enclosure
  const mediaMatch = /<media:content[^>]*url="([^"]+)"/i.exec(itemXml);
  if (mediaMatch) return mediaMatch[1];
  
  const enclosureMatch = /<enclosure[^>]*url="([^"]+)"[^>]*type="image/i.exec(itemXml);
  if (enclosureMatch) return enclosureMatch[1];
  
  // Try to extract from media:thumbnail
  const thumbnailMatch = /<media:thumbnail[^>]*url="([^"]+)"/i.exec(itemXml);
  if (thumbnailMatch) return thumbnailMatch[1];
  
  // Try to extract first image from description HTML
  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(description);
  if (imgMatch && imgMatch[1].startsWith('http')) return imgMatch[1];
  
  return null;
}

// Parse RSS XML to extract items
function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple regex-based XML parsing for RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s.exec(itemXml);
    const linkMatch = /<link>(.*?)<\/link>/s.exec(itemXml);
    const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/s.exec(itemXml);
    const sourceMatch = /<source[^>]*>(.*?)<\/source>/s.exec(itemXml);
    const descMatch = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s.exec(itemXml);
    
    const title = titleMatch?.[1] || titleMatch?.[2] || '';
    const link = linkMatch?.[1] || '';
    const pubDate = pubDateMatch?.[1] || '';
    const source = sourceMatch?.[1] || '';
    const description = descMatch?.[1] || descMatch?.[2] || '';
    
    // Extract image URL
    const imageUrl = extractImageUrl(itemXml, description);
    
    // Clean HTML from description
    const cleanDescription = description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    if (title && link) {
      items.push({
        title: title.trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
        source: source.trim(),
        description: cleanDescription.substring(0, 500) || undefined,
        imageUrl: imageUrl || undefined,
      });
    }
  }
  
  return items;
}

// Generate a deterministic ID from URL
function generateId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `rss_${Math.abs(hash).toString(36)}`;
}

// Generate placeholder image based on category
function getCategoryPlaceholder(category: string): string {
  // Use Unsplash source for category-relevant stock photos
  const categoryKeywords: Record<string, string> = {
    'stocks': 'stock-market,trading',
    'economy': 'business,economy',
    'crypto': 'cryptocurrency,bitcoin',
    'commodities': 'gold,oil',
  };
  const keywords = categoryKeywords[category] || 'finance,business';
  return `https://source.unsplash.com/800x450/?${keywords}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[RSS Fetcher] Starting fetch cycle...');
    
    const allArticles: any[] = [];
    const errors: string[] = [];

    // Fetch all RSS feeds in parallel
    const fetchPromises = RSS_FEEDS.map(async (feed) => {
      try {
        console.log(`[RSS Fetcher] Fetching: ${feed.category} (${feed.country})`);
        
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; InvestorPaisa/1.0)',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const xml = await response.text();
        const items = parseRSS(xml);
        
        console.log(`[RSS Fetcher] Parsed ${items.length} items from ${feed.category}`);
        
        // Take only up to the limit
        const limitedItems = items.slice(0, feed.limit);
        
        return limitedItems.map(item => ({
          id: generateId(item.link),
          title: item.title,
          summary: item.description || null,
          source: item.source || 'Google News',
          url: item.link,
          image_url: item.imageUrl || getCategoryPlaceholder(feed.category),
          thumbnail_url: item.imageUrl || getCategoryPlaceholder(feed.category),
          category: feed.category,
          country: feed.country,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          relevance_score: 50,
        }));
      } catch (error) {
        console.error(`[RSS Fetcher] Error fetching ${feed.category}:`, error);
        errors.push(`${feed.category}: ${error}`);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(items => allArticles.push(...items));

    console.log(`[RSS Fetcher] Total articles fetched: ${allArticles.length}`);

    // Filter to last 24 hours only
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentArticles = allArticles.filter(a => a.published_at >= oneDayAgo);

    console.log(`[RSS Fetcher] Articles from last 24h: ${recentArticles.length}`);

    // Upsert articles into database
    if (recentArticles.length > 0) {
      const { error: upsertError } = await supabase
        .from('news_articles')
        .upsert(recentArticles, { 
          onConflict: 'id',
          ignoreDuplicates: false // Update existing articles with new image URLs
        });

      if (upsertError) {
        console.error('[RSS Fetcher] Upsert error:', upsertError);
        errors.push(`Database: ${upsertError.message}`);
      } else {
        console.log(`[RSS Fetcher] Successfully upserted ${recentArticles.length} articles`);
      }
    }

    // Clean up old articles (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('news_articles')
      .delete()
      .lt('published_at', sevenDaysAgo);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fetched: allArticles.length,
        inserted: recentArticles.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[RSS Fetcher] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch RSS feeds' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
