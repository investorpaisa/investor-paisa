
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, Users, AlertCircle } from 'lucide-react';
import { useTopics, useTrendingTopics, useToggleTopicFollow, useIsFollowingTopic } from '@/hooks/useTopics';
import { useAuth } from '@/contexts/AuthContext';

const Discover: React.FC = () => {
  const { data: allTopics, isLoading: isLoadingAll, error: errorAll } = useTopics();
  const { data: trendingTopics, isLoading: isLoadingTrending, error: errorTrending } = useTrendingTopics(10);

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="pb-2">
            <Skeleton className="h-4 w-full" />
          </CardContent>
          <CardFooter className="pt-2">
            <Skeleton className="h-4 w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <Card className="p-8 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No topics found</h3>
      <p className="text-muted-foreground">Check back later for trending discussions.</p>
    </Card>
  );

  const renderErrorState = () => (
    <Card className="p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">Failed to load topics</h3>
      <p className="text-muted-foreground mb-4">Something went wrong. Please try again.</p>
      <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">Explore trending topics and discussions in the investing community.</p>
      </div>

      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="all">All Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          {isLoadingTrending && renderLoadingSkeleton()}
          {errorTrending && renderErrorState()}
          {!isLoadingTrending && !errorTrending && (!trendingTopics || trendingTopics.length === 0) && renderEmptyState()}
          {!isLoadingTrending && !errorTrending && trendingTopics && trendingTopics.length > 0 && (
            <div className="space-y-4">
              {trendingTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {isLoadingAll && renderLoadingSkeleton()}
          {errorAll && renderErrorState()}
          {!isLoadingAll && !errorAll && (!allTopics || allTopics.length === 0) && renderEmptyState()}
          {!isLoadingAll && !errorAll && allTopics && allTopics.length > 0 && (
            <div className="space-y-4">
              {allTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TopicCardProps {
  topic: {
    id: string;
    name: string;
    description: string | null;
    post_count: number | null;
    follower_count: number | null;
    is_trending: boolean | null;
    color: string | null;
  };
}

const TopicCard: React.FC<TopicCardProps> = ({ topic }) => {
  const { user } = useAuth();
  const { data: isFollowing } = useIsFollowingTopic(topic.id);
  const toggleFollow = useToggleTopicFollow();

  const handleFollowClick = () => {
    if (!user) {
      return;
    }
    toggleFollow.mutate(topic.id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            {topic.is_trending && (
              <div className="text-sm text-primary font-medium mb-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Trending
              </div>
            )}
            <CardTitle className="text-lg">{topic.name}</CardTitle>
          </div>
          {user && (
            <Button 
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              onClick={handleFollowClick}
              disabled={toggleFollow.isPending}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground text-sm">
          {topic.description || 'Join the discussion with other investors and financial experts.'}
        </p>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex justify-between pt-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {topic.follower_count || 0} followers
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {topic.post_count || 0} posts
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Discover;
