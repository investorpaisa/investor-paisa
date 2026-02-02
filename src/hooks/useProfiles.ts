
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Public-safe profile fields that don't contain PII
const PUBLIC_PROFILE_FIELDS = 'id, username, full_name, avatar_url, cover_url, bio, headline, location, website, interests, goals, trust_level, trust_score, is_verified, is_expert, is_premium, followers_count, following_count, posts_count, onboarding_completed, created_at, updated_at, tier, linkedin_url, twitter_url, instagram_url, mobile_verified, linkedin_verified, privacy_experience, privacy_education, privacy_certifications, privacy_skills, profile_completeness_score, streak_days, upvote_rate';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  email?: string | null; // Only available for own profile
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
  portfolio_value?: number | null; // Only available for own profile
  portfolio_change?: number | null; // Only available for own profile
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
  tier?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  mobile_verified?: boolean | null;
  linkedin_verified?: boolean | null;
  privacy_experience?: boolean | null;
  privacy_education?: boolean | null;
  privacy_certifications?: boolean | null;
  privacy_skills?: boolean | null;
  profile_completeness_score?: number | null;
  streak_days?: number | null;
  upvote_rate?: number | null;
  phone?: string | null; // Only available for own profile
}

// Fetch profile by ID - excludes PII for other users
export const useProfile = (userId: string | undefined) => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      // If fetching own profile, include all fields
      const isOwnProfile = currentUser?.id === userId;
      
      if (isOwnProfile) {
        // For own profile, include PII fields
        const { data, error } = await supabase
          .from('profiles')
          .select('*, email, phone, portfolio_value, portfolio_change')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data as unknown as Profile;
      } else {
        // For other profiles, exclude PII
        const { data, error } = await supabase
          .from('profiles')
          .select(PUBLIC_PROFILE_FIELDS)
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data as unknown as Profile;
      }
    },
    enabled: !!userId,
  });
};

// Fetch profile by username - excludes PII
export const useProfileByUsername = (username: string | undefined) => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      if (!username) return null;

      // First get the profile with public fields only
      const { data, error } = await supabase
        .from('profiles')
        .select(PUBLIC_PROFILE_FIELDS)
        .eq('username', username)
        .single();

      if (error) throw error;
      
      // If it's the current user's profile, fetch with full fields
      if (currentUser?.id && data?.id === currentUser.id) {
        const { data: fullData, error: fullError } = await supabase
          .from('profiles')
          .select('*, email, phone, portfolio_value, portfolio_change')
          .eq('id', currentUser.id)
          .single();
        
        if (fullError) throw fullError;
        return fullData as unknown as Profile;
      }
      
      return data as unknown as Profile;
    },
    enabled: !!username,
  });
};

// Search profiles - only returns public fields, no PII
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

// Update profile mutation - only for own profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Remove read-only fields from updates
      const { id, created_at, updated_at, trust_level, trust_score, tier, is_expert, is_verified, ...safeUpdates } = updates;

      const { data, error } = await supabase
        .from('profiles')
        .update(safeUpdates)
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

// Get suggested profiles to follow - only returns public fields, no PII
export const useSuggestedProfiles = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profiles', 'suggested', user?.id, limit],
    queryFn: async () => {
      // Get profiles the user is not following - only public fields
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
