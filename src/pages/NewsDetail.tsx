import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, ExternalLink, ArrowUp, ArrowDown, MessageSquare, 
  Repeat, Bookmark, Share2, Flag, MoreHorizontal 
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
  const { user } = useAuth();
  
  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['news-article', id],
    queryFn: async () => {
      if (!id) return null;
      const decodedId = decodeURIComponent(id);
      
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', decodedId)
        .single();

      if (error) throw error;
      return data as NewsArticle;
    },
    enabled: !!id,
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
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from bookmarks' : 'Saved to bookmarks');
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
            
            {/* Comment placeholder */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 max-w-[56px] text-muted-foreground"
              onClick={() => toast.info('Comments coming soon!')}
            >
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">0</span>
              </div>
            </Button>
            
            {/* Repost/Share */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 max-w-[56px] text-muted-foreground"
              onClick={handleShare}
            >
              <Repeat className="h-4 w-4" />
            </Button>
            
            {/* Save */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex-1 max-w-[56px] ${isSaved ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={handleSave}
            >
              <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
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

      {/* Comments section placeholder */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold">Comments</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Comments for news articles coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsDetail;
