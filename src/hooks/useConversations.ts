import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean | null;
  created_at: string;
  updated_at: string;
  last_message?: {
    body: string | null;
    created_at: string;
    sender_id: string;
  } | null;
  participants?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  }[];
  unread_count?: number;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user?.id) return [];

      // Get conversation IDs user participates in
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (partError) throw partError;
      if (!participations || participations.length === 0) return [];

      const conversationIds = participations.map(p => p.conversation_id);

      // Get conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, name, is_group, created_at, updated_at')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;
      if (!conversations) return [];

      // Get last message for each conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, sender_id')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Get other participants for each conversation
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds)
        .neq('user_id', user.id);

      // Get participant profiles
      const otherUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .in('id', otherUserIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const lastReadMap = new Map(participations.map(p => [p.conversation_id, p.last_read_at]));

      // Build conversation objects with enriched data
      return conversations.map(conv => {
        // Find last message for this conversation
        const lastMessage = messages?.find(m => m.conversation_id === conv.id) || null;
        
        // Find other participants
        const convParticipants = allParticipants
          ?.filter(p => p.conversation_id === conv.id)
          .map(p => profilesMap.get(p.user_id))
          .filter(Boolean) || [];

        // Count unread messages
        const lastReadAt = lastReadMap.get(conv.id);
        const unreadCount = messages?.filter(
          m => m.conversation_id === conv.id && 
               m.sender_id !== user.id && 
               (!lastReadAt || new Date(m.created_at) > new Date(lastReadAt))
        ).length || 0;

        return {
          ...conv,
          last_message: lastMessage ? {
            body: lastMessage.body,
            created_at: lastMessage.created_at,
            sender_id: lastMessage.sender_id,
          } : null,
          participants: convParticipants as Conversation['participants'],
          unread_count: unreadCount,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
};

export const useConversationMessages = (conversationId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('id, body, created_at, sender_id, status')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId && !!user?.id,
  });
};
