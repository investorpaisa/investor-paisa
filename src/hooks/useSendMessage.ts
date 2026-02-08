import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Patterns to detect credentials and sensitive information
const CREDENTIAL_PATTERNS = [
  /password[\s:=]+\S+/i,
  /pwd[\s:=]+\S+/i,
  /api[_-]?key[\s:=]+\S+/i,
  /secret[\s:=]+\S+/i,
  /token[\s:=]+\S+/i,
  /\bpin[\s:=]+\d{4,}/i,
  /cvv[\s:=]+\d{3,4}/i,
  /\b(?:credit|debit)\s*card[\s:=]+\d+/i,
];

// Check if message contains credentials
export const containsCredentials = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  
  // Check for explicit credential patterns
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }
  
  // Check for common credential keywords followed by values
  const sensitiveKeywords = ['password', 'pwd', 'pin', 'cvv', 'otp', 'secret'];
  for (const keyword of sensitiveKeywords) {
    const regex = new RegExp(`${keyword}\\s*[:=]?\\s*\\S{4,}`, 'i');
    if (regex.test(message)) {
      return true;
    }
  }
  
  return false;
};

interface SendMessageParams {
  conversationId: string;
  body: string;
  mediaUrls?: string[];
  replyToId?: string;
}

interface CreateConversationParams {
  targetUserId: string;
  initialMessage: string;
}

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, body, mediaUrls, replyToId }: SendMessageParams) => {
      if (!user?.id) throw new Error('Must be logged in');
      
      // Check for credentials before sending
      if (containsCredentials(body)) {
        throw new Error('Message cannot contain sensitive information like passwords, PINs, or API keys');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body,
          media_urls: mediaUrls || null,
          reply_to_id: replyToId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, initialMessage }: CreateConversationParams) => {
      if (!user?.id) throw new Error('Must be logged in');
      if (user.id === targetUserId) throw new Error('Cannot message yourself');

      // Check if current user follows the target user
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (followError) throw followError;
      
      if (!followData) {
        throw new Error('You need to follow this user before you can message them');
      }

      // Check for credentials in initial message
      if (containsCredentials(initialMessage)) {
        throw new Error('Message cannot contain sensitive information like passwords, PINs, or API keys');
      }

      // Use SECURITY DEFINER RPC to safely create/get conversation
      // This bypasses RLS issues when adding the other user as participant
      const { data: conversationId, error: rpcError } = await supabase
        .rpc('get_or_create_dm_conversation', {
          p_user_a: user.id,
          p_user_b: targetUserId,
        });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw new Error('Failed to create conversation: ' + rpcError.message);
      }

      if (!conversationId) {
        throw new Error('Failed to create conversation');
      }

      // Send initial message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: initialMessage,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      return { conversationId, message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Message sent!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
