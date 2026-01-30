
import { supabase } from '@/integrations/supabase/client';
import { NewsArticle } from '@/types';

/**
 * Get financial trends from Alpha Vantage
 * @param limit - Number of articles to fetch
 * @returns Promise with news articles
 */
export const getFinancialTrends = async (limit = 10): Promise<NewsArticle[]> => {
  try {
    // First try to get from our database
    const { data, error } = await (supabase as any)
      .from('news_articles')
      .select()
      .eq('category', 'Financial')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // If we have enough data, return it
    if (data && data.length >= limit) {
      return data as NewsArticle[];
    }
    
    // Otherwise, fetch from edge function which will aggregate from external APIs
    const response = await supabase.functions.invoke('fetch-financial-trends', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
    
    if (response.error) throw response.error;
    return response.data as NewsArticle[] || [];
  } catch (error) {
    console.error('Error fetching financial trends:', error);
    return [];
  }
};
