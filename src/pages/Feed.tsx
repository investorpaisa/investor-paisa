import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark, MoreHorizontal, TrendingUp, AlertCircle, RefreshCw, Repeat, Flag, EyeOff, Link } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToggleReaction, useUserReaction } from '@/hooks/useReactions';
import { useToggleBookmark, useIsBookmarked } from '@/hooks/useBookmarks';
import { useIsReposted, useCreateRepostWithOpinion, useRemoveRepost } from '@/hooks/useReposts';
import { useHiddenUsers, useToggleHideUser } from '@/hooks/useHiddenUsers';
import { toast } from 'sonner';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { trackEvents } from '@/services/analytics/googleAnalytics';
import { TrendingStructuredFeed } from '@/components/feed/TrendingStructuredFeed';
import { VerificationModal } from '@/components/auth/VerificationModal';
import { ReportContentModal } from '@/components/moderation/ReportContentModal';
import { RepostWithOpinionModal } from '@/components/posts/RepostWithOpinionModal';

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
const TABS = ['pulse', 'trending', 'following'] as const;

// Skeleton loading component
const FeedSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="border border-border/50 bg-card/50">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <Skeleton className="h-4 w-3/4 mb-1.5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3 mt-1" />
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <div className="flex gap-3">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-7 w-14" />
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
  const createRepostWithOpinion = useCreateRepostWithOpinion();
  const removeRepost = useRemoveRepost();
  const toggleHideUser = useToggleHideUser();
  
  const [localUpvoteCount, setLocalUpvoteCount] = useState((post as any).upvote_count || 0);
  const [localDownvoteCount, setLocalDownvoteCount] = useState((post as any).downvote_count || 0);
  const [isVoteAnimating, setIsVoteAnimating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  
  const { data: userReactions } = useUserReaction(post.id, 'post');
  const { data: isBookmarked } = useIsBookmarked(post.id);
  const { data: isReposted } = useIsReposted(post.id);
  
  const isUpvoted = userReactions?.some(r => r.reaction_type === 'upvote') || false;
  const isDownvoted = userReactions?.some(r => r.reaction_type === 'downvote') || false;

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setIsVoteAnimating(true);
    if (isUpvoted) {
      setLocalUpvoteCount(prev => prev - 1);
    } else {
      setLocalUpvoteCount(prev => prev + 1);
      if (isDownvoted) {
        setLocalDownvoteCount(prev => prev - 1);
      }
    }
    
    toggleReaction.mutate({
      entityId: post.id,
      entityType: 'post',
      reactionType: 'upvote',
    }, {
      onSuccess: () => {
        trackEvents.upvote(post.id);
      },
      onError: () => {
        setLocalUpvoteCount((post as any).upvote_count || 0);
        setLocalDownvoteCount((post as any).downvote_count || 0);
        toast.error('Failed to vote');
      }
    });
    
    setTimeout(() => setIsVoteAnimating(false), 300);
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (isDownvoted) {
      setLocalDownvoteCount(prev => prev - 1);
    } else {
      setLocalDownvoteCount(prev => prev + 1);
      if (isUpvoted) {
        setLocalUpvoteCount(prev => prev - 1);
      }
    }
    
    toggleReaction.mutate({
      entityId: post.id,
      entityType: 'post',
      reactionType: 'downvote',
    }, {
      onSuccess: () => {
        trackEvents.downvote(post.id);
      },
      onError: () => {
        setLocalUpvoteCount((post as any).upvote_count || 0);
        setLocalDownvoteCount((post as any).downvote_count || 0);
        toast.error('Failed to vote');
      }
    });
  };

  const handleRepostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isReposted) {
      // If already reposted, remove it
      removeRepost.mutate(post.id);
    } else {
      // Open repost modal for new repost
      setShowRepostModal(true);
    }
  };

  const handleRepostSubmit = async (postId: string, opinion: string | undefined) => {
    await createRepostWithOpinion.mutateAsync({ postId, opinion });
  };

  const handleReportContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowReportModal(true);
  };

  const handleHideUser = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (post.author_id) {
      toggleHideUser.mutate(post.author_id);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
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
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: post.title || 'Check out this post' });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
      trackEvents.share('post', post.id);
    } catch {
      toast.error('Failed to share');
    }
  };

  const voteScore = localUpvoteCount - localDownvoteCount;

  // Format time - single line
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  // Get type label
  const getTypeLabel = () => {
    if (post.type === 'question') return 'Question';
    if (post.type === 'opinion') return 'Opinion';
    if (post.type === 'news') return 'News';
    return post.type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="border border-border/50 bg-card/50 hover:border-primary/30 transition-all cursor-pointer relative"
        onClick={() => onPostClick(post.id)}
      >
        {/* Absolute 3-dot menu - sticky top right */}
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => handleShare(e as any)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReportContent} className="text-destructive focus:text-destructive">
                <Flag className="mr-2 h-4 w-4" />
                Report content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHideUser}>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide posts from this user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="p-3 pb-2 pr-12">
          {/* HEADER: [ Avatar + Name + @username + time ] ---- [ Type Badge ] */}
          <div className="flex items-center justify-between gap-2">
            {/* LEFT: Author info - single line */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar 
                className="h-9 w-9 cursor-pointer shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onProfileClick(post.author?.username || null);
                }}
              >
                <AvatarImage src={post.author?.avatar_url || undefined} alt={post.author?.full_name || 'User'} />
                <AvatarFallback className="bg-secondary text-xs">
                  {post.author?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {/* Name, username, time - compact single line with word break */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden flex-wrap">
                <span
                  className="font-medium text-xs sm:text-sm hover:underline cursor-pointer truncate max-w-[100px] sm:max-w-[140px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProfileClick(post.author?.username || null);
                  }}
                >
                  {post.author?.full_name || 'Anonymous'}
                </span>
                {post.author?.is_verified && (
                  <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                )}
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[60px] sm:max-w-[80px]">
                  @{post.author?.username || 'user'}
                </span>
                <span className="text-muted-foreground shrink-0">•</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {timeAgo}
                </span>
              </div>
            </div>
            
            {/* RIGHT: Type Badge only (3-dot menu is absolute positioned) */}
            <Badge variant="outline" className="text-[10px] capitalize bg-primary/10 text-primary border-primary/30 h-5 px-1.5 shrink-0">
              {getTypeLabel()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-1 text-left overflow-hidden">
          {/* Title - 2 line clamp with word break */}
          {post.title && <h3 className="text-sm font-medium mb-1 line-clamp-2 break-words">{post.title}</h3>}
          {/* Body - 3 line clamp with word break */}
          {post.body && <p className="text-muted-foreground text-xs whitespace-pre-wrap line-clamp-3 break-words overflow-wrap-anywhere">{post.body}</p>}
        </CardContent>
        
        {/* Footer: Mobile - equidistant CTAs using justify-between */}
        <CardFooter className="p-3 pt-0">
          <div className="flex items-center justify-between w-full">
            {/* Upvote */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-1.5 flex-1 max-w-[48px] ${isUpvoted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={handleUpvote}
              disabled={toggleReaction.isPending}
            >
              <motion.div
                animate={isVoteAnimating ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-0.5"
              >
                <ArrowUp className="h-4 w-4" />
                <span className={`text-xs ${voteScore > 0 ? 'text-primary' : ''}`}>
                  {localUpvoteCount > 0 ? localUpvoteCount : ''}
                </span>
              </motion.div>
            </Button>
            
            {/* Downvote */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-1.5 flex-1 max-w-[48px] ${isDownvoted ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={handleDownvote}
              disabled={toggleReaction.isPending}
            >
              <div className="flex items-center gap-0.5">
                <ArrowDown className="h-4 w-4" />
                <span className={`text-xs ${localDownvoteCount > 0 ? 'text-destructive' : ''}`}>
                  {localDownvoteCount > 0 ? localDownvoteCount : ''}
                </span>
              </div>
            </Button>
            
            {/* Comment */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-1.5 flex-1 max-w-[48px] text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onPostClick(post.id);
              }}
            >
              <div className="flex items-center gap-0.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs">{post.comment_count || 0}</span>
              </div>
            </Button>
            
            {/* Repost */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-1.5 flex-1 max-w-[48px] ${isReposted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={handleRepostClick}
              disabled={createRepostWithOpinion.isPending || removeRepost.isPending}
            >
              <Repeat className="h-3.5 w-3.5" />
            </Button>
            
            {/* Bookmark/Save */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-1.5 flex-1 max-w-[48px] ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={handleSave}
              disabled={toggleBookmark.isPending}
            >
              <Bookmark className="h-3.5 w-3.5" fill={isBookmarked ? "currentColor" : "none"} />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Report Content Modal */}
      <ReportContentModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        entityId={post.id}
        entityType="post"
        contentPreview={post.title || post.body || undefined}
      />

      {/* Repost with Opinion Modal */}
      <RepostWithOpinionModal
        open={showRepostModal}
        onOpenChange={setShowRepostModal}
        post={{
          id: post.id,
          title: post.title,
          body: post.body,
          type: post.type,
          created_at: post.created_at,
          author: post.author ? {
            full_name: post.author.full_name,
            username: post.author.username,
            avatar_url: post.author.avatar_url,
          } : null,
        }}
        onRepost={handleRepostSubmit}
        isLoading={createRepostWithOpinion.isPending}
      />
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
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="mb-4 text-muted-foreground">
      {icon}
    </div>
    <h3 className="text-base font-medium mb-2">{title}</h3>
    <p className="text-muted-foreground text-xs max-w-xs mb-4">{description}</p>
    {action && (
      <Button onClick={action.onClick} size="sm" className="bg-primary text-primary-foreground">
        {action.label}
      </Button>
    )}
  </div>
);

// Error state component
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="h-10 w-10 text-destructive mb-4" />
    <h3 className="text-base font-medium mb-2">Something went wrong</h3>
    <p className="text-muted-foreground text-xs mb-4">Failed to load feed. Please try again.</p>
    <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
      <RefreshCw className="h-3.5 w-3.5" />
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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Get hidden users to filter from feed
  const { data: hiddenUsers } = useHiddenUsers();
  const hiddenUserIds = hiddenUsers?.map(h => h.hidden_user_id) || [];

  // Check if this is a new user who needs verification prompt
  useEffect(() => {
    const isNewUser = sessionStorage.getItem('ip_new_user');
    if (isNewUser === 'true') {
      sessionStorage.removeItem('ip_new_user');
      // Small delay to let page render first
      setTimeout(() => setShowVerificationModal(true), 500);
    }
  }, []);

  // Get current tab index for swipe
  const currentTabIndex = TABS.indexOf(activeFeedTab);

  // Handle swipe gesture
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentTabIndex < TABS.length - 1) {
      setActiveFeedTab(TABS[currentTabIndex + 1]);
    } else if (info.offset.x > threshold && currentTabIndex > 0) {
      setActiveFeedTab(TABS[currentTabIndex - 1]);
    }
  };

  // Fetch news for trending tab
  const { data: trendingNews } = useQuery({
    queryKey: ['trending-news'],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/news-trending?type=all&limit=20`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.articles || [];
    },
    enabled: activeFeedTab === 'trending',
    staleTime: 60000,
  });

  // Fetch posts with infinite scroll
  const fetchPosts = async ({ pageParam = 0 }: { pageParam?: number }) => {
    const start = pageParam * PAGE_SIZE;
    
    let query = supabase
      .from('posts')
      .select('id, title, body, type, created_at, like_count, comment_count, share_count, author_id, upvote_count, downvote_count')
      .eq('moderation_status', 'approved')
      .is('deleted_at', null)
      .range(start, start + PAGE_SIZE - 1);

    if (activeFeedTab === 'pulse') {
      query = query.eq('type', 'question').order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (activeFeedTab === 'following' && user?.id) {
      // Get users the current user follows
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      // Get communities the user is a member of
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      const followingIds = follows?.map(f => f.following_id) || [];
      const communityIds = memberships?.map(m => m.community_id) || [];

      if (followingIds.length === 0 && communityIds.length === 0) {
        return { posts: [], nextPage: undefined };
      }

      // Build OR condition for following users OR community posts
      let orConditions = [];
      if (followingIds.length > 0) {
        orConditions.push(`author_id.in.(${followingIds.join(',')})`);
      }
      if (communityIds.length > 0) {
        orConditions.push(`community_id.in.(${communityIds.join(',')})`);
      }
      
      query = query.or(orConditions.join(','));
    }

    const { data: postsData, error } = await query;
    if (error) throw error;
    if (!postsData || postsData.length === 0) return { posts: [], nextPage: undefined };

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

  // Filter out posts from hidden users
  const allPosts = (data?.pages.flatMap(page => page.posts) || [])
    .filter(post => !hiddenUserIds.includes(post.author_id));

  return (
    <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4">
      <Tabs 
        value={activeFeedTab} 
        onValueChange={(v) => setActiveFeedTab(v as 'pulse' | 'trending' | 'following')} 
        className="w-full"
      >
        {/* Sticky Tab Navigation */}
        <div className="sticky top-12 z-30 bg-background/95 backdrop-blur-sm pt-1 pb-3 -mx-2 px-2 sm:-mx-4 sm:px-4">
          <TabsList className="grid grid-cols-3 w-full h-10 bg-secondary/50 border border-border/50 rounded-xl p-1">
            <TabsTrigger
              value="pulse" 
              className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
            >
              Pulse
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
            >
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
            >
              Following
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Swipeable Content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          className="touch-pan-y"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeedTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Show structured feed for Trending tab */}
              {activeFeedTab === 'trending' && (
                <TrendingStructuredFeed 
                  newsArticles={trendingNews || []}
                  isLoading={isLoading}
                />
              )}
              
              {/* Show regular feed for Pulse and Following tabs */}
              {activeFeedTab !== 'trending' && (
                <>
                  {isLoading && <FeedSkeleton />}
                  
                  {error && <ErrorState onRetry={() => refetch()} />}
                  
                  {!isLoading && !error && allPosts.length === 0 && (
                    <EmptyState
                      icon={<AlertCircle className="h-10 w-10" />}
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
                          ? { label: 'Find People', onClick: () => {
                              // Trigger search focus - scroll to top and focus search
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              // Dispatch custom event for search focus
                              window.dispatchEvent(new CustomEvent('focusSearch'));
                            }}
                          : undefined
                      }
                    />
                  )}
              
              {!isLoading && !error && allPosts.length > 0 && (
                <div className="space-y-3">
                  {allPosts.map(post => (
                    <FeedPostCard 
                      key={post.id} 
                      post={post} 
                      onProfileClick={handleProfileClick}
                      onPostClick={handlePostClick}
                    />
                  ))}
                  
                  {/* Infinite scroll trigger */}
                  <div ref={loadMoreRef} className="h-16 flex items-center justify-center">
                    {isFetchingNextPage && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs">Loading more...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </Tabs>

      {/* Verification Modal for New Users */}
      <VerificationModal 
        open={showVerificationModal} 
        onOpenChange={setShowVerificationModal} 
      />
    </div>
  );
};

export default Feed;
