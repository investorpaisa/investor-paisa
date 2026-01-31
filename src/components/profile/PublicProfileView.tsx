import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, GraduationCap, Award, Target, MapPin, Calendar,
  TrendingUp, AlertCircle, UserPlus, UserMinus, Mail, ChevronDown,
  Linkedin, Twitter, Instagram, Globe
} from 'lucide-react';
import { useToggleFollow, useIsFollowing } from '@/hooks/useFollows';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface PublicProfileViewProps {
  profileId: string;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({ profileId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', profileId],
    queryFn: async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId);
      let query = supabase.from('profiles_public').select('*');
      
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

  // Fetch experiences (if privacy allows)
  const { data: experiences } = useQuery({
    queryKey: ['public-experiences', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !(profile as any).privacy_experience) return [];
      
      const { data, error } = await supabase
        .from('user_experiences')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_year', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && (profile as any).privacy_experience !== false,
  });

  // Fetch education (if privacy allows)
  const { data: educations } = useQuery({
    queryKey: ['public-educations', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !(profile as any).privacy_education) return [];
      
      const { data, error } = await supabase
        .from('user_educations')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_year', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && (profile as any).privacy_education !== false,
  });

  // Fetch certifications (if privacy allows)
  const { data: certifications } = useQuery({
    queryKey: ['public-certifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !(profile as any).privacy_certifications) return [];
      
      const { data, error } = await supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('issue_year', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && (profile as any).privacy_certifications !== false,
  });

  // Fetch recent activity (posts)
  const { data: recentPosts } = useQuery({
    queryKey: ['public-posts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, created_at, type')
        .eq('author_id', profile.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data || [];
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="border border-border/50">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
        </CardContent>
      </Card>
    );
  }

  const goals = (profile as any).goals || [];
  const privacyExperience = (profile as any).privacy_experience !== false;
  const privacyEducation = (profile as any).privacy_education !== false;
  const privacyCertifications = (profile as any).privacy_certifications !== false;

  const TruncatedText: React.FC<{ text: string; lines?: number }> = ({ text, lines = 5 }) => {
    const [expanded, setExpanded] = React.useState(false);
    
    return (
      <div>
        <p className={`text-sm text-muted-foreground ${!expanded ? `line-clamp-${lines}` : ''}`}>
          {text}
        </p>
        {text.length > 200 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-primary text-xs mt-1 hover:underline"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Summary Widget */}
      <Card className="border border-border/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-4">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {profile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-left">{profile.full_name || 'Anonymous'}</h1>
                {profile.is_verified && <TrendingUp className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username || 'user'}</p>
              {profile.headline && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {profile.headline}
                </p>
              )}
              
              <div className="flex gap-2 mt-3">
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
                <Button variant="outline" size="sm" className="h-8">
                  <Mail className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Bio */}
      {profile.bio && (
        <Card className="border border-border/50">
          <CardContent className="p-4 text-left">
            <TruncatedText text={profile.bio} />
          </CardContent>
        </Card>
      )}

      {/* 3. Goals */}
      {goals.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-left">
              <Target className="mr-2 h-4 w-4 text-primary" />
              Financial Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {goals.map((goal: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {goal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Activity - Truncated with View All */}
      {recentPosts && recentPosts.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-left">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div 
              className="p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/post/${recentPosts[0].id}`)}
            >
              <Badge variant="outline" className="text-[10px] capitalize mb-1">
                {recentPosts[0].type || 'post'}
              </Badge>
              <p className="text-sm line-clamp-1">{recentPosts[0].title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(recentPosts[0].created_at), { addSuffix: true })}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 text-xs text-primary"
              onClick={() => navigate(`/profile/${profile.username}`)}
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 5. Experience - if privacy allows */}
      {privacyExperience && experiences && experiences.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-left">
              <Briefcase className="mr-2 h-4 w-4 text-primary" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {experiences.slice(0, 1).map((exp: any) => (
              <div key={exp.id} className="text-left">
                <p className="font-medium text-sm">{exp.title}</p>
                <p className="text-xs text-muted-foreground">{exp.company}</p>
                <p className="text-xs text-muted-foreground">
                  {exp.start_year} - {exp.is_current ? 'Present' : exp.end_year}
                </p>
              </div>
            ))}
            {experiences.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-primary"
                onClick={() => navigate(`/profile/${profile.username}`)}
              >
                View All ({experiences.length})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. Education - if privacy allows */}
      {privacyEducation && educations && educations.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-left">
              <GraduationCap className="mr-2 h-4 w-4 text-primary" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {educations.slice(0, 1).map((edu: any) => (
              <div key={edu.id} className="text-left">
                <p className="font-medium text-sm">{edu.school}</p>
                <p className="text-xs text-muted-foreground">
                  {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                </p>
              </div>
            ))}
            {educations.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-primary"
                onClick={() => navigate(`/profile/${profile.username}`)}
              >
                View All ({educations.length})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 7. Certifications - if privacy allows */}
      {privacyCertifications && certifications && certifications.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-left">
              <Award className="mr-2 h-4 w-4 text-primary" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {certifications.slice(0, 1).map((cert: any) => (
              <div key={cert.id} className="text-left">
                <p className="font-medium text-sm">{cert.name}</p>
                <p className="text-xs text-muted-foreground">{cert.issuing_organization}</p>
              </div>
            ))}
            {certifications.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-primary"
                onClick={() => navigate(`/profile/${profile.username}`)}
              >
                View All ({certifications.length})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 8. Social Icons */}
      {(profile.linkedin_url || profile.twitter_url || profile.instagram_url || profile.website) && (
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <div className="flex justify-center gap-4">
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {profile.twitter_url && (
                <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {profile.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
