
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Bookmark {
  id: string;
  user_id: string;
  entity_id: string;
  entity_type: string;
  collection_name: string | null;
  created_at: string;
}

// Get all bookmarks for current user
export const useBookmarks = (entityType: string = 'post') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmarks', user?.id, entityType],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Bookmark[];
    },
    enabled: !!user?.id,
  });
};

// Check if entity is bookmarked
export const useIsBookmarked = (entityId: string | undefined, entityType: string = 'post') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmark', entityId, entityType, user?.id],
    queryFn: async () => {
      if (!user?.id || !entityId) return false;

      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!entityId,
  });
};

// Toggle bookmark mutation
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      entityId,
      entityType = 'post',
      collectionName = null,
    }: {
      entityId: string;
      entityType?: string;
      collectionName?: string | null;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if bookmark exists
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .single();

      if (existing) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            entity_id: entityId,
            entity_type: entityType,
            collection_name: collectionName,
          });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      
      toast.success(result.action === 'added' ? 'Saved to bookmarks' : 'Removed from bookmarks');
    },
    onError: (error) => {
      toast.error('Failed to update bookmark: ' + error.message);
    },
  });
};

// Get bookmarked posts with full post data
export const useBookmarkedPosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmarked-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('entity_id')
        .eq('user_id', user.id)
        .eq('entity_type', 'post');

      if (bookmarksError) throw bookmarksError;
      if (!bookmarks || bookmarks.length === 0) return [];

      const postIds = bookmarks.map(b => b.entity_id);

      // Get posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .is('deleted_at', null);

      if (postsError) throw postsError;
      return posts || [];
    },
    enabled: !!user?.id,
  });
};
