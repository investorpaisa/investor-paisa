import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';

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

const PAGE_SIZE = 10;

// Skeleton loading component - 6 cards as per spec
const FeedSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="border border-border/50 bg-card/50">
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
        <CardFooter className="p-4 pt-0">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </CardFooter>
      </Card>
    ))}
  </div>
);

// Individual post card with interactions
const FeedPostCard: React.FC<{ 
  post: PostWithAuthor; 
  onProfileClick: (username: string | null) => void;
  onPostClick: (postId: string) => void;
}> = ({ post, onProfileClick, onPostClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toggleReaction = useToggleReaction();
  const toggleBookmark = useToggleBookmark();
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count || 0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  
  const { data: userReactions } = useUserReaction(post.id, 'post');
  const { data: isBookmarked } = useIsBookmarked(post.id);
  
  const isLiked = userReactions?.some(r => r.reaction_type === 'like') || false;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Optimistic update with animation
    setIsLikeAnimating(true);
    setLocalLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    toggleReaction.mutate({
      entityId: post.id,
      entityType: 'post',
      reactionType: 'like',
    }, {
      onError: () => {
        // Rollback on error
        setLocalLikeCount(post.like_count || 0);
        toast.error('Failed to like post');
      }
    });
    
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleDoubleTapLike = () => {
    if (!isLiked) {
      handleLike({ stopPropagation: () => {} } as React.MouseEvent);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    toggleBookmark.mutate({
      entityId: post.id,
      entityType: 'post',
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="border border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
        onDoubleClick={handleDoubleTapLike}
        onClick={() => onPostClick(post.id)}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  onProfileClick(post.author?.username || null);
                }}
              >
                <AvatarImage src={post.author?.avatar_url || undefined} alt={post.author?.full_name || 'User'} />
                <AvatarFallback className="bg-secondary">
                  {post.author?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1">
                  <h4 
                    className="font-medium text-sm hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProfileClick(post.author?.username || null);
                    }}
                  >
                    {post.author?.full_name || 'Anonymous'}
                  </h4>
                  {post.author?.is_verified && (
                    <TrendingUp className="h-3 w-3 text-primary" />
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>@{post.author?.username || 'user'}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize bg-secondary/50">
                {post.type}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Report content</DropdownMenuItem>
                  <DropdownMenuItem>Hide posts from this user</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleShare(e as any)}>Copy link</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {post.title && <h3 className="text-base font-medium mb-1 line-clamp-2">{post.title}</h3>}
          {post.body && <p className="text-muted-foreground text-sm whitespace-pre-wrap line-clamp-3">{post.body}</p>}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`gap-1 transition-all ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={handleLike}
              disabled={toggleReaction.isPending}
            >
              <motion.div
                animate={isLikeAnimating ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
              </motion.div>
              <span>{localLikeCount}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onPostClick(post.id);
              }}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{post.comment_count || 0}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`transition-all ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={handleSave}
            disabled={toggleBookmark.isPending}
          >
            <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Empty state component
const EmptyState: React.FC<{ 
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 text-muted-foreground">
      {icon}
    </div>
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
    {action && (
      <Button onClick={action.onClick} className="bg-primary text-primary-foreground">
        {action.label}
      </Button>
    )}
  </div>
);

// Error state component
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
    <p className="text-muted-foreground text-sm mb-4">Failed to load feed. Please try again.</p>
    <Button variant="outline" onClick={onRetry} className="gap-2">
      <RefreshCw className="h-4 w-4" />
      Retry
    </Button>
  </div>
);

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeFeedTab, setActiveFeedTab } = useUIStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch posts with infinite scroll
  const fetchPosts = async ({ pageParam = 0 }: { pageParam?: number }) => {
    const start = pageParam * PAGE_SIZE;
    
    let query = supabase
      .from('posts')
      .select('id, title, body, type, created_at, like_count, comment_count, share_count, author_id')
      .eq('moderation_status', 'approved')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(start, start + PAGE_SIZE - 1);

    // For 'following' tab, filter by followed users
    if (activeFeedTab === 'following' && user?.id) {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        query = query.in('author_id', followingIds);
      } else {
        return { posts: [], nextPage: undefined };
      }
    }

    // For 'learn' tab, filter by educational content types
    if (activeFeedTab === 'learn') {
      query = query.in('type', ['tip', 'thread', 'insight']);
    }

    const { data: postsData, error } = await query;
    if (error) throw error;
    if (!postsData || postsData.length === 0) return { posts: [], nextPage: undefined };

    // Fetch author profiles
    const authorIds = [...new Set(postsData.map(p => p.author_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, headline, is_verified')
      .in('id', authorIds);

    const profilesMap = new Map<string, Profile>();
    profilesData?.forEach(profile => profilesMap.set(profile.id, profile));

    const posts: PostWithAuthor[] = postsData.map(post => ({
      ...post,
      author: profilesMap.get(post.author_id) || null,
    }));

    return {
      posts,
      nextPage: posts.length === PAGE_SIZE ? pageParam + 1 : undefined,
    };
  };

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', activeFeedTab, user?.id],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 30000,
  });

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.7 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleProfileClick = (username: string | null) => {
    if (username) navigate(`/profile/${username}`);
  };

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  const allPosts = data?.pages.flatMap(page => page.posts) || [];

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <Tabs 
        value={activeFeedTab} 
        onValueChange={(v) => setActiveFeedTab(v as 'pulse' | 'learn' | 'following')} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 h-12 mb-6 bg-secondary/50 border border-border/50 rounded-xl p-1">
          <TabsTrigger 
            value="pulse" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
          >
            Pulse
          </TabsTrigger>
          <TabsTrigger 
            value="learn" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
          >
            Learn
          </TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
          >
            Following
          </TabsTrigger>
        </TabsList>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeedTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading && <FeedSkeleton />}
            
            {error && <ErrorState onRetry={() => refetch()} />}
            
            {!isLoading && !error && allPosts.length === 0 && (
              <EmptyState
                icon={<AlertCircle className="h-12 w-12" />}
                title={
                  activeFeedTab === 'following' 
                    ? "No posts from people you follow"
                    : "No posts yet"
                }
                description={
                  activeFeedTab === 'following'
                    ? "Follow more users and experts to see their posts here"
                    : "Be the first to share your financial knowledge!"
                }
                action={
                  activeFeedTab === 'following'
                    ? { label: 'Discover People', onClick: () => navigate('/discover') }
                    : undefined
                }
              />
            )}
            
            {!isLoading && !error && allPosts.length > 0 && (
              <div className="space-y-4">
                {allPosts.map(post => (
                  <FeedPostCard 
                    key={post.id} 
                    post={post} 
                    onProfileClick={handleProfileClick}
                    onPostClick={handlePostClick}
                  />
                ))}
                
                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading more...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default Feed;
