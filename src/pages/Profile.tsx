
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
import { 
  Edit, Mail, Users, MessageCircle, Calendar, Briefcase, 
  MapPin, Award, TrendingUp, Shield, AlertCircle, UserPlus, UserMinus, LogOut
} from 'lucide-react';
import { useToggleFollow, useIsFollowing } from '@/hooks/useFollows';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile } = useAuth();
  
  // Determine if we're viewing own profile or someone else's
  const isOwnProfile = !id || id === user?.id || id === currentUserProfile?.username;
  const profileId = isOwnProfile ? user?.id : id;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate('/');
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

      // First try to find by ID, then by username
      let query = supabase.from('profiles').select('*');
      
      // Check if it's a UUID or username
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

  // Fetch user's posts
  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('posts')
        .select('id, title, body, like_count, comment_count, created_at')
        .eq('author_id', profile.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
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
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
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
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/feed')}>Go to Feed</Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.full_name || 'Anonymous User'}</h1>
                    {profile.is_verified && (
                      <TrendingUp className="h-5 w-5 text-primary" />
                    )}
                    {profile.is_expert && (
                      <Shield className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-muted-foreground">
                    <p>@{profile.username || 'user'}</p>
                    {profile.headline && (
                      <>
                        <p className="hidden sm:block">•</p>
                        <p className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" /> {profile.headline}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {isOwnProfile ? (
                  <Button variant="outline" className="md:self-start" onClick={() => navigate('/edit-profile')}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFollow}
                      variant={isFollowing ? 'outline' : 'default'}
                      disabled={toggleFollow.isPending}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="mr-2 h-4 w-4" /> Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" /> Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline">
                      <Mail className="mr-2 h-4 w-4" /> Message
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-3">
                {profile.bio && <p>{profile.bio}</p>}
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" /> Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex gap-6 pt-2">
                  <div>
                    <span className="font-bold">{profile.followers_count || 0}</span>
                    <span className="text-muted-foreground ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold">{profile.following_count || 0}</span>
                    <span className="text-muted-foreground ml-1">Following</span>
                  </div>
                  <div>
                    <span className="font-bold">{profile.posts_count || 0}</span>
                    <span className="text-muted-foreground ml-1">Posts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
          <TabsTrigger 
            value="posts" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
          >
            Posts
          </TabsTrigger>
          {profile.interests && profile.interests.length > 0 && (
            <TabsTrigger 
              value="interests" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
            >
              Interests
            </TabsTrigger>
          )}
          {expertProfile && (
            <TabsTrigger 
              value="credentials" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
            >
              Credentials
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="posts" className="pt-6 space-y-6">
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="pb-3">
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userPosts && userPosts.length > 0 ? (
            userPosts.map((post) => (
              <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/post/${post.id}`)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{post.title || 'Untitled Post'}</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  {post.body && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.body}</p>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{post.like_count || 0} likes</span>
                      <span className="flex items-center">
                        <MessageCircle className="mr-1 h-4 w-4" />
                        {post.comment_count || 0} comments
                      </span>
                    </div>
                    <div>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't posted anything yet."}
              </p>
              {isOwnProfile && (
                <Button className="mt-4" onClick={() => navigate('/feed')}>Create Your First Post</Button>
              )}
            </div>
          )}
        </TabsContent>
        
        {profile.interests && profile.interests.length > 0 && (
          <TabsContent value="interests" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <div 
                      key={index} 
                      className="bg-muted px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      <TrendingUp className="mr-1 h-4 w-4 text-primary" />
                      {interest}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {expertProfile && (
          <TabsContent value="credentials" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-primary" />
                  Expert Credentials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expertProfile.credentials && (
                    <div>
                      <h4 className="font-medium mb-2">Credentials</h4>
                      <p className="text-muted-foreground">{expertProfile.credentials}</p>
                    </div>
                  )}
                  {expertProfile.firm_name && (
                    <div>
                      <h4 className="font-medium mb-2">Firm</h4>
                      <p className="text-muted-foreground">{expertProfile.firm_name}</p>
                    </div>
                  )}
                  {expertProfile.specializations && expertProfile.specializations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {expertProfile.specializations.map((spec, index) => (
                          <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {expertProfile.years_experience && (
                    <div>
                      <h4 className="font-medium mb-2">Experience</h4>
                      <p className="text-muted-foreground">{expertProfile.years_experience} years</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Logout Button - Only visible on own profile */}
      {isOwnProfile && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
