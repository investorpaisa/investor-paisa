
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SystemCard, SystemButton, Typography } from '@/components/ui/design-system';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToggleFollow, useFollowing } from '@/hooks/useFollows';
import { useNavigate } from 'react-router-dom';

export const NetworkSuggestions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toggleFollow = useToggleFollow();
  const { data: following } = useFollowing();

  // Fetch suggested profiles (users the current user doesn't follow)
  const { data: suggestions, isLoading, error } = useQuery({
    queryKey: ['network-suggestions', user?.id],
    queryFn: async () => {
      // Get profiles that the user doesn't follow
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, followers_count')
        .neq('id', user?.id || '')
        .order('followers_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  // Filter out users already being followed
  const filteredSuggestions = suggestions?.filter(
    s => !following?.some(f => f.following_id === s.id)
  ) || [];

  const handleFollow = (profileId: string) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    toggleFollow.mutate(profileId);
  };

  const handleViewProfile = (username: string | null) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  if (isLoading) {
    return (
      <SystemCard className="p-4">
        <Typography.H3 className="font-semibold text-black mb-4">
          People you may know
        </Typography.H3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      </SystemCard>
    );
  }

  if (error) {
    return (
      <SystemCard className="p-4">
        <div className="flex flex-col items-center justify-center py-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <Typography.Small className="text-muted-foreground">
            Failed to load suggestions
          </Typography.Small>
        </div>
      </SystemCard>
    );
  }

  if (filteredSuggestions.length === 0) {
    return (
      <SystemCard className="p-4">
        <Typography.H3 className="font-semibold text-black mb-4">
          People you may know
        </Typography.H3>
        <div className="text-center py-4">
          <Typography.Small className="text-muted-foreground">
            No suggestions available right now
          </Typography.Small>
        </div>
      </SystemCard>
    );
  }

  return (
    <SystemCard className="p-4">
      <Typography.H3 className="font-semibold text-black mb-4">
        People you may know
      </Typography.H3>
      
      <div className="space-y-4">
        {filteredSuggestions.slice(0, 3).map((person) => (
          <div key={person.id} className="flex items-start space-x-3">
            <Avatar 
              className="w-12 h-12 cursor-pointer"
              onClick={() => handleViewProfile(person.username)}
            >
              <AvatarImage src={person.avatar_url || undefined} alt={person.full_name || 'User'} />
              <AvatarFallback>
                {person.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Typography.Body 
                className="font-medium text-black truncate cursor-pointer hover:underline"
                onClick={() => handleViewProfile(person.username)}
              >
                {person.full_name || 'Anonymous'}
              </Typography.Body>
              <Typography.Small className="text-gray-600 line-clamp-2">
                {person.headline || 'Member'}
              </Typography.Small>
              <Typography.Small className="text-gray-500 mt-1">
                {person.followers_count || 0} followers
              </Typography.Small>
              <SystemButton
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => handleFollow(person.id)}
                disabled={toggleFollow.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Connect
              </SystemButton>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="w-full mt-4 text-sm text-black font-medium hover:bg-gray-50 p-2 rounded"
        onClick={() => navigate('/discover')}
      >
        View all suggestions
      </button>
    </SystemCard>
  );
};
