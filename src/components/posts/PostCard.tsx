import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Bookmark, MoreHorizontal, TrendingUp, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
  onBookmark?: (post: EnhancedPost) => void;
  onShare?: (post: EnhancedPost) => void;
}

const PostCardHeader: React.FC<PostCardHeaderProps> = ({ post, onClick, onBookmark, onShare }) => {
  const handleProfileClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // Get post type label
  const getTypeLabel = () => {
    if (post.type === 'question') return 'Question';
    if (post.type === 'opinion') return 'Opinion';
    if (post.type === 'news') return 'News';
    return null;
  };

  const typeLabel = getTypeLabel();

  // Format time - single line, no wrap
  const timeAgo = post.created_at 
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : '';

  return (
    <CardHeader className="p-3 sm:p-4 pb-2 pr-12 relative">
      {/* Absolute 3-dot menu - sticky top right */}
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
            <DropdownMenuItem>Report content</DropdownMenuItem>
            <DropdownMenuItem>Hide posts from this user</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* HEADER: [ Avatar + FullName + @username + time ] ---- [ Type Badge ] */}
      <div className="flex items-center justify-between gap-2">
        {/* LEFT: Author info - all in one line */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={post.author?.avatar_url || undefined} alt={post.author?.full_name || 'Profile'} />
            <AvatarFallback className="text-xs">
              {post.author?.full_name?.charAt(0) || 'U'}
              {post.author?.full_name?.split(' ')[1]?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
          
          {/* Name, username, time - compact single line */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden flex-wrap">
            {/* Name - truncate */}
            <span 
              className="font-medium text-sm truncate max-w-[100px] sm:max-w-[140px] hover:underline cursor-pointer" 
              onClick={(e) => { handleProfileClick(e); onClick?.(post); }}
            >
              {post.author?.full_name || 'Unknown User'}
            </span>
            
            {post.author?.is_verified && (
              <TrendingUp className="h-3 w-3 text-primary shrink-0" />
            )}
            
            {/* Username - truncate */}
            <span className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-[100px]">
              @{post.author?.username || 'user'}
            </span>
            
            <span className="text-muted-foreground shrink-0">•</span>
            
            {/* Time - no wrap, single line */}
            <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
              {timeAgo}
            </span>
          </div>
        </div>
        
        {/* RIGHT: Type Badge only (3-dot menu is absolute positioned) */}
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
      {/* Title - 2 line truncate with word break */}
      <h3 className="text-sm sm:text-base font-medium mb-1 line-clamp-2 text-left break-words">{post.title}</h3>
      {/* Description - 3 line truncate with word break */}
      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 text-left break-words">{post.content}</p>
    </CardContent>
  );
};

interface PostCardFooterProps {
  post: EnhancedPost;
  onLike?: (post: EnhancedPost) => void;
  onComment?: (post: EnhancedPost) => void;
  onBookmark?: (post: EnhancedPost) => void;
}

// Footer: Like + Comment on left (equidistant), Bookmark on right
// Share icon REMOVED from footer (moved to 3-dot menu)
const PostCardFooter: React.FC<PostCardFooterProps> = ({ post, onLike, onComment, onBookmark }) => {
  return (
    <CardFooter className="p-3 sm:p-4 pt-0">
      <div className="flex items-center justify-between w-full">
        {/* Left: Actions - equidistant */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 h-8 px-2 ${post.isLiked ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={(e) => {
              e.stopPropagation();
              onLike?.(post);
            }}
          >
            <Heart className="h-4 w-4" fill={post.isLiked ? "currentColor" : "none"} />
            <span className="text-xs">{post.like_count || 0}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 h-8 px-2 text-muted-foreground" 
            onClick={(e) => {
              e.stopPropagation();
              onComment?.(post);
            }}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{post.comment_count || 0}</span>
          </Button>
        </div>
        
        {/* Right: Bookmark */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${post.isBookmarked ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={(e) => {
            e.stopPropagation();
            onBookmark?.(post);
          }}
        >
          <Bookmark className="h-4 w-4" fill={post.isBookmarked ? "currentColor" : "none"} />
        </Button>
      </div>
    </CardFooter>
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
  return (
    <Card 
      className={`border border-border/50 shadow-sm hover:border-primary/30 transition-all relative ${isClickable ? 'cursor-pointer' : ''} ${className || ''}`} 
      onClick={() => isClickable && onClick?.(post)}
    >
      <PostCardHeader post={post} onClick={onClick} onBookmark={onBookmark} onShare={onShare} />
      <PostCardContent post={post} onClick={onClick} />
      {showActions && (
        <PostCardFooter
          post={post}
          onLike={onLike}
          onComment={onComment}
          onBookmark={onBookmark}
        />
      )}
    </Card>
  );
};

export default PostCard;