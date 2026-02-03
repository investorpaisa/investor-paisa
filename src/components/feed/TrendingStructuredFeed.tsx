import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Crown, ExternalLink, Star, Users, Newspaper } from 'lucide-react';
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
}

interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  followers_count: number;
  is_verified: boolean;
  rank: number;
  badge: string | null;
}

interface TrendingStructuredFeedProps {
  newsArticles?: NewsArticle[];
  isLoading?: boolean;
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
          <Badge variant="secondary" className="text-[10px] mb-1">
            {article.category}
          </Badge>
          <h4 className="text-sm font-medium line-clamp-2">{article.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{article.source}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Leaderboard Widget removed as per user request

export const TrendingStructuredFeed: React.FC<TrendingStructuredFeedProps> = ({
  newsArticles = [],
  isLoading = false,
}) => {
  const [promotedProfiles, setPromotedProfiles] = useState<PromotedProfile[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
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
      } catch (error) {
        console.error('Failed to fetch promotions:', error);
      } finally {
        setLoadingPromotions(false);
      }
    };

    fetchPromotions();
  }, []);

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

  // Pattern: 4 news, promoted profile, 4 news, leaderboard, repeat
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

    // Second batch of news (4-7)
    for (let i = 0; i < 4 && newsIndex < newsArticles.length; i++) {
      feedItems.push(
        <NewsWidget key={`news-${newsIndex}`} article={newsArticles[newsIndex]} />
      );
      newsIndex++;
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
          <p className="text-muted-foreground">No trending content available</p>
        </CardContent>
      </Card>
    );
  }

  return <div className="space-y-3">{feedItems}</div>;
};

export default TrendingStructuredFeed;
