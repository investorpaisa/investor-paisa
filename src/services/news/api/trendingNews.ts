
import { supabase } from '@/integrations/supabase/client';
import { NewsArticle } from '@/types';

/**
 * Get top trending news articles by relevance score
 * @param limit - Number of articles to fetch
 * @returns Promise with news articles
 */
export const getTrendingNews = async (limit = 10): Promise<NewsArticle[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from('news_articles')
      .select()
      .order('relevance_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as NewsArticle[] || [];
  } catch (error) {
    console.error('Error fetching trending news:', error);
    return [];
  }
};
