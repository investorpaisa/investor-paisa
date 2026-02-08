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

// Repost with optional opinion
interface RepostParams {
  postId: string;
  opinion?: string;
}

// Toggle repost mutation (legacy - for simple toggle)
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
        // Add repost without opinion
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

// Create repost with opinion - Fix #2: Create a NEW posts entry for reposts
export const useCreateRepostWithOpinion = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, opinion }: RepostParams): Promise<void> => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if repost already exists in reposts table (unique constraint)
      const { data: existing } = await (supabase as any)
        .from('reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing repost with new opinion
        const { error } = await (supabase as any)
          .from('reposts')
          .update({ opinion: opinion || null })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Get original post details for the repost
        const { data: originalPost, error: fetchError } = await supabase
          .from('posts')
          .select('title, body, type, community_id')
          .eq('id', postId)
          .single();

        if (fetchError) throw fetchError;

        // Create a NEW post entry with type 'repost' so it appears in profile
        // This ensures independent engagement counters
        const { error: postError } = await supabase
          .from('posts')
          .insert({
            author_id: user.id,
            type: 'repost' as any,
            title: opinion || null, // Use opinion as the repost title
            body: originalPost?.body || null,
            link_url: null,
            link_preview: { original_post_id: postId }, // Store reference to original
            upvote_count: 0,
            downvote_count: 0,
            comment_count: 0,
            share_count: 0,
            save_count: 0,
          });

        if (postError) {
          console.error('Failed to create repost post entry:', postError);
          // Continue with reposts table insert even if posts insert fails
        }

        // Also create entry in reposts table for unique constraint
        const { error } = await (supabase as any)
          .from('reposts')
          .insert({
            user_id: user.id,
            post_id: postId,
            opinion: opinion || null,
          });

        if (error) throw error;
        trackEvents.repost(postId);
      }
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['repost', postId] });
      queryClient.invalidateQueries({ queryKey: ['repost-count', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      // Fix #2: Also invalidate user-posts so reposts appear in profile
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Reposted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to repost: ' + error.message);
    },
  });
};

// Remove repost
export const useRemoveRepost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      if (!user?.id) throw new Error('Must be logged in');

      const { error } = await (supabase as any)
        .from('reposts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['repost', postId] });
      queryClient.invalidateQueries({ queryKey: ['repost-count', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Removed repost');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove repost: ' + error.message);
    },
  });
};
