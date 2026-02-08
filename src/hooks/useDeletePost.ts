import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('author_id', user.id); // Ensure user owns the post

      if (error) throw error;
      return { postId };
    },
    onSuccess: (_, postId) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Post deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, entityId }: { commentId: string; entityId: string }) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('author_id', user.id); // Ensure user owns the comment

      if (error) throw error;
      return { commentId, entityId };
    },
    onSuccess: (_, { entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityId] });
      queryClient.invalidateQueries({ queryKey: ['answers', entityId] });
      toast.success('Comment deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
};
