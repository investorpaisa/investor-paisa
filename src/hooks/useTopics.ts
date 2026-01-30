
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  post_count: number | null;
  follower_count: number | null;
  is_trending: boolean | null;
  created_at: string;
}

// Fetch all topics
export const useTopics = () => {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('follower_count', { ascending: false });

      if (error) throw error;
      return data as Topic[];
    },
  });
};

// Fetch trending topics
export const useTrendingTopics = (limit = 10) => {
  return useQuery({
    queryKey: ['topics', 'trending', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('is_trending', true)
        .order('post_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Topic[];
    },
  });
};

// Check if user follows a topic
export const useIsFollowingTopic = (topicId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['topicFollow', user?.id, topicId],
    queryFn: async () => {
      if (!user?.id || !topicId) return false;

      const { data, error } = await supabase
        .from('topic_follows')
        .select('topic_id')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!topicId,
  });
};

// Toggle topic follow
export const useToggleTopicFollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (topicId: string) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if already following
      const { data: existing } = await supabase
        .from('topic_follows')
        .select('topic_id')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .single();

      if (existing) {
        // Unfollow
        const { error } = await supabase
          .from('topic_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('topic_id', topicId);

        if (error) throw error;
        return { action: 'unfollowed' };
      } else {
        // Follow
        const { error } = await supabase
          .from('topic_follows')
          .insert({
            user_id: user.id,
            topic_id: topicId,
          });

        if (error) throw error;
        return { action: 'followed' };
      }
    },
    onSuccess: (result, topicId) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topicFollow', user?.id, topicId] });
      toast.success(result.action === 'followed' ? 'Following topic!' : 'Unfollowed topic');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });
};
