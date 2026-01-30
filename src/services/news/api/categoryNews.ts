
import { supabase } from '@/integrations/supabase/client';
import { NewsArticle } from '@/types';

/**
 * Get news articles by category
 * @param category - Category to filter by
 * @param limit - Number of articles to fetch
 * @returns Promise with news articles
 */
export const getNewsByCategory = async (category: string, limit = 10): Promise<NewsArticle[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from('news_articles')
      .select()
      .eq('category', category)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as NewsArticle[] || [];
  } catch (error) {
    console.error('Error fetching news by category:', error);
    return [];
  }
};
