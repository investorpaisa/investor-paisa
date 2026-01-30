
interface RealNewsArticle {
  title: string;
  summary: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
}

// Comprehensive RSS feed URLs for major financial and news sources
const RSS_FEEDS = {
  'Business': [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.reuters.com/reuters/businessNews.rss',
    'https://www.cnbc.com/id/10001147/device/rss/rss.html',
    'https://feeds.marketwatch.com/marketwatch/marketpulse/',
    'https://feeds.fortune.com/fortune/feeds'
  ],
  'Markets': [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.reuters.com/reuters/marketsNews.rss',
    'https://feeds.marketwatch.com/marketwatch/topstories/',
    'https://www.cnbc.com/id/15839135/device/rss/rss.html'
  ],
  'Cryptocurrency': [
    'https://feeds.feedburner.com/CoinDesk',
    'https://cointelegraph.com/rss'
  ],
  'Economy': [
    'https://feeds.reuters.com/reuters/economicNews.rss',
    'https://feeds.bloomberg.com/economics/news.rss',
    'https://feeds.marketwatch.com/marketwatch/economy/'
  ],
  'Technology': [
    'https://feeds.reuters.com/reuters/technologyNews.rss',
    'https://feeds.bloomberg.com/technology/news.rss'
  ]
};

// Simple XML parser for RSS feeds using regex
function parseRSSXML(xmlText: string): any[] {
  const items: any[] = [];
  
  // Extract items using regex patterns
  const itemPattern = /<item[^>]*>(.*?)<\/item>/gs;
  const itemMatches = xmlText.match(itemPattern);
  
  if (!itemMatches) return items;
  
  for (const itemXml of itemMatches.slice(0, 10)) { // Limit to 10 items per feed
    const item: any = {};
    
    // Extract title
    const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    if (titleMatch) {
      item.title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    
    // Extract link
    const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    if (linkMatch) {
      item.link = linkMatch[1].trim();
    }
    
    // Extract description
    const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    if (descMatch) {
      item.description = descMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    
    // Extract pubDate
    const pubDateMatch = itemXml.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/s);
    if (pubDateMatch) {
      item.pubDate = pubDateMatch[1].trim();
    }
    
    // Extract media content or enclosure for images
    const mediaMatch = itemXml.match(/<media:content[^>]+url="([^"]+)"/);
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/);
    
    if (mediaMatch) {
      item.imageUrl = mediaMatch[1];
    } else if (enclosureMatch) {
      item.imageUrl = enclosureMatch[1];
    }
    
    if (item.title && item.link) {
      items.push(item);
    }
  }
  
  return items;
}

export const fetchRealNewsArticles = async (category: string, limit: number = 5): Promise<RealNewsArticle[]> => {
  console.log(`Fetching real news for category: ${category}, limit: ${limit}`);
  
  const feedUrls = (RSS_FEEDS as Record<string, string[]>)[category] || RSS_FEEDS['Business'];
  const articles: RealNewsArticle[] = [];
  
  try {
    // Try to fetch from multiple RSS feeds
    for (const feedUrl of feedUrls.slice(0, 3)) { // Use up to 3 feeds per category
      try {
        console.log(`Fetching from RSS feed: ${feedUrl}`);
        
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(8000) // 8 second timeout
        });
        
        if (!response.ok) {
          console.error(`RSS feed error: ${response.status} for ${feedUrl}`);
          continue;
        }
        
        const xmlText = await response.text();
        console.log(`Received XML content length: ${xmlText.length} from ${feedUrl}`);
        
        // Parse XML using regex-based parser
        const items = parseRSSXML(xmlText);
        console.log(`Found ${items.length} items in RSS feed: ${feedUrl}`);
        
        // Extract source from feed URL
        let source = '';
        if (feedUrl.includes('bloomberg')) source = 'Bloomberg';
        else if (feedUrl.includes('reuters')) source = 'Reuters';
        else if (feedUrl.includes('cnbc')) source = 'CNBC';
        else if (feedUrl.includes('marketwatch')) source = 'MarketWatch';
        else if (feedUrl.includes('fortune')) source = 'Fortune';
        else if (feedUrl.includes('coindesk')) source = 'CoinDesk';
        else if (feedUrl.includes('cointelegraph')) source = 'Cointelegraph';
        else {
          const sourceMatch = feedUrl.match(/https?:\/\/(?:feeds\.)?(?:www\.)?([^\/\.]+)/);
          source = sourceMatch ? sourceMatch[1].toUpperCase() : 'Unknown Source';
        }
        
        for (let i = 0; i < Math.min(items.length, Math.ceil(limit / 2)); i++) {
          const item = items[i];
          
          // Clean up description
          let description = item.description || '';
          if (description) {
            description = description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
            if (description.length > 300) {
              description = description.substring(0, 297) + '...';
            }
          }
          
          // Use fallback image if none found
          let imageUrl = item.imageUrl || '';
          if (!imageUrl) {
            imageUrl = `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop&q=80&auto=format`;
          }
          
          // Only add if we have essential fields
          if (item.title && item.link && description) {
            console.log(`Adding article: ${item.title.substring(0, 50)}...`);
            articles.push({
              title: item.title,
              summary: description,
              url: item.link,
              imageUrl: imageUrl,
              source: source,
              publishedAt: item.pubDate || new Date().toISOString()
            });
          }
        }
        
        // Stop if we have enough articles
        if (articles.length >= limit) break;
        
      } catch (feedError) {
        console.error(`Error processing RSS feed ${feedUrl}:`, feedError);
        continue;
      }
    }
    
    console.log(`Successfully fetched ${articles.length} real articles from RSS feeds`);
    return articles.slice(0, limit);
    
  } catch (error) {
    console.error('Error fetching real news:', error);
    return [];
  }
};

// Enhanced fallback function using NewsAPI with more sources
export const fetchFromNewsAPI = async (topic: string, limit: number = 5): Promise<RealNewsArticle[]> => {
  const newsApiKey = Deno.env.get('NEWS_API_KEY');
  
  if (!newsApiKey) {
    console.log('NEWS_API_KEY not found, skipping NewsAPI fetch');
    return [];
  }
  
  try {
    console.log(`Fetching from NewsAPI with topic: ${topic}`);
    
    const endpoint = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=en&sortBy=publishedAt&pageSize=${limit}&domains=bloomberg.com,reuters.com,cnbc.com,marketwatch.com,wsj.com,fortune.com`;
    
    const response = await fetch(endpoint, {
      headers: {
        'X-API-Key': newsApiKey,
        'User-Agent': 'NewsBot/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error(`NewsAPI error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      console.log(`NewsAPI returned ${data.articles.length} articles`);
      
      return data.articles.slice(0, limit).map((article: any) => ({
        title: article.title || 'Untitled',
        summary: article.description || article.content?.substring(0, 300) + '...' || 'No summary available',
        url: article.url || '#',
        imageUrl: article.urlToImage || `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop&q=80`,
        source: article.source?.name || 'News Source',
        publishedAt: article.publishedAt || new Date().toISOString()
      }));
    }
    
    return [];
    
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error);
    return [];
  }
};
