
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Bookmark, MoreHorizontal, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

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
}

const PostCardHeader: React.FC<PostCardHeaderProps> = ({ post, onClick }) => {
  const handleProfileClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Stop event propagation to prevent triggering the card's onClick
  };

  // Get post type label
  const getTypeLabel = () => {
    if (post.type === 'question') return 'Question';
    if (post.type === 'opinion') return 'Opinion';
    if (post.type === 'news') return 'News';
    return null;
  };

  const typeLabel = getTypeLabel();

  return (
    <CardHeader className="p-4 pb-2">
      {/* Top row: Type badge left, 3-dots right */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {typeLabel && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs capitalize">
              {typeLabel}
            </Badge>
          )}
          {post.category && !typeLabel && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              {post.category.name}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Report content</DropdownMenuItem>
            <DropdownMenuItem>Hide posts from this user</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Author row */}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={post.author?.avatar_url || undefined} alt={post.author?.full_name || 'Profile'} />
          <AvatarFallback>{post.author?.full_name?.charAt(0) || 'U'}{post.author?.full_name?.split(' ')[1]?.charAt(0) || ''}</AvatarFallback>
        </Avatar>
        <div className="text-left">
          <div className="flex items-center gap-1">
            <h4 className="font-medium hover:underline cursor-pointer" onClick={(e) => { handleProfileClick(e); onClick?.(post); }}>
              {post.author?.full_name || 'Unknown User'}
            </h4>
            {post.author?.is_verified && (
              <span className="text-primary">
                <TrendingUp className="h-3 w-3" />
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="mr-2">@{post.author?.username || 'username'}</span>
            <span className="mr-2">•</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
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
    <CardContent className="p-4 pt-2 cursor-pointer text-left" onClick={() => onClick?.(post)}>
      <h3 className="text-lg font-medium mb-2">{post.title}</h3>
      <p className="text-muted-foreground text-sm">{post.content}</p>
    </CardContent>
  );
};

interface PostCardFooterProps {
  post: EnhancedPost;
  onLike?: (post: EnhancedPost) => void;
  onComment?: (post: EnhancedPost) => void;
  onShare?: (post: EnhancedPost) => void;
  onBookmark?: (post: EnhancedPost) => void;
}

// Share icon removed from footer - now only in 3-dot menu
const PostCardFooter: React.FC<PostCardFooterProps> = ({ post, onLike, onComment, onBookmark }) => {
  return (
    <CardFooter className="p-4 pt-0 flex justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${post.isLiked ? 'text-primary' : ''}`}
          onClick={() => onLike?.(post)}
        >
          <Heart className="h-4 w-4" fill={post.isLiked ? "currentColor" : "none"} />
          <span>{post.like_count}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => onComment?.(post)}>
          <MessageSquare className="h-4 w-4" />
          <span>{post.comment_count}</span>
        </Button>
        {/* Share icon removed - now only in 3-dot menu */}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className={post.isBookmarked ? 'text-primary' : ''}
        onClick={() => onBookmark?.(post)}
      >
        <Bookmark className="h-4 w-4" fill={post.isBookmarked ? "currentColor" : "none"} />
      </Button>
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
    <Card className={`border shadow-sm animate-hover-rise ${className || ''}`} onClick={() => isClickable && onClick?.(post)}>
      <PostCardHeader post={post} onClick={onClick} />
      <PostCardContent post={post} onClick={onClick} />
      {showActions && (
        <PostCardFooter
          post={post}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onBookmark={onBookmark}
        />
      )}
    </Card>
  );
};

export default PostCard;
