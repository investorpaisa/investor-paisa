import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, RefreshCw, AlertCircle, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MassBroadcastModal } from '@/components/inbox/MassBroadcastModal';

// Loading skeleton
const ConversationSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="border border-border/50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-3 w-14" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Empty state
const EmptyState: React.FC = () => (
  <Card className="border border-border/50 bg-card/50">
    <CardContent className="p-8 sm:p-12 text-center">
      <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2">No messages yet</h3>
      <p className="text-muted-foreground text-xs sm:text-sm">
        Start a conversation by messaging someone from their profile
      </p>
    </CardContent>
  </Card>
);

// Error state
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Card className="border border-border/50 bg-card/50">
    <CardContent className="p-8 sm:p-12 text-center">
      <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
      <h3 className="text-base sm:text-lg font-semibold mb-2">Failed to load messages</h3>
      <p className="text-muted-foreground text-xs sm:text-sm mb-4">
        Something went wrong. Please try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </CardContent>
  </Card>
);

// Conversation item
const ConversationItem: React.FC<{ 
  conversation: Conversation;
  onClick: () => void;
}> = ({ conversation, onClick }) => {
  const participant = conversation.participants?.[0];
  const displayName = conversation.is_group 
    ? conversation.name 
    : participant?.full_name || 'Unknown User';
  
  const initials = displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <Card 
      className="border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            <AvatarImage src={participant?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h4 className="font-medium text-sm truncate">{displayName}</h4>
              {conversation.last_message && (
                <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground truncate">
                {conversation.last_message?.body || 'No messages yet'}
              </p>
              {(conversation.unread_count || 0) > 0 && (
                <Badge className="bg-primary text-primary-foreground rounded-full h-5 min-w-[20px] flex items-center justify-center text-[10px] ml-2 flex-shrink-0">
                  {conversation.unread_count}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Inbox: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Check if user is an expert
  const { data: profile } = useQuery({
    queryKey: ['user-profile-tier', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('tier, is_expert')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isExpert = profile?.tier === 'expert' || profile?.is_expert === true;

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-2 py-4 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold">Messages</h1>
          </div>
          
          {/* Expert Broadcast Button */}
          {isExpert && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowBroadcastModal(true)}
            >
              <Radio className="h-4 w-4" />
              Broadcast
            </Button>
          )}
        </div>
        
        {/* Mass Broadcast Modal */}
        <MassBroadcastModal 
          isOpen={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
        />

        {/* Content */}
        <div className="space-y-3">
          {isLoading && <ConversationSkeleton />}
          
          {error && <ErrorState onRetry={() => refetch()} />}
          
          {!isLoading && !error && (!conversations || conversations.length === 0) && (
            <EmptyState />
          )}
          
          {!isLoading && !error && conversations && conversations.length > 0 && (
            conversations.map((conv) => (
              <ConversationItem 
                key={conv.id} 
                conversation={conv}
                onClick={() => {/* Navigate to conversation detail */}}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
