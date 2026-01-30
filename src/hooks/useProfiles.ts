
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  website: string | null;
  interests: string[] | null;
  goals: string[] | null;
  trust_level: string | null;
  trust_score: number | null;
  is_verified: boolean | null;
  is_expert: boolean | null;
  is_premium: boolean | null;
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
  portfolio_value: number | null;
  portfolio_change: number | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

// Fetch profile by ID
export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
};

// Fetch profile by username
export const useProfileByUsername = (username: string | undefined) => {
  return useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      if (!username) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
  });
};

// Search profiles
export const useSearchProfiles = (query: string, limit = 10) => {
  return useQuery({
    queryKey: ['profiles', 'search', query, limit],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: query.length > 1,
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'trust_level'>>) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });
};

// Get suggested profiles to follow
export const useSuggestedProfiles = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profiles', 'suggested', user?.id, limit],
    queryFn: async () => {
      // Get profiles the user is not following
      let query = supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified, followers_count')
        .order('followers_count', { ascending: false })
        .limit(limit);

      if (user?.id) {
        query = query.neq('id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
