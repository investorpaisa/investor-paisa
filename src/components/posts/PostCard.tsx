import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, MessageSquare, Bookmark, MoreHorizontal, TrendingUp, Share2, Repeat, Flag, EyeOff, Link } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleReaction, useUserReaction } from '@/hooks/useReactions';
import { useToggleBookmark, useIsBookmarked } from '@/hooks/useBookmarks';
import { useIsReposted, useCreateRepostWithOpinion, useRemoveRepost } from '@/hooks/useReposts';
import { useToggleHideUser } from '@/hooks/useHiddenUsers';
import { ReportContentModal } from '@/components/moderation/ReportContentModal';
import { RepostWithOpinionModal } from '@/components/posts/RepostWithOpinionModal';
import { trackEvents } from '@/services/analytics/googleAnalytics';

import { EnhancedPost } from '@/types';

interface PostCardProps {
  post: EnhancedPost;
  onLike?: (post: EnhancedPost) => void;
  onComment?: (post: EnhancedPost) => void;
  onShare?: (post: EnhancedPost) => void;
  onBookmark?: (post: EnhancedPost) => void;
  onClick?: (post: EnhancedPost) => void;
  showActions?: boolean;
  isClickable?: boolean;
  className?: string;
}

interface PostCardHeaderProps {
  post: EnhancedPost;
  onClick?: (post: EnhancedPost) => void;
  onShare?: (post: EnhancedPost) => void;
  onReport?: () => void;
  onHide?: () => void;
  isOwnPost?: boolean;
}

const PostCardHeader: React.FC<PostCardHeaderProps> = ({ post, onClick, onShare, onReport, onHide, isOwnPost }) => {
  const handleProfileClick = (event: React.MouseEvent) => {
    event.stopPropagation();
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

  const getTypeLabel = () => {
    if (post.type === 'question') return 'Question';
    if (post.type === 'opinion') return 'Opinion';
    if (post.type === 'news') return 'News';
    return null;
  };

  const typeLabel = getTypeLabel();
  const timeAgo = post.created_at 
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : '';

  return (
    <CardHeader className="p-3 sm:p-4 pb-2 pr-12 relative">
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onShare?.(post);
            }}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Link className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            {!isOwnPost && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onReport?.();
                }} className="text-destructive focus:text-destructive">
                  <Flag className="mr-2 h-4 w-4" />
                  Report content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onHide?.();
                }}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide posts from this user
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={post.author?.avatar_url || undefined} alt={post.author?.full_name || 'Profile'} />
            <AvatarFallback className="text-xs">
              {post.author?.full_name?.charAt(0) || 'U'}
              {post.author?.full_name?.split(' ')[1]?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden flex-wrap">
            <span 
              className="font-medium text-sm truncate max-w-[100px] sm:max-w-[140px] hover:underline cursor-pointer" 
              onClick={(e) => { handleProfileClick(e); onClick?.(post); }}
            >
              {post.author?.full_name || 'Unknown User'}
            </span>
            
            {post.author?.is_verified && (
              <TrendingUp className="h-3 w-3 text-primary shrink-0" />
            )}
            
            <span className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-[100px]">
              @{post.author?.username || 'user'}
            </span>
            
            <span className="text-muted-foreground shrink-0">•</span>
            
            <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
              {timeAgo}
            </span>
          </div>
        </div>
        
        {typeLabel && (
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/30 text-[10px] capitalize h-5 px-1.5 shrink-0"
          >
            {typeLabel}
          </Badge>
        )}
        {post.category && !typeLabel && (
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/30 text-[10px] h-5 px-1.5 shrink-0"
          >
            {post.category.name}
          </Badge>
        )}
      </div>
    </CardHeader>
  );
};

interface PostCardContentProps {
  post: EnhancedPost;
  onClick?: (post: EnhancedPost) => void;
}

const PostCardContent: React.FC<PostCardContentProps> = ({ post, onClick }) => {
  return (
    <CardContent className="p-3 sm:p-4 pt-1 cursor-pointer text-left overflow-hidden" onClick={() => onClick?.(post)}>
      <h3 className="text-sm sm:text-base font-medium mb-1 line-clamp-2 text-left break-words">{post.title}</h3>
      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 text-left break-words">{post.content}</p>
    </CardContent>
  );
};

