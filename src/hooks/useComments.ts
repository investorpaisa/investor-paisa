
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Comment {
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

// Get comments for a post
export const useComments = (postId: string | undefined) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];

      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_id', postId)
        .eq('entity_type', 'post')
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
      })) as Comment[];
    },
    enabled: !!postId,
  });
};

// Create comment mutation
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      postId,
      body,
      parentId,
    }: {
      postId: string;
      body: string;
      parentId?: string;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          author_id: user.id,
          entity_id: postId,
          entity_type: 'post',
          body,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Comment added!');
    },
    onError: (error) => {
      toast.error('Failed to add comment: ' + error.message);
    },
  });
};

// Delete comment mutation
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete comment: ' + error.message);
    },
  });
};
