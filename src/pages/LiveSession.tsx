import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Users, Clock, Loader2, Video, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const LiveSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: ['live-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          expert:expert_id (
            id, full_name, username, avatar_url, is_verified
          )
        `)
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Join session
  const handleJoin = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsJoining(true);
    try {
      const { error } = await supabase
        .from('session_participants')
        .upsert({
          session_id: sessionId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        });

      if (error) throw error;
      setHasJoined(true);
      toast.success('Joined session!');
    } catch (error) {
      console.error('Join error:', error);
      toast.error('Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  // Send message (mock - would use realtime in production)
  const sendMessage = async () => {
    if (!message.trim() || !user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      message: message.trim(),
      created_at: new Date().toISOString(),
      user: {
        full_name: user.user_metadata?.full_name || 'You',
        avatar_url: user.user_metadata?.avatar_url,
      },
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    // Add some mock messages for demo
    if (hasJoined && messages.length === 0) {
      setMessages([
        {
          id: '1',
          user_id: 'system',
          message: 'Welcome to the session! Feel free to ask questions.',
          created_at: new Date().toISOString(),
          user: { full_name: 'System', avatar_url: null },
        },
      ]);
    }
  }, [hasJoined]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-xl mb-4" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4 text-center">
        <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">Session not found</h2>
        <p className="text-muted-foreground mb-4">This session may have ended or doesn't exist.</p>
        <Button onClick={() => navigate('/live')}>Back to Live Sessions</Button>
      </div>
    );
  }

  const isLive = session.status === 'live';

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/live')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isLive && (
              <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                <span className="h-2 w-2 rounded-full bg-white mr-1 inline-block" />
                LIVE
              </Badge>
            )}
            <h1 className="text-xl font-bold font-heading">{session.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {session.participant_count || 0} watching
            </span>
            {session.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {session.duration_minutes} min
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Area */}
        <div className="lg:col-span-2">
          <Card className="border border-border/50 bg-card/50 overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
              {isLive ? (
                <div className="text-center">
                  <Video className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Live stream would appear here</p>
                </div>
              ) : (
                <div className="text-center">
                  <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Session has not started yet</p>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{session.description}</p>
              
              {/* Expert info */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={(session.expert as any)?.avatar_url} />
                  <AvatarFallback>{(session.expert as any)?.full_name?.charAt(0) || 'E'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{(session.expert as any)?.full_name || 'Expert'}</p>
                  <p className="text-xs text-muted-foreground">Host</p>
                </div>
                {!hasJoined && (
                  <Button 
                    onClick={handleJoin} 
                    disabled={isJoining}
                    className="ml-auto bg-primary text-primary-foreground"
                  >
                    {isJoining ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Join Session'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <Card className="border border-border/50 bg-card/50 h-[500px] flex flex-col">
            <CardHeader className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">Live Chat</span>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && !hasJoined && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Join the session to participate in chat
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={msg.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {msg.user?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{msg.user?.full_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground break-words">{msg.message}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {hasJoined && (
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-secondary/50"
                  />
                  <Button onClick={sendMessage} disabled={!message.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveSession;
