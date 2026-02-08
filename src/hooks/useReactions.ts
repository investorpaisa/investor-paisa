
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ReactionType = 'like' | 'upvote' | 'downvote' | 'save';
export type EntityType = 'post' | 'answer' | 'comment';

export interface Reaction {
  id: string;
  user_id: string;
  entity_id: string;
  entity_type: EntityType;
  reaction_type: ReactionType;
  created_at: string;
}

// Get user's reactions for an entity
export const useUserReaction = (entityId: string | undefined, entityType: EntityType) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reaction', entityId, entityType, user?.id],
    queryFn: async () => {
      if (!user?.id || !entityId) return null;

      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as Reaction[];
    },
    enabled: !!user?.id && !!entityId,
  });
};

// Get all reactions for an entity
export const useEntityReactions = (entityId: string | undefined, entityType: EntityType) => {
  return useQuery({
    queryKey: ['reactions', entityId, entityType],
    queryFn: async () => {
      if (!entityId) return [];

      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);

      if (error) throw error;
      return data as Reaction[];
    },
    enabled: !!entityId,
  });
};

// Toggle reaction mutation
export const useToggleReaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      entityId,
      entityType,
      reactionType,
    }: {
      entityId: string;
      entityType: EntityType;
      reactionType: ReactionType;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if reaction exists
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .single();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            user_id: user.id,
            entity_id: entityId,
            entity_type: entityType,
            reaction_type: reactionType,
          });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reaction', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['reactions', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.entityId] });
    },
    onError: (error) => {
      toast.error('Failed to update reaction: ' + error.message);
    },
  });
};
