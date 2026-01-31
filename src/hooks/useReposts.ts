import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { trackEvents } from '@/services/analytics/googleAnalytics';

// Check if user has reposted a specific post
export const useIsReposted = (postId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['repost', postId, user?.id],
    queryFn: async () => {
      if (!user?.id || !postId) return false;

      const { data, error } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!postId,
  });
};

// Get repost count for a post
export const useRepostCount = (postId: string | undefined) => {
  return useQuery({
    queryKey: ['repost-count', postId],
    queryFn: async () => {
      if (!postId) return 0;

      const { count, error } = await supabase
        .from('reposts')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!postId,
  });
};

// Toggle repost mutation
export const useToggleRepost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if repost exists
      const { data: existing } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Remove repost
        const { error } = await supabase
          .from('reposts')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add repost
        const { error } = await supabase
          .from('reposts')
          .insert({
            user_id: user.id,
            post_id: postId,
          });

        if (error) throw error;
        trackEvents.repost(postId);
        return { action: 'added' };
      }
    },
    onSuccess: (result, postId) => {
      queryClient.invalidateQueries({ queryKey: ['repost', postId] });
      queryClient.invalidateQueries({ queryKey: ['repost-count', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      
      if (result.action === 'added') {
        toast.success('Reposted');
      } else {
        toast.success('Removed repost');
      }
    },
    onError: (error) => {
      toast.error('Failed to repost: ' + error.message);
    },
  });
};
