import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Star, Newspaper, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/integrations/supabase/client';

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

// News Widget
const NewsWidget: React.FC<{ article: NewsArticle }> = ({ article }) => (
  <Card className="hover:border-primary/30 transition-colors cursor-pointer" 
        onClick={() => window.open(article.url, '_blank')}>
    <CardContent className="p-3">
      <div className="flex gap-3">
        {article.thumbnail_url && (
          <img 
            src={article.thumbnail_url} 
            alt="" 
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="secondary" className="text-[10px]">
              {article.category}
            </Badge>
            {article.country && (
              <Badge variant="outline" className="text-[10px]">
                {article.country === 'india' ? '🇮🇳 India' : '🌐 Global'}
              </Badge>
            )}
          </div>
          <h4 className="text-sm font-medium line-clamp-2">{article.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{article.source}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const TrendingStructuredFeed: React.FC<TrendingStructuredFeedProps> = ({
  newsArticles: propArticles,
  isLoading: propLoading = false,
  filter = 'all',
}) => {
  const [promotedProfiles, setPromotedProfiles] = useState<PromotedProfile[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(propArticles || []);
  const [isLoading, setIsLoading] = useState(propLoading);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Build structured feed: news + promotions interleaved
  const feedItems: React.ReactNode[] = [];
  let newsIndex = 0;

  const buildPattern = () => {
    // First batch of news (0-3)
    for (let i = 0; i < 4 && newsIndex < newsArticles.length; i++) {
      feedItems.push(
        <NewsWidget key={`news-${newsIndex}`} article={newsArticles[newsIndex]} />
      );
      newsIndex++;
    }

    // Promoted profile
    if (promotedProfiles.length > 0) {
      feedItems.push(
        <PromotedProfileCard key="promoted" profiles={promotedProfiles} />
      );
    }

    // Remaining news
    while (newsIndex < newsArticles.length) {
      feedItems.push(
        <NewsWidget key={`news-${newsIndex}`} article={newsArticles[newsIndex]} />
      );
      newsIndex++;
    }
  };

  buildPattern();

  if (feedItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Newspaper className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No trending content available</p>
          {error && (
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <div className="space-y-3">{feedItems}</div>;
};

export default TrendingStructuredFeed;
