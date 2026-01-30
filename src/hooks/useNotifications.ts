
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'answer' | 'system' | 'live_session' | 'badge';
  title: string | null;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  actor_id: string | null;
  payload: Record<string, unknown> | null;
  is_read: boolean | null;
  created_at: string;
  actor?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

// Fetch user notifications
export const useNotifications = (limit = 50) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!notifications || notifications.length === 0) return [];

      // Get actor profiles
      const actorIds = notifications
        .map(n => n.actor_id)
        .filter((id): id is string => !!id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', actorIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return notifications.map(notification => ({
        ...notification,
        actor: notification.actor_id ? profilesMap.get(notification.actor_id) || null : null,
      })) as Notification[];
    },
    enabled: !!user?.id,
  });
};

// Get unread count
export const useUnreadNotificationsCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'unread', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });
};

// Mark notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Mark all notifications as read
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });
};
