import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Clock, Users, AlertCircle, Calendar, TrendingUp, Video } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  status: 'scheduled' | 'live' | 'ended';
  is_free: boolean;
  price: number | null;
  participant_count: number | null;
  max_participants: number | null;
  topics: string[] | null;
  cover_url: string | null;
  duration_minutes: number | null;
  expert: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
}

// Skeleton loader
const LiveSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="border border-border/50 bg-card/50">
        <CardHeader className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Empty state
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Video className="h-16 w-16 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium mb-2">No live sessions scheduled</h3>
    <p className="text-muted-foreground text-sm max-w-sm mb-4">
      Check back later for upcoming live sessions with financial experts.
    </p>
  </div>
);

// Session Card
const SessionCard: React.FC<{ session: LiveSession }> = ({ session }) => {
  const navigate = useNavigate();
  const isLive = session.status === 'live';
  const isScheduled = session.status === 'scheduled';

  const handleJoin = () => {
    navigate(`/live/${session.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border ${isLive ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-card/50'} hover:shadow-lg transition-all cursor-pointer`}>
        <CardHeader className="p-4">
          <div className="flex items-start gap-4">
            {session.cover_url ? (
              <img src={session.cover_url} alt={session.title} className="h-20 w-28 rounded-xl object-cover" />
            ) : (
              <div className="h-20 w-28 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Video className="h-8 w-8 text-primary/50" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isLive && (
                  <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-white mr-1 inline-block" />
                    LIVE
                  </Badge>
                )}
                {session.is_free && (
                  <Badge variant="secondary" className="text-xs">Free</Badge>
                )}
                {session.price && !session.is_free && (
                  <Badge variant="outline" className="text-xs">₹{session.price}</Badge>
                )}
              </div>
              <h3 className="font-medium text-base line-clamp-2 mb-1">{session.title}</h3>
              
              {/* Expert info */}
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={session.expert?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{session.expert?.full_name?.charAt(0) || 'E'}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {session.expert?.full_name || 'Expert'}
                </span>
                {session.expert?.is_verified && (
                  <TrendingUp className="h-3 w-3 text-primary" />
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {session.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{session.description}</p>
          )}
          
          {/* Topics */}
          {session.topics && session.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {session.topics.slice(0, 3).map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {isLive ? (
                  <Play className="h-3 w-3 text-destructive" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {isLive 
                  ? 'Live now' 
                  : format(new Date(session.start_time), 'MMM d, h:mm a')
                }
              </span>
              {session.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.duration_minutes}m
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {session.participant_count || 0}
                {session.max_participants && `/${session.max_participants}`}
              </span>
            </div>

            <Button
              size="sm"
              onClick={handleJoin}
              className={isLive ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}
            >
              {isLive ? 'Join Now' : 'Register'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Live: React.FC = () => {
  const { data: sessions, isLoading, error } = useQuery<LiveSession[]>({
    queryKey: ['live-sessions'],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lives?status=scheduled,live`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    staleTime: 30000,
  });

  // Separate live and scheduled sessions
  const liveSessions = sessions?.filter(s => s.status === 'live') || [];
  const scheduledSessions = sessions?.filter(s => s.status === 'scheduled') || [];

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading mb-2">Live Sessions</h1>
        <p className="text-muted-foreground">
          Join live sessions with financial experts and learn in real-time.
        </p>
      </div>

      {isLoading && <LiveSkeleton />}

      {error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load sessions</h3>
          <p className="text-muted-foreground text-sm mb-4">Please try again later.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && sessions && sessions.length === 0 && <EmptyState />}

      {!isLoading && !error && sessions && sessions.length > 0 && (
        <div className="space-y-6">
          {/* Live Now */}
          {liveSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Live Now
              </h2>
              <div className="space-y-4">
                {liveSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {scheduledSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">Upcoming</h2>
              <div className="space-y-4">
                {scheduledSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Live;
