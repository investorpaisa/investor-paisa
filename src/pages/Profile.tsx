import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, Mail, MessageCircle, Calendar, Briefcase, 
  MapPin, Award, TrendingUp, Target, AlertCircle, UserPlus, UserMinus, CheckCircle2, MoreHorizontal, LogOut, Bookmark, ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToggleFollow, useIsFollowing } from '@/hooks/useFollows';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useUserTier } from '@/hooks/useUserTier';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile } = useAuth();
  const { tier, tierLabel } = useUserTier();
  
  // Determine if we're viewing own profile or someone else's
  const isOwnProfile = !id || id === user?.id || id === currentUserProfile?.username;
  const profileId = isOwnProfile ? user?.id : id;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      // Navigate to feed (now the logged-out landing) after logout
      navigate('/feed', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Error logging out");
    }
  };

  // Fetch profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      let query = supabase.from('profiles_public').select('*');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId);
      
      if (isUUID) {
        query = query.eq('id', profileId);
      } else {
        query = query.eq('username', profileId);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  // Fetch user's posts (questions + opinions)
  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('posts')
        .select('id, title, body, like_count, comment_count, created_at, type')
        .eq('author_id', profile.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch user's answers
  const { data: userAnswers, isLoading: answersLoading } = useQuery({
    queryKey: ['user-answers', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('answers')
        .select(`
          id, body_simple, body_detailed, created_at, upvote_count, is_accepted,
          posts!inner(id, title)
        `)
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch user's comments
  const { data: userComments, isLoading: commentsLoading } = useQuery({
    queryKey: ['user-comments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('comments')
        .select('id, body, created_at, like_count, entity_id, entity_type')
        .eq('author_id', profile.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch user's bookmarks (saved items) with post details
  const { data: userBookmarks, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['user-bookmarks', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !isOwnProfile) return [];

      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('id, entity_id, entity_type, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!bookmarks) return [];

      // Fetch post details for post bookmarks
      const postIds = bookmarks.filter(b => b.entity_type === 'post').map(b => b.entity_id);
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, body, type, like_count, comment_count, created_at')
        .in('id', postIds);

      const postsMap = new Map(posts?.map(p => [p.id, p]) || []);
      
      return bookmarks.map(b => ({
        ...b,
        post: b.entity_type === 'post' ? postsMap.get(b.entity_id) : null,
      }));
    },
    enabled: !!profile?.id && isOwnProfile,
  });

  // Fetch expert profile if exists
  const { data: expertProfile } = useQuery({
    queryKey: ['expert-profile', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('expert_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Follow functionality
  const { data: isFollowing } = useIsFollowing(profile?.id);
  const toggleFollow = useToggleFollow();

  const handleFollow = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.id) {
      toggleFollow.mutate(profile.id);
    }
  };

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

  // Safe access to profile fields
  const profileCompletenessScore = (profile as any).profile_completeness_score || 0;
  const profileTier = (profile as any).tier || tier;
  const profileGoals = (profile as any).goals || [];

  const getTierColor = (t: string) => {
    switch (t) {
      case 'expert': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'influencer': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'verified_user': return 'bg-primary/10 text-primary border-primary/30';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4 space-y-4">
      {/* Profile Summary Widget */}
      <Card className="border border-border/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl">{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold text-left">{profile.full_name || 'Anonymous'}</h1>
                    {profile.is_verified && (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    )}
                    {isOwnProfile && profileTier !== 'guest' && (
                      <Badge variant="outline" className={`text-[10px] h-5 ${getTierColor(profileTier)}`}>
                        {tierLabel}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                    <span>@{profile.username || 'user'}</span>
                    {profile.headline && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate">
                          <Briefcase className="h-3 w-3" /> {profile.headline}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {isOwnProfile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/u/${profile.username}`)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Public Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFollow}
                      variant={isFollowing ? 'outline' : 'default'}
                      disabled={toggleFollow.isPending}
                      size="sm"
                      className="h-8 text-xs"
                    >
                      {isFollowing ? (
                        <><UserMinus className="mr-1 h-3 w-3" /> Unfollow</>
                      ) : (
                        <><UserPlus className="mr-1 h-3 w-3" /> Follow</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-3 space-y-3">
                {/* Bio - 3 lines max then truncate */}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3 text-left">{profile.bio}</p>
                )}
                
                {/* Goals - 2 lines max then truncate */}
                {profileGoals.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1 line-clamp-2">
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
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-3 w-3" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" /> Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex gap-4 pt-1">
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

                {/* Profile Completeness - Only on own profile */}
                {isOwnProfile && (
                  <div className="mt-3 p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">Profile Completeness</span>
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {profileCompletenessScore}%
                      </span>
                    </div>
                    <Progress value={profileCompletenessScore} className="h-1.5" />
                    {profileCompletenessScore < 100 && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Complete your profile to unlock more features
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs: Posts | Answers | Comments | Saved */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start border-b border-border/50 rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="posts" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-2.5 text-xs sm:text-sm"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger 
            value="answers" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-2.5 text-xs sm:text-sm"
          >
            Answers
          </TabsTrigger>
          <TabsTrigger 
            value="comments" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-2.5 text-xs sm:text-sm"
          >
            Comments
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger 
              value="saved" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-2.5 text-xs sm:text-sm"
            >
              Saved
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Posts Tab */}
        <TabsContent value="posts" className="pt-4 space-y-3">
          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-border/50">
                  <CardContent className="p-3">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userPosts && userPosts.length > 0 ? (
            userPosts.map((post) => (
              <Card 
                key={post.id} 
                className="border border-border/50 cursor-pointer hover:border-primary/30 transition-colors" 
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <CardContent className="p-3 sm:p-4 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {post.type || 'post'}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm line-clamp-1">{post.title || 'Untitled'}</h4>
                  {post.body && (
                    <p className="text-muted-foreground text-xs line-clamp-2 mt-1">{post.body}</p>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-3">
                      <span>{post.like_count || 0} likes</span>
                      <span className="flex items-center">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        {post.comment_count || 0}
                      </span>
                    </div>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border border-border/50">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium mb-1">No posts yet</h3>
                <p className="text-xs text-muted-foreground">
                  {isOwnProfile ? "You haven't created any posts yet." : "No posts from this user."}
                </p>
                {isOwnProfile && (
                  <Button className="mt-3" size="sm" onClick={() => navigate('/feed')}>
                    Create Your First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Answers Tab */}
        <TabsContent value="answers" className="pt-4 space-y-3">
          {answersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="border border-border/50">
                  <CardContent className="p-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userAnswers && userAnswers.length > 0 ? (
            userAnswers.map((answer: any) => (
              <Card 
                key={answer.id} 
                className="border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/post/${answer.posts?.id}`)}
              >
                <CardContent className="p-3 sm:p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">
                    Answered: {answer.posts?.title || 'Unknown post'}
                  </p>
                  <p className="text-sm line-clamp-2">
                    {answer.body_simple || answer.body_detailed || 'No content'}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                      {answer.is_accepted && (
                        <Badge className="bg-primary/20 text-primary text-[10px]">Accepted</Badge>
                      )}
                      <span>{answer.upvote_count || 0} upvotes</span>
                    </div>
                    <span>{formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border border-border/50">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium mb-1">No answers yet</h3>
                <p className="text-xs text-muted-foreground">
                  {isOwnProfile ? "You haven't answered any questions yet." : "No answers from this user."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Comments Tab */}
        <TabsContent value="comments" className="pt-4 space-y-3">
          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="border border-border/50">
                  <CardContent className="p-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userComments && userComments.length > 0 ? (
            userComments.map((comment) => (
              <Card 
                key={comment.id} 
                className="border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => comment.entity_type === 'post' && navigate(`/post/${comment.entity_id}`)}
              >
                <CardContent className="p-3 sm:p-4 text-left">
                  <p className="text-sm line-clamp-2">{comment.body}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{comment.like_count || 0} likes</span>
                    <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border border-border/50">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium mb-1">No comments yet</h3>
                <p className="text-xs text-muted-foreground">
                  {isOwnProfile ? "You haven't commented on anything yet." : "No comments from this user."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Saved Tab - Only for own profile */}
        {isOwnProfile && (
          <TabsContent value="saved" className="pt-4 space-y-3">
            {bookmarksLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="border border-border/50">
                    <CardContent className="p-3">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userBookmarks && userBookmarks.length > 0 ? (
              userBookmarks.map((bookmark: any) => (
                <Card 
                  key={bookmark.id} 
                  className="border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => {
                    if (bookmark.entity_type === 'post') {
                      navigate(`/post/${bookmark.entity_id}`);
                    }
                  }}
                >
                  <CardContent className="p-3 sm:p-4 text-left">
                    {bookmark.post ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {bookmark.post.type || 'post'}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm line-clamp-1">{bookmark.post.title || 'Untitled'}</h4>
                        {bookmark.post.body && (
                          <p className="text-muted-foreground text-xs line-clamp-2 mt-1">{bookmark.post.body}</p>
                        )}
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <div className="flex items-center gap-3">
                            <span>{bookmark.post.like_count || 0} likes</span>
                            <span className="flex items-center">
                              <MessageCircle className="mr-1 h-3 w-3" />
                              {bookmark.post.comment_count || 0}
                            </span>
                          </div>
                          <span>{formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Bookmark className="h-4 w-4 text-primary" />
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {bookmark.entity_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Saved {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border border-border/50">
                <CardContent className="p-8 text-center">
                  <Bookmark className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-sm font-medium mb-1">No saved items</h3>
                  <p className="text-xs text-muted-foreground">
                    Items you bookmark will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Expert Credentials - if available */}
      {expertProfile && (
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center text-left">
              <Award className="mr-2 h-4 w-4 text-primary" />
              Expert Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            {expertProfile.credentials && (
              <div>
                <h4 className="font-medium text-xs mb-1">Credentials</h4>
                <p className="text-muted-foreground text-sm">{expertProfile.credentials}</p>
              </div>
            )}
            {expertProfile.firm_name && (
              <div>
                <h4 className="font-medium text-xs mb-1">Firm</h4>
                <p className="text-muted-foreground text-sm">{expertProfile.firm_name}</p>
              </div>
            )}
            {expertProfile.specializations && expertProfile.specializations.length > 0 && (
              <div>
                <h4 className="font-medium text-xs mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {expertProfile.specializations.map((spec: string, index: number) => (
                    <Badge key={index} className="bg-primary/10 text-primary text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {expertProfile.years_experience && (
              <div>
                <h4 className="font-medium text-xs mb-1">Experience</h4>
                <p className="text-muted-foreground text-sm">{expertProfile.years_experience} years</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
