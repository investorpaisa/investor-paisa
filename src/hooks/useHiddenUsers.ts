import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface HiddenUser {
  id: string;
  user_id: string;
  hidden_user_id: string;
  created_at: string;
}

// Get all hidden users for the current user
export const useHiddenUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hidden-users', user?.id],
    queryFn: async (): Promise<HiddenUser[]> => {
      if (!user?.id) return [];

      const { data, error } = await (supabase as any)
        .from('hidden_users')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching hidden users:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
};

// Check if a specific user is hidden
export const useIsUserHidden = (hiddenUserId: string | undefined) => {
  const { data: hiddenUsers } = useHiddenUsers();

  if (!hiddenUserId || !hiddenUsers) return false;
  return hiddenUsers.some(hu => hu.hidden_user_id === hiddenUserId);
};

// Toggle hide/unhide a user
export const useToggleHideUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (hiddenUserId: string): Promise<{ action: 'hidden' | 'unhidden' }> => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if already hidden
      const { data: existing, error: checkError } = await (supabase as any)
        .from('hidden_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('hidden_user_id', hiddenUserId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking hidden status:', checkError);
        throw new Error('Failed to check hidden status');
      }

      if (existing) {
        // Unhide the user
        const { error } = await (supabase as any)
          .from('hidden_users')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'unhidden' };
      } else {
        // Hide the user
        const { error } = await (supabase as any)
          .from('hidden_users')
          .insert({
            user_id: user.id,
            hidden_user_id: hiddenUserId,
          });

        if (error) throw error;
        return { action: 'hidden' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['hidden-users'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      
      if (result.action === 'hidden') {
        toast.success('User hidden', {
          description: 'You will no longer see posts from this user.',
        });
      } else {
        toast.success('User unhidden', {
          description: 'You will now see posts from this user again.',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
};
