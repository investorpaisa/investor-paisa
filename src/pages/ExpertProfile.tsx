import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, TrendingUp, Users, Star, Calendar, MessageCircle, 
  Award, Briefcase, CheckCircle, ExternalLink, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUIStore } from '@/stores/uiStore';
import { toast } from 'sonner';

const ExpertProfile: React.FC = () => {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAskSheet } = useUIStore();
  const queryClient = useQueryClient();

  // Fetch expert profile with expert details
  const { data: expert, isLoading } = useQuery({
    queryKey: ['expert', expertId],
    queryFn: async () => {
      if (!expertId) return null;

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', expertId)
        .single();

      if (profileError) throw profileError;

      // Fetch expert profile details
      const { data: expertProfile } = await supabase
        .from('expert_profiles')
        .select('*')
        .eq('user_id', expertId)
        .single();

      // Fetch recent posts
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, body, type, created_at, like_count')
        .eq('author_id', expertId)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        ...profile,
        expertDetails: expertProfile,
        recentPosts: posts || [],
      };
    },
    enabled: !!expertId,
  });

  // Check if following
  const { data: isFollowing } = useQuery({
    queryKey: ['following', expertId, user?.id],
    queryFn: async () => {
      if (!user?.id || !expertId) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', expertId)
        .single();
      return !!data;
    },
    enabled: !!user?.id && !!expertId,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !expertId) throw new Error('Not authenticated');

      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', expertId);
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: expertId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', expertId] });
      queryClient.invalidateQueries({ queryKey: ['expert', expertId] });
      toast.success(isFollowing ? 'Unfollowed' : 'Now tracking');
    },
    onError: () => {
      toast.error('Action failed');
    },
  });

  const handleFollow = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    followMutation.mutate();
  };

  const handleAskQuestion = () => {
    openAskSheet();
    // Context could be passed to prefill expert mention
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card className="border border-border/50 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4 text-center">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">Expert not found</h2>
        <Button onClick={() => navigate('/discover')}>Discover Experts</Button>
      </div>
    );
  }

  const expertDetails = expert.expertDetails;

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Profile Card */}
        <Card className="border border-border/50 bg-card/50 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary" />
          
          <CardContent className="p-6 -mt-12">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                <AvatarImage src={expert.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {expert.full_name?.charAt(0) || 'E'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">{expert.full_name}</h1>
                  {expert.is_verified && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                  {expert.is_expert && (
                    <Badge className="bg-primary/20 text-primary">Expert</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{expert.username}</p>
                {expert.headline && (
                  <p className="text-sm mt-1">{expert.headline}</p>
                )}
              </div>

              <div className="flex gap-2 sm:self-start">
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                  className="gap-2"
                >
                  {followMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  {isFollowing ? 'Tracking' : 'Track'}
                </Button>
                <Button variant="outline" onClick={handleAskQuestion} className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Ask
                </Button>
              </div>
            </div>

            {/* Bio */}
            {expert.bio && (
              <p className="mt-4 text-sm text-muted-foreground">{expert.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-lg font-bold">{expert.followers_count || 0}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-lg font-bold">{expert.posts_count || 0}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              {expertDetails?.rating && (
                <div>
                  <p className="text-lg font-bold flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {expertDetails.rating.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              )}
              {expertDetails?.session_count && (
                <div>
                  <p className="text-lg font-bold">{expertDetails.session_count}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expert Details */}
        {expertDetails && (
          <Card className="border border-border/50 bg-card/50">
            <CardHeader className="p-4 border-b border-border/50">
              <h3 className="font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                Credentials
              </h3>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {expertDetails.credentials && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Credentials</p>
                    <p className="text-sm text-muted-foreground">{expertDetails.credentials}</p>
                  </div>
                </div>
              )}
              {expertDetails.firm_name && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Firm</p>
                    <p className="text-sm text-muted-foreground">{expertDetails.firm_name}</p>
                  </div>
                </div>
              )}
              {expertDetails.years_experience && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Experience</p>
                    <p className="text-sm text-muted-foreground">{expertDetails.years_experience} years</p>
                  </div>
                </div>
              )}
              {expertDetails.specializations && expertDetails.specializations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {expertDetails.specializations.map((spec: string) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {expertDetails.sebi_registered && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" />
                  SEBI Registered
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Posts */}
        {expert.recentPosts && expert.recentPosts.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Recent Posts</h3>
            <div className="space-y-3">
              {expert.recentPosts.map((post: any) => (
                <Card 
                  key={post.id} 
                  className="border border-border/50 bg-card/50 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2 capitalize">
                      {post.type}
                    </Badge>
                    {post.title && (
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">{post.title}</h4>
                    )}
                    {post.body && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ExpertProfile;