interface PostCardFooterProps {
  post: EnhancedPost;
  onComment?: (post: EnhancedPost) => void;
}

const PostCardFooter: React.FC<PostCardFooterProps> = ({ post, onComment }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toggleReaction = useToggleReaction();
  const toggleBookmark = useToggleBookmark();
  const createRepostWithOpinion = useCreateRepostWithOpinion();
  const removeRepost = useRemoveRepost();
  
  const [localUpvoteCount, setLocalUpvoteCount] = useState((post as any).upvote_count || post.like_count || 0);
  const [localDownvoteCount, setLocalDownvoteCount] = useState((post as any).downvote_count || 0);
  const [isVoteAnimating, setIsVoteAnimating] = useState(false);
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
        setLocalUpvoteCount((post as any).upvote_count || post.like_count || 0);
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
        setLocalUpvoteCount((post as any).upvote_count || post.like_count || 0);
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
      removeRepost.mutate(post.id);
    } else {
      setShowRepostModal(true);
    }
  };

  const handleRepostSubmit = async (postId: string, opinion: string | undefined) => {
    await createRepostWithOpinion.mutateAsync({ postId, opinion });
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

  return (
    <>
      <CardFooter className="p-3 sm:p-4 pt-0">
        <div className="flex items-center justify-between w-full">
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
              <span className="text-xs">{localUpvoteCount > 0 ? localUpvoteCount : ''}</span>
            </motion.div>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-1.5 flex-1 max-w-[48px] ${isDownvoted ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={handleDownvote}
            disabled={toggleReaction.isPending}
          >
            <div className="flex items-center gap-0.5">
              <ArrowDown className="h-4 w-4" />
              <span className="text-xs">{localDownvoteCount > 0 ? localDownvoteCount : ''}</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-1.5 flex-1 max-w-[48px] text-muted-foreground hover:text-foreground" 
            onClick={(e) => {
              e.stopPropagation();
              onComment?.(post);
            }}
          >
            <div className="flex items-center gap-0.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs">{post.comment_count || 0}</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-1.5 flex-1 max-w-[48px] ${isReposted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={handleRepostClick}
            disabled={createRepostWithOpinion.isPending || removeRepost.isPending}
          >
            <Repeat className="h-3.5 w-3.5" />
          </Button>
          
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

      <RepostWithOpinionModal
        open={showRepostModal}
        onOpenChange={setShowRepostModal}
        post={{
          id: post.id,
          title: post.title,
          body: post.content,
          type: post.type || 'opinion',
          created_at: post.created_at,
          author: post.author ? {
            full_name: post.author.full_name || null,
            username: post.author.username || null,
            avatar_url: post.author.avatar_url || null,
          } : null,
        }}
        onRepost={handleRepostSubmit}
      />
    </>
  );
};

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onClick,
  showActions = true,
  isClickable = true,
  className
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toggleHideUser = useToggleHideUser();
  const [showReportModal, setShowReportModal] = useState(false);
  
  const isOwnPost = post.user_id === user?.id;

  const handleReport = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowReportModal(true);
  };

  const handleHide = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (post.user_id) {
      toggleHideUser.mutate(post.user_id);
    }
  };

  return (
    <>
      <Card 
        className={`border border-border/50 shadow-sm hover:border-primary/30 transition-all relative ${isClickable ? 'cursor-pointer' : ''} ${className || ''}`} 
        onClick={() => isClickable && onClick?.(post)}
      >
        <PostCardHeader 
          post={post} 
          onClick={onClick} 
          onShare={onShare}
          onReport={handleReport}
          onHide={handleHide}
          isOwnPost={isOwnPost}
        />
        <PostCardContent post={post} onClick={onClick} />
        {showActions && (
          <PostCardFooter
            post={post}
            onComment={onComment}
          />
        )}
      </Card>

      <ReportContentModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        entityId={post.id}
        entityType="post"
        contentPreview={post.title || post.content || undefined}
      />
    </>
  );
};

export default PostCard;