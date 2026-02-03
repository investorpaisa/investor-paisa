import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, MapPin, Calendar, TrendingUp, Target, AlertCircle, ExternalLink,
  MessageCircle, UserPlus, UserCheck, Briefcase, GraduationCap, Award, Send, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useIsFollowing, useToggleFollow } from '@/hooks/useFollows';
import { useCreateConversation } from '@/hooks/useSendMessage';
import { UnfollowConfirmModal } from '@/components/profile/UnfollowConfirmModal';
import { toast } from 'sonner';

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [bioExpanded, setBioExpanded] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [messageText, setMessageText] = useState('');

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

  // Fetch full profile for privacy settings
  const { data: fullProfile } = useQuery({
    queryKey: ['public-profile-full', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_experience, privacy_education, privacy_certifications, privacy_skills')
        .eq('id', profile.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Check if viewing own public profile
  const isOwnProfile = user?.id === profile?.id;

  // Follow status and toggle
  const { data: isFollowing, isLoading: followLoading } = useIsFollowing(profile?.id);
  const toggleFollow = useToggleFollow();
  const createConversation = useCreateConversation();

  // Fetch user's experience
  const { data: experiences } = useQuery({
    queryKey: ['public-profile-experience', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_experiences')
        .select('*')
        .eq('user_id', profile.id)
        .order('is_current', { ascending: false })
        .order('start_year', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.id && fullProfile?.privacy_experience !== false,
  });

  // Fetch user's education
  const { data: educations } = useQuery({
    queryKey: ['public-profile-education', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_educations')
        .select('*')
        .eq('user_id', profile.id)
        .order('is_current', { ascending: false })
        .order('start_year', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.id && fullProfile?.privacy_education !== false,
  });

  // Fetch user's certifications
  const { data: certifications } = useQuery({
    queryKey: ['public-profile-certifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('issue_year', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.id && fullProfile?.privacy_certifications !== false,
  });

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

  const handleFollowClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (isFollowing) {
      setShowUnfollowModal(true);
    } else {
      toggleFollow.mutate(profile!.id);
    }
  };

  const handleConfirmUnfollow = () => {
    toggleFollow.mutate(profile!.id, {
      onSuccess: () => {
        setShowUnfollowModal(false);
      },
    });
  };

  const handleMessageClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!isFollowing) {
      toast.error('You need to follow this user before you can message them');
      return;
    }
    
    setShowMessageInput(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      await createConversation.mutateAsync({
        targetUserId: profile!.id,
        initialMessage: messageText.trim(),
      });
      setMessageText('');
      setShowMessageInput(false);
      navigate('/inbox');
    } catch (error) {
      // Error is handled by the hook
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

  const profileGoals = (profile as any).goals || [];
  const bioNeedsTruncation = profile.bio && profile.bio.length > 150;

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
              
              {/* Bio with See more/less */}
              {profile.bio && (
                <div className="mb-3">
                  <p className={`text-sm text-muted-foreground text-left ${!bioExpanded && bioNeedsTruncation ? 'line-clamp-3' : ''}`}>
                    {profile.bio}
                  </p>
                  {bioNeedsTruncation && (
                    <button 
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="text-primary text-sm mt-1 hover:underline"
                    >
                      {bioExpanded ? 'See less' : 'See more'}
                    </button>
                  )}
                </div>
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
              
              <div className="flex gap-4 mb-4">
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

              {/* Follow/Message buttons - only show for other users */}
              {!isOwnProfile && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleFollowClick}
                    disabled={followLoading || toggleFollow.isPending}
                    variant={isFollowing ? 'outline' : 'default'}
                    size="sm"
                    className="gap-2"
                  >
                    {toggleFollow.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleMessageClick}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={!isFollowing}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              )}

              {/* Message input */}
              {showMessageInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2"
                >
                  <Textarea
                    placeholder="Write a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowMessageInput(false);
                        setMessageText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || createConversation.isPending}
                      className="gap-2"
                    >
                      {createConversation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Section */}
      {fullProfile?.privacy_experience !== false && experiences && experiences.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id} className="p-3 rounded-lg bg-secondary/30">
                <h4 className="font-medium text-sm">{exp.title}</h4>
                <p className="text-xs text-muted-foreground">{exp.company}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {exp.start_month && `${exp.start_month}/`}{exp.start_year} - {exp.is_current ? 'Present' : `${exp.end_month && `${exp.end_month}/`}${exp.end_year}`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education Section */}
      {fullProfile?.privacy_education !== false && educations && educations.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {educations.map((edu) => (
              <div key={edu.id} className="p-3 rounded-lg bg-secondary/30">
                <h4 className="font-medium text-sm">{edu.school}</h4>
                <p className="text-xs text-muted-foreground">{edu.degree}{edu.field_of_study && `, ${edu.field_of_study}`}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {edu.start_year} - {edu.is_current ? 'Present' : edu.end_year}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications Section */}
      {fullProfile?.privacy_certifications !== false && certifications && certifications.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {certifications.map((cert) => (
              <div key={cert.id} className="p-3 rounded-lg bg-secondary/30">
                <h4 className="font-medium text-sm">{cert.name}</h4>
                <p className="text-xs text-muted-foreground">{cert.issuing_organization}</p>
                {cert.issue_year && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Issued {cert.issue_month && `${cert.issue_month}/`}{cert.issue_year}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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

      {/* Unfollow Confirmation Modal */}
      <UnfollowConfirmModal
        isOpen={showUnfollowModal}
        onClose={() => setShowUnfollowModal(false)}
        onConfirm={handleConfirmUnfollow}
        username={profile.username || 'user'}
        isLoading={toggleFollow.isPending}
      />
    </div>
  );
};

export default PublicProfile;
