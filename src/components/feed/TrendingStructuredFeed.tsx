import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, Star, Newspaper, RefreshCw, ArrowUp, ArrowDown, 
  MessageSquare, Repeat, Bookmark, MoreHorizontal, Share2, Flag, ExternalLink 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleBookmark, useIsBookmarked } from '@/hooks/useBookmarks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';


interface PromotedProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  headline: string | null;
  is_verified: boolean;
  is_expert: boolean;
  followers_count: number;
  tier: string;
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  url: string;
  thumbnail_url: string | null;
  image_url?: string | null;
  published_at: string;
  category: string;
  country?: string;
}

interface TrendingStructuredFeedProps {
  newsArticles?: NewsArticle[];
  isLoading?: boolean;
  filter?: 'all' | 'indian' | 'global' | 'crypto';
}

// Promoted Profile Card
const PromotedProfileCard: React.FC<{ profiles: PromotedProfile[] }> = ({ profiles }) => {
  const navigate = useNavigate();
  
  if (!profiles || profiles.length === 0) return null;

  const profile = profiles[0];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">Featured Expert</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h4 className="font-semibold text-sm truncate">{profile.full_name}</h4>
              {profile.is_verified && <TrendingUp className="h-3 w-3 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{profile.headline}</p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="shrink-0"
            onClick={() => navigate(`/u/${profile.username}`)}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper to validate image URL
const isValidImageUrl = (url: string | null | undefined): url is string => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

// Enhanced News Widget with Action CTAs
const NewsWidget: React.FC<{ 
  article: NewsArticle;
  onHide?: (id: string) => void;
}> = ({ article, onHide }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toggleBookmark = useToggleBookmark();
  
  // Check if article ID is a valid UUID for database operations
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(article.id);
  const { data: isBookmarked } = useIsBookmarked(isValidUuid ? article.id : undefined, 'news_article');
  
  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  // Determine image URL - ensure it's a proper URL string
  const rawImageUrl = article.image_url || article.thumbnail_url;
  const imageUrl = isValidImageUrl(rawImageUrl) ? rawImageUrl : null;
  const timeAgo = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to internal news detail page for commenting
    navigate(`/news/${encodeURIComponent(article.id)}`);
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // For news articles, create a post with the news link and navigate to it
    setIsReposting(true);
    try {
      // Create a new post with the news article as content
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert([{
          author_id: user.id,
          title: `Re: ${article.title}`,
          body: article.summary || '',
          link_url: article.url,
          link_preview: {
            title: article.title,
            description: article.summary,
            image: imageUrl,
            url: article.url,
          },
          type: 'link_converted' as const,
        }])
        .select('id')
        .single();
      
      if (error) throw error;
      
      toast.success('Shared with your opinion!');
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

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // For non-UUID article IDs, use local state only
    if (!isValidUuid) {
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Removed from bookmarks' : 'Saved to bookmarks');
      return;
    }
    
    toggleBookmark.mutate({
      entityId: article.id,
      entityType: 'news_article',
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share && navigator.canShare?.({ url: article.url })) {
        await navigator.share({ url: article.url, title: article.title });
      } else {
        await navigator.clipboard.writeText(article.url);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      // User cancelled or error - try clipboard fallback
      try {
        await navigator.clipboard.writeText(article.url);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Unable to share');
      }
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHide) {
      onHide(article.id);
      toast.success('Content hidden');
    }
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(article.url, '_blank');
  };

  return (
    <Card className="hover:border-primary/30 transition-colors overflow-hidden">
        {/* Image - larger display with proper validation */}
        {imageUrl && (
          <div 
            className="relative w-full h-40 sm:h-48 cursor-pointer bg-muted"
            onClick={handleOpenLink}
          >
            <img 
              src={imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Hide broken image
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-[10px] bg-background/80">
                <ExternalLink className="h-2.5 w-2.5 mr-1" />
                {article.source}
              </Badge>
            </div>
          </div>
        )}
        
        <CardContent className="p-3">
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-2">
            <Badge variant="secondary" className="text-[10px]">
              {article.category}
            </Badge>
            {article.country && (
              <Badge variant="outline" className="text-[10px]">
                {article.country === 'india' ? '🇮🇳 India' : '🌐 Global'}
              </Badge>
            )}
          </div>
          
          {/* Title */}
          <h4 
            className="text-sm font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={handleOpenLink}
          >
            {article.title}
          </h4>
          
          {/* Summary */}
          {article.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
          )}
          
          {/* Source and time */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {!imageUrl && <span>{article.source}</span>}
            {!imageUrl && <span>•</span>}
            <span>{timeAgo}</span>
          </div>
        </CardContent>

        {/* Action CTAs - equidistant */}
        <CardFooter className="p-3 pt-0 border-t border-border/50 mt-2 pt-2">
          <div className="flex items-center justify-between w-full">
            {/* Upvote */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-1.5 flex-1 max-w-[48px] ${isUpvoted ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={handleUpvote}
            >
              <div className="flex items-center gap-0.5">
                <ArrowUp className="h-4 w-4" />
                {localUpvotes > 0 && <span className="text-xs">{localUpvotes}</span>}
              </div>
            </Button>
            
            {/* Downvote */}
            <Button 
              variant="ghost" 
              size="sm"
              disabled={isReposting}
              className={`h-7 px-1.5 flex-1 max-w-[48px] ${isDownvoted ? 'text-destructive' : 'text-muted-foreground'}`}
              onClick={handleDownvote}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            
            {/* Comment */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-1.5 flex-1 max-w-[48px] text-muted-foreground"
              onClick={handleComment}
            >
              <div className="flex items-center gap-0.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs">0</span>
              </div>
            </Button>
            
            {/* Repost - opens modal with opinion */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-1.5 flex-1 max-w-[48px] text-muted-foreground ${isReposting ? 'animate-pulse' : ''}`}
              onClick={handleRepost}
            >
              <Repeat className="h-3.5 w-3.5" />
            </Button>
            
            {/* Save */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-1.5 flex-1 max-w-[48px] ${(isBookmarked || isSaved) ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={handleSave}
            >
              <Bookmark className="h-3.5 w-3.5" fill={(isBookmarked || isSaved) ? "currentColor" : "none"} />
            </Button>

            {/* 3-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenLink}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReport} className="text-destructive">
                  <Flag className="mr-2 h-4 w-4" />
                  Report & hide
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
    );
};

export const TrendingStructuredFeed: React.FC<TrendingStructuredFeedProps> = ({
  newsArticles: propArticles,
  isLoading: propLoading = false,
  filter = 'all',
}) => {
  const [promotedProfiles, setPromotedProfiles] = useState<PromotedProfile[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(propArticles || []);
  const [hiddenArticles, setHiddenArticles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(propLoading);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleHideArticle = (id: string) => {
    setHiddenArticles(prev => new Set([...prev, id]));
  };

  // Fetch news and promotions on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First trigger the RSS fetch to update news (once per session)
        const sessionKey = 'news_fetched_session';
        const lastFetch = sessionStorage.getItem(sessionKey);
        const now = Date.now();
        
        // Only fetch if not already fetched this session (or if older than 5 minutes)
        if (!lastFetch || (now - parseInt(lastFetch)) > 5 * 60 * 1000) {
          try {
            await fetch(`${getSupabaseUrl()}/functions/v1/fetch-google-rss`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${getSupabaseAnonKey()}`,
                'Content-Type': 'application/json',
              },
            });
            sessionStorage.setItem(sessionKey, now.toString());
          } catch (e) {
            console.log('RSS fetch triggered in background');
          }
        }

        // Fetch trending news from the database
        const newsRes = await fetch(
          `${getSupabaseUrl()}/functions/v1/news-trending?type=${filter}&limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${getSupabaseAnonKey()}`,
            },
          }
        );
        
        if (newsRes.ok) {
          const data = await newsRes.json();
          setNewsArticles(data.articles || []);
        } else {
          throw new Error('Failed to fetch news');
        }

        // Fetch promoted profiles
        const profilesRes = await fetch(
          `${getSupabaseUrl()}/functions/v1/promotions-profiles?type=profile&limit=3`,
          {
            headers: {
              'Authorization': `Bearer ${getSupabaseAnonKey()}`,
            },
          }
        );
        if (profilesRes.ok) {
          const data = await profilesRes.json();
          setPromotedProfiles(data.promotions || []);
        }
      } catch (err) {
        console.error('Failed to fetch trending data:', err);
        setError('Failed to load trending news');
      } finally {
        setIsLoading(false);
        setLoadingPromotions(false);
      }
    };

    fetchData();
  }, [filter]);

  // Update from props if provided
  useEffect(() => {
    if (propArticles && propArticles.length > 0) {
      setNewsArticles(propArticles);
    }
  }, [propArticles]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Force fresh RSS fetch
      await fetch(`${getSupabaseUrl()}/functions/v1/fetch-google-rss`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getSupabaseAnonKey()}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch latest news
      const newsRes = await fetch(
        `${getSupabaseUrl()}/functions/v1/news-trending?type=${filter}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${getSupabaseAnonKey()}`,
          },
        }
      );
      
      if (newsRes.ok) {
        const data = await newsRes.json();
        setNewsArticles(data.articles || []);
        sessionStorage.setItem('news_fetched_session', Date.now().toString());
      }
    } catch (err) {
      setError('Failed to refresh news');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || loadingPromotions) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-40 w-full mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-3">
            <RefreshCw className="h-3 w-3 mr-1" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const visibleArticles = newsArticles.filter(a => !hiddenArticles.has(a.id));

  if (visibleArticles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No trending news at the moment</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-3">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Build the feed with interleaved content: 4 news, promoted profile, 4 news, etc.
  const feedItems: React.ReactNode[] = [];
  let newsIndex = 0;
  let profileIndex = 0;

  while (newsIndex < visibleArticles.length) {
    // Add 4 news items
    for (let i = 0; i < 4 && newsIndex < visibleArticles.length; i++) {
      const article = visibleArticles[newsIndex];
      feedItems.push(
        <NewsWidget 
          key={article.id} 
          article={article}
          onHide={handleHideArticle}
        />
      );
      newsIndex++;
    }

    // Add a promoted profile after every 4 news items
    if (profileIndex < promotedProfiles.length && newsIndex < visibleArticles.length) {
      feedItems.push(
        <PromotedProfileCard 
          key={`promoted-${profileIndex}`}
          profiles={[promotedProfiles[profileIndex]]} 
        />
      );
      profileIndex++;
    }
  }

  return (
    <div className="space-y-3">
      {/* Refresh header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            {visibleArticles.length} trending stories
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="h-7 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {feedItems}
    </div>
  );
};
