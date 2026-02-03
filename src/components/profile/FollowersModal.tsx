import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useIsFollowing, useToggleFollow } from '@/hooks/useFollows';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  username: string;
}

interface FollowUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  headline: string | null;
  is_verified: boolean | null;
}

const FollowUserItem: React.FC<{
  user: FollowUser;
  onNavigate: () => void;
}> = ({ user, onNavigate }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { data: isFollowing, isLoading: checkingFollow } = useIsFollowing(user.id);
  const toggleFollow = useToggleFollow();
  
  const isOwnProfile = currentUser?.id === user.id;

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    toggleFollow.mutate(user.id);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors"
      onClick={() => {
        onNavigate();
        navigate(`/u/${user.username}`);
      }}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.full_name || 'Anonymous'}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.username || 'user'}</p>
      </div>
      
      {!isOwnProfile && currentUser && (
        <Button
          size="sm"
          variant={isFollowing ? 'outline' : 'default'}
          onClick={handleFollowClick}
          disabled={checkingFollow || toggleFollow.isPending}
          className="h-8 text-xs shrink-0"
        >
          {toggleFollow.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isFollowing ? (
            <>
              <UserCheck className="h-3 w-3 mr-1" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="h-3 w-3 mr-1" />
              Follow
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  username,
}) => {
  const { data: users, isLoading } = useQuery({
    queryKey: [type === 'followers' ? 'user-followers-list' : 'user-following-list', userId],
    queryFn: async () => {
      if (type === 'followers') {
        // Get all users who follow this user
        const { data: follows, error } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId);
        
        if (error) throw error;
        if (!follows || follows.length === 0) return [];

        const followerIds = follows.map(f => f.follower_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, headline, is_verified')
          .in('id', followerIds);
        
        return (profiles || []) as FollowUser[];
      } else {
        // Get all users this user follows
        const { data: follows, error } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        
        if (error) throw error;
        if (!follows || follows.length === 0) return [];

        const followingIds = follows.map(f => f.following_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, headline, is_verified')
          .in('id', followingIds);
        
        return (profiles || []) as FollowUser[];
      }
    },
    enabled: isOpen && !!userId,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-3 p-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-1">
              {users.map(user => (
                <FollowUserItem 
                  key={user.id} 
                  user={user} 
                  onNavigate={onClose}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {type === 'followers' 
                  ? `@${username} has no followers yet`
                  : `@${username} isn't following anyone yet`
                }
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;
