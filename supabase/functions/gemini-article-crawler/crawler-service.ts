import { checkRecentArticles } from './utils.ts';
import { insertArticles, filterDuplicateArticles } from './database.ts';
import { fetchRealNewsArticles, fetchFromNewsAPI } from './real-news-fetcher.ts';
import { summarizeContent } from './gemini-summarizer.ts';

export const crawlArticles = async (
  topic: string = 'financial news',
  limit: number = 5,
  category: string = 'Business'
) => {
  console.log(`Starting news crawling for topic: "${topic}", limit: ${limit}, category: ${category}`);

  try {
    // Check for recent articles to avoid duplicates
    const recentTitles = await checkRecentArticles(category);
    console.log(`Found ${recentTitles.length} recent articles in ${category} category`);

    // Fetch real articles from RSS feeds
    console.log('Attempting to fetch articles from RSS feeds...');
    let realArticles = await fetchRealNewsArticles(category, limit * 2); // Fetch more to account for filtering
    console.log(`RSS feeds provided ${realArticles.length} articles`);

    // If RSS feeds don't provide enough articles, try NewsAPI as fallback
    if (realArticles.length < limit) {
      console.log(`RSS feeds provided ${realArticles.length}/${limit} articles, trying NewsAPI for more`);
      const newsApiArticles = await fetchFromNewsAPI(topic, limit - realArticles.length);
      console.log(`NewsAPI provided ${newsApiArticles.length} additional articles`);
      realArticles = [...realArticles, ...newsApiArticles];
    }

    if (realArticles.length === 0) {
      console.error('No real articles found from any source');
      return {
        success: false,
        articles: [],
        message: 'Unable to fetch articles at this time. RSS feeds and NewsAPI may be unavailable.',
        costOptimizations: {
          apiCallsUsed: 0,
          duplicatesFiltered: 0,
          recentArticlesFound: recentTitles.length,
          sourcesAttempted: ['RSS Feeds', 'NewsAPI'],
          sourcesUsed: []
        }
      };
    }

    console.log(`Total articles collected: ${realArticles.length}`);

    // Convert real articles to our database format with Gemini summarization
    const articles = [];
    const maxArticlesToProcess = Math.min(realArticles.length, limit);
    
    for (let index = 0; index < maxArticlesToProcess; index++) {
      const article = realArticles[index];
      const articleId = `real-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`Processing article ${index + 1}/${maxArticlesToProcess}: "${article.title.substring(0, 50)}..."`);
      
      // Use Gemini to create a better summary if we have content
      let enhancedSummary = article.summary;
      if (article.summary && article.summary.length > 50) {
        try {
          console.log(`Enhancing summary with Gemini for article: ${article.title.substring(0, 30)}...`);
          enhancedSummary = await summarizeContent(article.title, article.summary, article.source);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to enhance summary for article: ${errorMessage}`);
          // Keep original summary on error
        }
      }
      
      articles.push({
        id: articleId,
        title: article.title,
        summary: enhancedSummary,
        url: article.url,
        source: article.source,
        category: category,
        published_at: article.publishedAt || new Date().toISOString(),
        thumbnail_url: article.imageUrl,
        relevance_score: 85 + Math.floor(Math.random() * 15), // High score for real articles
        created_at: new Date().toISOString()
      });
    }

    console.log(`Processed ${articles.length} articles with enhanced summaries`);

    // Filter out potential duplicates
    const filteredArticles = filterDuplicateArticles(articles, recentTitles);
    console.log(`${filteredArticles.length} articles remain after duplicate filtering`);

    // Get unique sources used
    const sourcesUsed = realArticles.slice(0, maxArticlesToProcess).map(a => a.source).filter((v, i, a) => a.indexOf(v) === i);

    // Insert to database
    if (filteredArticles.length > 0) {
      console.log(`Attempting to insert ${filteredArticles.length} articles into database...`);
      const { error: insertError } = await insertArticles(filteredArticles);

      if (insertError) {
        console.error('Error inserting articles:', insertError);
        return {
          success: false,
          articles: [],
          message: `Failed to save articles to database: ${String(insertError)}`,
          costOptimizations: {
            apiCallsUsed: filteredArticles.length,
            duplicatesFiltered: articles.length - filteredArticles.length,
            recentArticlesFound: recentTitles.length,
            sourcesUsed: sourcesUsed
          }
        };
      } else {
        console.log(`Successfully inserted ${filteredArticles.length} articles into database`);
      }
    } else {
      console.log('No new articles to insert after filtering');
    }

    return {
      success: true,
      articles: filteredArticles,
      message: `Successfully crawled and saved ${filteredArticles.length} articles from ${sourcesUsed.length} sources`,
      costOptimizations: {
        apiCallsUsed: filteredArticles.length, // Number of Gemini API calls
        duplicatesFiltered: articles.length - filteredArticles.length,
        recentArticlesFound: recentTitles.length,
        sourcesUsed: sourcesUsed
      }
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Critical error in crawlArticles:', error);
    return {
      success: false,
      articles: [],
      message: `Crawler error: ${errorMessage}`,
      costOptimizations: {
        apiCallsUsed: 0,
        duplicatesFiltered: 0,
        recentArticlesFound: 0,
        sourcesUsed: []
      }
    };
  }
};
