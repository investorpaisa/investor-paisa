import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

export interface SearchResult {
  posts: {
    id: string;
    title: string | null;
    body: string | null;
    type: string;
  }[];
  users: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  topics: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }[];
}

export const useSearch = (query: string, limit: number = 3) => {
  const debouncedQuery = useDebounce(query, 150);

  return useQuery({
    queryKey: ['search', debouncedQuery, limit],
    queryFn: async (): Promise<SearchResult> => {
      if (!debouncedQuery || debouncedQuery.length < 1) {
        return { posts: [], users: [], topics: [] };
      }

      // Sanitize query to prevent SQL injection - remove SQL wildcards and special chars
      const sanitizedQuery = debouncedQuery
        .replace(/[%_\\'";\-\-]/g, '') // Remove SQL wildcards, quotes, and comment chars
        .trim()
        .slice(0, 100); // Limit length

      if (!sanitizedQuery || sanitizedQuery.length < 1) {
        return { posts: [], users: [], topics: [] };
      }

      const searchTerm = `%${sanitizedQuery}%`;

      // Search in parallel using sanitized query
      const [postsResult, usersResult, topicsResult] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, body, type')
          .eq('moderation_status', 'approved')
          .is('deleted_at', null)
          .or(`title.ilike.%${sanitizedQuery}%,body.ilike.%${sanitizedQuery}%`)
          .limit(limit),
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .ilike('username', searchTerm)
          .limit(limit),
        supabase
          .from('topics')
          .select('id, name, slug, icon')
          .ilike('name', searchTerm)
          .limit(limit),
      ]);

      return {
        posts: postsResult.data || [],
        users: usersResult.data || [],
        topics: topicsResult.data || [],
      };
    },
    enabled: debouncedQuery.length >= 1,
    staleTime: 30000,
  });
};

export default useSearch;
