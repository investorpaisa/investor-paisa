
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowWithProfile extends Follow {
  profile?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    headline: string | null;
    is_verified: boolean | null;
  } | null;
}

// Get users the current user is following
export const useFollowing = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: follows, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id);

      if (error) throw error;
      if (!follows || follows.length === 0) return [];

      // Get profiles of followed users
      const followingIds = follows.map(f => f.following_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .in('id', followingIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return follows.map(follow => ({
        ...follow,
        profile: profilesMap.get(follow.following_id) || null,
      })) as FollowWithProfile[];
    },
    enabled: !!user?.id,
  });
};

// Get followers of the current user
export const useFollowers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: follows, error } = await supabase
        .from('follows')
        .select('*')
        .eq('following_id', user.id);

      if (error) throw error;
      if (!follows || follows.length === 0) return [];

      // Get profiles of followers
      const followerIds = follows.map(f => f.follower_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .in('id', followerIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return follows.map(follow => ({
        ...follow,
        profile: profilesMap.get(follow.follower_id) || null,
      })) as FollowWithProfile[];
    },
    enabled: !!user?.id,
  });
};

// Check if following a specific user
export const useIsFollowing = (targetUserId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isFollowing', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId,
  });
};

// Toggle follow mutation
export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Must be logged in');
      if (user.id === targetUserId) throw new Error('Cannot follow yourself');

      // Check if already following
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      if (existing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'unfollowed' };
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;
        return { action: 'followed' };
      }
    },
    onSuccess: (result, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(result.action === 'followed' ? 'Following!' : 'Unfollowed');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });
};
