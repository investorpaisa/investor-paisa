import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { trackEvents } from '@/services/analytics/googleAnalytics';

interface Repost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

// Check if user has reposted a specific post
export const useIsReposted = (postId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['repost', postId, user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !postId) return false;

      // Direct query to reposts table (cast to any since types may not be generated yet)
      const { data, error } = await (supabase as any)
        .from('reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking repost:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id && !!postId,
  });
};

// Get repost count for a post
export const useRepostCount = (postId: string | undefined) => {
  return useQuery({
    queryKey: ['repost-count', postId],
    queryFn: async (): Promise<number> => {
      if (!postId) return 0;

      const { count, error } = await (supabase as any)
        .from('reposts')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        console.error('Error getting repost count:', error);
        return 0;
      }
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
    mutationFn: async (postId: string): Promise<{ action: 'added' | 'removed' }> => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if repost exists
      const { data: existing, error: checkError } = await (supabase as any)
        .from('reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking repost:', checkError);
        throw new Error('Failed to check repost status');
      }

      if (existing) {
        // Remove repost
        const { error } = await (supabase as any)
          .from('reposts')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add repost
        const { error } = await (supabase as any)
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
    onError: (error: Error) => {
      toast.error('Failed to repost: ' + error.message);
    },
  });
};
