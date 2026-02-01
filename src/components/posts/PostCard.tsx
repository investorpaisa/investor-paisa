
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <CardHeader className="p-4 pb-2">
      {/* Row 1: Author info LEFT | Type badge + Bookmark + 3-dots RIGHT */}
      <div className="flex items-center justify-between">
        {/* Left: Author */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={post.author?.avatar_url || undefined} alt={post.author?.full_name || 'Profile'} />
            <AvatarFallback>{post.author?.full_name?.charAt(0) || 'U'}{post.author?.full_name?.split(' ')[1]?.charAt(0) || ''}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1">
              <h4 className="font-medium truncate hover:underline cursor-pointer text-sm" onClick={(e) => { handleProfileClick(e); onClick?.(post); }}>
                {post.author?.full_name || 'Unknown User'}
              </h4>
              {post.author?.is_verified && (
                <span className="text-primary shrink-0">
                  <TrendingUp className="h-3 w-3" />
                </span>
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground truncate">
              <span className="truncate">@{post.author?.username || 'username'}</span>
              <span className="mx-1.5 shrink-0">•</span>
              <span className="shrink-0">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {/* Right: Type Badge + Bookmark + 3-dot menu */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Type Badge */}
          {typeLabel && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] capitalize h-5 px-1.5 shrink-0">
              {typeLabel}
            </Badge>
          )}
          {post.category && !typeLabel && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] h-5 px-1.5 shrink-0">
              {post.category.name}
            </Badge>
          )}
          
          {/* Bookmark */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${post.isBookmarked ? 'text-primary' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.(post);
            }}
          >
            <Bookmark className="h-4 w-4" fill={post.isBookmarked ? "currentColor" : "none"} />
          </Button>
          
          {/* 3-dot menu - ALWAYS top-right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
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
      {/* Title - 2 line truncate */}
      <h3 className="text-base font-medium mb-1 line-clamp-2 text-left">{post.title}</h3>
      {/* Description - 3 line truncate */}
      <p className="text-muted-foreground text-sm line-clamp-3 text-left">{post.content}</p>
    </CardContent>
  );
};

interface PostCardFooterProps {
  post: EnhancedPost;
  onLike?: (post: EnhancedPost) => void;
  onComment?: (post: EnhancedPost) => void;
}

// Footer: Only like and comment actions - Share moved to 3-dot menu
const PostCardFooter: React.FC<PostCardFooterProps> = ({ post, onLike, onComment }) => {
  return (
    <CardFooter className="p-4 pt-0">
      <div className="flex items-center justify-start gap-6 w-full">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 h-8 px-3 ${post.isLiked ? 'text-primary' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike?.(post);
          }}
        >
          <Heart className="h-4 w-4" fill={post.isLiked ? "currentColor" : "none"} />
          <span className="text-sm">{post.like_count}</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 h-8 px-3" 
          onClick={(e) => {
            e.stopPropagation();
            onComment?.(post);
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">{post.comment_count}</span>
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
    <Card className={`border shadow-sm animate-hover-rise ${className || ''}`} onClick={() => isClickable && onClick?.(post)}>
      <PostCardHeader post={post} onClick={onClick} onBookmark={onBookmark} onShare={onShare} />
      <PostCardContent post={post} onClick={onClick} />
      {showActions && (
        <PostCardFooter
          post={post}
          onLike={onLike}
          onComment={onComment}
        />
      )}
    </Card>
  );
};

export default PostCard;
