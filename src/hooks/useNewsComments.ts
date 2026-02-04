
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NewsComment {
  id: string;
  body: string;
  author_id: string;
  entity_id: string;
  entity_type: string;
  parent_id: string | null;
  like_count: number | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
}

// Get comments for a news article
export const useNewsComments = (articleId: string | undefined) => {
  return useQuery({
    queryKey: ['news-comments', articleId],
    queryFn: async () => {
      if (!articleId) return [];

      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_id', articleId)
        .eq('entity_type', 'news_article')
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      // Get author profiles
      const authorIds = [...new Set(comments.map(c => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, is_verified')
        .in('id', authorIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return comments.map(comment => ({
        ...comment,
        author: profilesMap.get(comment.author_id) || null,
      })) as NewsComment[];
    },
    enabled: !!articleId,
  });
};

// Create comment on news article
export const useCreateNewsComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      articleId,
      body,
      parentId,
    }: {
      articleId: string;
      body: string;
      parentId?: string;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          author_id: user.id,
          entity_id: articleId,
          entity_type: 'news_article',
          body,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['news-comments', variables.articleId] });
      toast.success('Comment added!');
    },
    onError: (error) => {
      toast.error('Failed to add comment: ' + error.message);
    },
  });
};

// Delete comment on news article
export const useDeleteNewsComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, articleId }: { commentId: string; articleId: string }) => {
      const { error } = await supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['news-comments', variables.articleId] });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete comment: ' + error.message);
    },
  });
};
