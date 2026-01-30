
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, TrendingUp, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToggleReaction, useUserReaction } from '@/hooks/useReactions';
import { useToggleBookmark, useIsBookmarked } from '@/hooks/useBookmarks';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string | null;
  body: string | null;
  type: string;
  created_at: string;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  author_id: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  headline: string | null;
  is_verified: boolean | null;
}

interface PostWithAuthor extends Post {
  author?: Profile | null;
}

// Individual post card with reaction hooks
const FeedPostCard: React.FC<{ post: PostWithAuthor; onProfileClick: (username: string | null) => void }> = ({ post, onProfileClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toggleReaction = useToggleReaction();
  const toggleBookmark = useToggleBookmark();
  
  const { data: userReactions } = useUserReaction(post.id, 'post');
  const { data: isBookmarked } = useIsBookmarked(post.id);
  
  const isLiked = userReactions?.some(r => r.reaction_type === 'like') || false;

  const handleLike = () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    toggleReaction.mutate({
      entityId: post.id,
      entityType: 'post',
      reactionType: 'like',
    });
  };

  const handleSave = () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    toggleBookmark.mutate({
      entityId: post.id,
      entityType: 'post',
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar 
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => onProfileClick(post.author?.username || null)}
            >
              <AvatarImage src={post.author?.avatar_url || undefined} alt={post.author?.full_name || 'User'} />
              <AvatarFallback>
                {post.author?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <h4 
                  className="font-medium hover:underline cursor-pointer"
                  onClick={() => onProfileClick(post.author?.username || null)}
                >
                  {post.author?.full_name || 'Anonymous'}
                </h4>
                {post.author?.is_verified && (
                  <span className="text-primary">
                    <TrendingUp className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="mr-2">@{post.author?.username || 'user'}</span>
                <span className="mr-2">•</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2 capitalize">
              {post.type}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Report content</DropdownMenuItem>
                <DropdownMenuItem>Hide posts from this user</DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>Copy link</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
        {post.title && <h3 className="text-lg font-medium mb-2">{post.title}</h3>}
        {post.body && <p className="text-muted-foreground text-sm whitespace-pre-wrap line-clamp-4">{post.body}</p>}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-1 ${isLiked ? 'text-primary' : ''}`}
            onClick={handleLike}
            disabled={toggleReaction.isPending}
          >
            <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
            <span>{post.like_count || 0}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/post/${post.id}`)}>
            <MessageSquare className="h-4 w-4" />
            <span>{post.comment_count || 0}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            <span>{post.share_count || 0}</span>
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className={isBookmarked ? 'text-primary' : ''}
          onClick={handleSave}
          disabled={toggleBookmark.isPending}
        >
          <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
        </Button>
      </CardFooter>
    </Card>
  );
};

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['feed-posts'],
    queryFn: async () => {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, title, body, type, created_at, like_count, comment_count, share_count, author_id')
        .eq('moderation_status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;
      if (!postsData || postsData.length === 0) return [];

      // Get unique author IDs
      const authorIds = [...new Set(postsData.map(p => p.author_id))];

      // Fetch profiles for authors
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .in('id', authorIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by ID
      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine posts with author profiles
      const postsWithAuthors: PostWithAuthor[] = postsData.map(post => ({
        ...post,
        author: profilesMap.get(post.author_id) || null,
      }));

      return postsWithAuthors;
    },
  });

  // Fetch following feed
  const { data: followingPosts, isLoading: followingLoading, error: followingError } = useQuery({
    queryKey: ['following-feed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get users I'm following
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;
      if (!follows || follows.length === 0) return [];

      const followingIds = follows.map(f => f.following_id);

      // Get posts from followed users
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, title, body, type, created_at, like_count, comment_count, share_count, author_id')
        .in('author_id', followingIds)
        .eq('moderation_status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;
      if (!postsData || postsData.length === 0) return [];

      // Fetch profiles
      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .in('id', authorIds);

      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      return postsData.map(post => ({
        ...post,
        author: profilesMap.get(post.author_id) || null,
      }));
    },
    enabled: !!user?.id,
  });

  const handleProfile = (username: string | null) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-10">
      <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No posts yet</h3>
      <p className="text-muted-foreground text-center mb-4">
        Be the first to share your financial knowledge!
      </p>
      <Button onClick={() => navigate('/app')}>Create a Post</Button>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center py-10">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-lg font-medium mb-2">Failed to load feed</h3>
      <p className="text-muted-foreground text-center mb-4">
        Something went wrong. Please try again.
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  );

  const renderFollowingEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-10">
      <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No posts from people you follow</h3>
      <p className="text-muted-foreground text-center mb-4">
        Follow more users and experts to see their posts here
      </p>
      <Button onClick={() => navigate('/discover')}>Discover People to Follow</Button>
    </div>
  );

  return (
    <div className="container max-w-3xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Feed</h1>
      
      <Tabs defaultValue="for-you" className="w-full">
        <TabsList className="grid grid-cols-4 h-auto mb-6">
          <TabsTrigger value="for-you" className="py-2">For You</TabsTrigger>
          <TabsTrigger value="following" className="py-2">Following</TabsTrigger>
          <TabsTrigger value="trending" className="py-2">Trending</TabsTrigger>
          <TabsTrigger value="latest" className="py-2">Latest</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you" className="mt-0">
          {isLoading && renderLoadingSkeleton()}
          {error && renderErrorState()}
          {!isLoading && !error && posts && posts.length === 0 && renderEmptyState()}
          {!isLoading && !error && posts && posts.length > 0 && (
            <div className="space-y-6">
              {posts.map(post => (
                <FeedPostCard key={post.id} post={post} onProfileClick={handleProfile} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="following" className="mt-0">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sign in to see posts from people you follow</h3>
              <Button onClick={() => navigate('/auth/login')}>Sign In</Button>
            </div>
          ) : followingLoading ? (
            renderLoadingSkeleton()
          ) : followingError ? (
            renderErrorState()
          ) : !followingPosts || followingPosts.length === 0 ? (
            renderFollowingEmptyState()
          ) : (
            <div className="space-y-6">
              {followingPosts.map(post => (
                <FeedPostCard key={post.id} post={post} onProfileClick={handleProfile} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="mt-0">
          {isLoading && renderLoadingSkeleton()}
          {error && renderErrorState()}
          {!isLoading && !error && posts && posts.length === 0 && renderEmptyState()}
          {!isLoading && !error && posts && posts.length > 0 && (
            <div className="space-y-6">
              {[...posts].sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).map(post => (
                <FeedPostCard key={post.id} post={post} onProfileClick={handleProfile} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="latest" className="mt-0">
          {isLoading && renderLoadingSkeleton()}
          {error && renderErrorState()}
          {!isLoading && !error && posts && posts.length === 0 && renderEmptyState()}
          {!isLoading && !error && posts && posts.length > 0 && (
            <div className="space-y-6">
              {posts.map(post => (
                <FeedPostCard key={post.id} post={post} onProfileClick={handleProfile} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Feed;
