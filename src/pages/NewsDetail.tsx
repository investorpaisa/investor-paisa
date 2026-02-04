import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, ExternalLink, ArrowUp, ArrowDown, MessageSquare, 
  Repeat, Bookmark, Share2, Flag, MoreHorizontal, Send, Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNewsComments, useCreateNewsComment } from '@/hooks/useNewsComments';
import { useToggleBookmark, useIsBookmarked } from '@/hooks/useBookmarks';
import { RepostWithOpinionModal } from '@/components/posts/RepostWithOpinionModal';

interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  url: string;
  thumbnail_url: string | null;
  image_url: string | null;
  published_at: string;
  category: string;
  country: string | null;
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  // Check if article ID is a valid UUID for database operations
  const decodedId = id ? decodeURIComponent(id) : '';
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
  
  const toggleBookmark = useToggleBookmark();
  const { data: isBookmarked } = useIsBookmarked(isValidUuid ? decodedId : undefined, 'news_article');
  const { data: comments, isLoading: commentsLoading } = useNewsComments(decodedId);
  const createComment = useCreateNewsComment();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['news-article', decodedId],
    queryFn: async () => {
      if (!decodedId) return null;
      
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', decodedId)
        .single();

      if (error) throw error;
      return data as NewsArticle;
    },
    enabled: !!decodedId,
  });

  const handleUpvote = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isUpvoted) {
      setLocalUpvotes(prev => prev - 1);
      setIsUpvoted(false);
    } else {
      setLocalUpvotes(prev => prev + 1);
      setIsUpvoted(true);
      if (isDownvoted) setIsDownvoted(false);
    }
  };

  const handleDownvote = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isDownvoted) {
      setIsDownvoted(false);
    } else {
      setIsDownvoted(true);
      if (isUpvoted) {
        setLocalUpvotes(prev => prev - 1);
        setIsUpvoted(false);
      }
    }
  };

  const handleSave = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!isValidUuid) {
      toast.success('Saved to bookmarks');
      return;
    }
    
    toggleBookmark.mutate({
      entityId: decodedId,
      entityType: 'news_article',
    });
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      if (navigator.share && navigator.canShare?.({ url: article.url })) {
        await navigator.share({ url: article.url, title: article.title });
      } else {
        await navigator.clipboard.writeText(article.url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(article.url);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Unable to share');
      }
    }
  };

  const handleRepost = async () => {
    if (!user || !article) {
      navigate('/auth');
      return;
    }
    setShowRepostModal(true);
  };

  const handleRepostSubmit = async (postId: string, opinion?: string) => {
    if (!article) return;
    
    setIsReposting(true);
    try {
      const imageUrl = article.image_url || article.thumbnail_url;
      const hasValidImage = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
      
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert([{
          author_id: user!.id,
          title: opinion ? opinion : `Re: ${article.title}`,
          body: opinion ? `${article.title}\n\n${article.summary || ''}` : article.summary || '',
          link_url: article.url,
          link_preview: {
            title: article.title,
            description: article.summary,
            image: hasValidImage ? imageUrl : null,
            url: article.url,
          },
          type: 'link_converted' as const,
        }])
        .select('id')
        .single();
      
      if (error) throw error;
      
      toast.success('Shared with your opinion!');
      setShowRepostModal(false);
      if (newPost) {
        navigate(`/post/${newPost.id}`);
      }
    } catch (err) {
      console.error('Failed to repost:', err);
      toast.error('Failed to share. Please try again.');
    } finally {
      setIsReposting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    await createComment.mutateAsync({
      articleId: decodedId,
      body: commentText.trim(),
    });
    setCommentText('');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4 space-y-4">
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4">
        <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Article not found</p>
            <Button onClick={() => navigate('/feed')} className="mt-4" size="sm">
              Go to Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const imageUrl = article.image_url || article.thumbnail_url;
  const hasValidImage = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
  const timeAgo = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });

  return (
    <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4 space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="self-start">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <Card className="overflow-hidden">
        {/* Image */}
        {hasValidImage && (
          <div className="relative w-full h-48 sm:h-64">
            <img 
              src={imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <CardHeader className="pb-2">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">{article.category}</Badge>
            {article.country && (
              <Badge variant="outline" className="text-xs">
                {article.country === 'india' ? '🇮🇳 India' : '🌐 Global'}
              </Badge>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-lg sm:text-xl font-bold leading-tight">{article.title}</h1>
          
          {/* Source and time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <span>{article.source}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Summary */}
          {article.summary && (
            <p className="text-sm text-muted-foreground mb-4">{article.summary}</p>
          )}
          
          {/* Open in new tab button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.open(article.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Read full article on {article.source}
          </Button>
        </CardContent>

        {/* Action CTAs */}
        <CardFooter className="p-3 border-t">
          <div className="flex items-center justify-between w-full">
            {/* Upvote */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex-1 max-w-[56px] ${isUpvoted ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={handleUpvote}
            >
              <div className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4" />
                {localUpvotes > 0 && <span className="text-xs">{localUpvotes}</span>}
              </div>
            </Button>
            
            {/* Downvote */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex-1 max-w-[56px] ${isDownvoted ? 'text-destructive' : 'text-muted-foreground'}`}
              onClick={handleDownvote}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            
            {/* Comment count */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 max-w-[56px] text-muted-foreground"
              onClick={() => document.getElementById('comment-input')?.focus()}
            >
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">{comments?.length || 0}</span>
              </div>
            </Button>
            
            {/* Repost - opens modal */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 max-w-[56px] text-muted-foreground"
              onClick={handleRepost}
            >
              <Repeat className="h-4 w-4" />
            </Button>
            
            {/* Save */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex-1 max-w-[56px] ${isBookmarked ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={handleSave}
            >
              <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
            </Button>

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(article.url, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open original
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => {
                  toast.success('Content reported');
                  navigate(-1);
                }}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>

      {/* Comments section */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold">Comments ({comments?.length || 0})</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment input */}
          {user ? (
            <div className="flex gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  id="comment-input"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
                <Button 
                  size="icon" 
                  onClick={handleSubmitComment}
                  disabled={createComment.isPending || !commentText.trim()}
                  className="shrink-0"
                >
                  {createComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                Sign in to comment
              </Button>
            </div>
          )}

          {/* Comments list */}
          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={comment.author?.avatar_url || undefined} />
                    <AvatarFallback>{comment.author?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{comment.author?.full_name || 'Anonymous'}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Repost Modal */}
      {article && (
        <RepostWithOpinionModal
          open={showRepostModal}
          onOpenChange={setShowRepostModal}
          post={{
            id: article.id,
            title: article.title,
            body: article.summary,
            type: 'news',
            created_at: article.published_at,
            author: {
              full_name: article.source,
              username: article.source.toLowerCase().replace(/\s+/g, ''),
              avatar_url: null,
            },
          }}
          onRepost={handleRepostSubmit}
          isLoading={isReposting}
        />
      )}
    </div>
  );
};

export default NewsDetail;
