import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, MapPin, Calendar, TrendingUp, Target, AlertCircle, ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch profile by username from public view
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      if (!username) return null;

      const { data, error } = await supabase
        .from('profiles_public')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  // Check if viewing own public profile
  const isOwnProfile = user?.id === profile?.id;

  // Fetch user's posts
  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['public-profile-posts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('posts')
        .select('id, title, body, like_count, comment_count, created_at, type')
        .eq('author_id', profile.id)
        .is('deleted_at', null)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4 space-y-4">
        <Card className="border border-border/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
              <div className="flex-1 space-y-3 w-full">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4">
        <Card className="border border-border/50">
          <CardContent className="p-8 sm:p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground text-sm mb-4">
              The profile you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate('/feed')} size="sm">Go to Feed</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const profileGoals = (profile as any).goals || [];

  return (
    <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4 space-y-4">
      {/* Own profile banner */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              You are viewing your public profile
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/profile')}
            className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Profile
          </Button>
        </motion.div>
      )}

      {/* Profile Summary */}
      <Card className="border border-border/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl">{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-lg sm:text-xl font-bold text-left">{profile.full_name || 'Anonymous'}</h1>
                {profile.is_verified && (
                  <TrendingUp className="h-4 w-4 text-primary" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">@{profile.username || 'user'}</p>
              
              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-muted-foreground line-clamp-3 text-left mb-3">{profile.bio}</p>
              )}
              
              {/* Goals */}
              {profileGoals.length > 0 && (
                <div className="flex items-start gap-2 mb-3">
                  <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {profileGoals.slice(0, 4).map((goal: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                    {profileGoals.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{profileGoals.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                {profile.location && (
                  <span className="flex items-center">
                    <MapPin className="mr-1 h-3 w-3" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" /> Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex gap-4">
                <div>
                  <span className="font-bold text-sm">{profile.followers_count || 0}</span>
                  <span className="text-muted-foreground text-xs ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-bold text-sm">{profile.following_count || 0}</span>
                  <span className="text-muted-foreground text-xs ml-1">Following</span>
                </div>
                <div>
                  <span className="font-bold text-sm">{profile.posts_count || 0}</span>
                  <span className="text-muted-foreground text-xs ml-1">Posts</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Section */}
      <Card className="border border-border/50">
        <CardContent className="p-4">
          <h2 className="text-base font-semibold mb-4">Recent Posts</h2>
          
          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : userPosts && userPosts.length > 0 ? (
            <div className="space-y-3">
              {userPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium line-clamp-1">{post.title || 'Untitled'}</h3>
                      {post.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.body}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{post.like_count || 0} likes</span>
                        <span>{post.comment_count || 0} comments</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                      {post.type}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No posts yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicProfile;