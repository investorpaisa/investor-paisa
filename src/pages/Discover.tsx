import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { TrendingUp, Users, AlertCircle, Search, Star, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

// Fetch trending topics
const useTrendingTopics = () => {
  return useQuery({
    queryKey: ['topics', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('is_trending', true)
        .order('follower_count', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });
};

// Fetch rising experts
const useRisingExperts = () => {
  return useQuery({
    queryKey: ['experts', 'rising'],
    queryFn: async () => {
      const { data: experts, error } = await supabase
        .from('expert_profiles')
        .select(`
          user_id,
          rating,
          session_count,
          specializations,
          verification_status
        `)
        .eq('verification_status', 'verified')
        .order('rating', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      if (!experts || experts.length === 0) return [];

      // Fetch profiles
      const userIds = experts.map(e => e.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified, followers_count')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return experts.map(e => ({
        ...e,
        profile: profilesMap.get(e.user_id),
      }));
    },
  });
};

// Fetch creator spotlights
const useCreatorSpotlights = () => {
  return useQuery({
    queryKey: ['creators', 'spotlight'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified, followers_count, posts_count')
        .eq('is_verified', true)
        .order('followers_count', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });
};

// Search hook
const useSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return { posts: [], users: [], topics: [] };

      const [postsResult, usersResult, topicsResult] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, body, type')
          .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, is_verified')
          .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('topics')
          .select('id, name, follower_count')
          .ilike('name', `%${query}%`)
          .limit(5),
      ]);

      return {
        posts: postsResult.data || [],
        users: usersResult.data || [],
        topics: topicsResult.data || [],
      };
    },
    enabled: query.length >= 2,
  });
};

// Loading skeletons
const TopicSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="border border-border/50">
        <CardContent className="p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const ExpertSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="border border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const { data: topics, isLoading: topicsLoading } = useTrendingTopics();
  const { data: experts, isLoading: expertsLoading } = useRisingExperts();
  const { data: creators, isLoading: creatorsLoading } = useCreatorSpotlights();
  const { data: searchResults, isLoading: searchLoading } = useSearch(debouncedSearch);

  const isSearching = searchQuery.length >= 2;

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading mb-2">Discover</h1>
        <p className="text-muted-foreground">Explore trending topics, experts, and creators.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts, people, topics..."
          className="pl-10 bg-secondary/50 border-border/50"
        />
        {searchLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results */}
      {isSearching && searchResults && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-4"
        >
          {/* Users */}
          {searchResults.users.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">People</h3>
              <div className="space-y-2">
                {searchResults.users.map((user: any) => (
                  <Card 
                    key={user.id} 
                    className="border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => navigate(`/profile/${user.username}`)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{user.full_name}</span>
                          {user.is_verified && <CheckCircle className="h-3 w-3 text-primary" />}
                        </div>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {searchResults.posts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Posts</h3>
              <div className="space-y-2">
                {searchResults.posts.map((post: any) => (
                  <Card 
                    key={post.id} 
                    className="border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <CardContent className="p-3">
                      <Badge variant="secondary" className="text-xs mb-1 capitalize">{post.type}</Badge>
                      <p className="text-sm font-medium line-clamp-1">{post.title || post.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {searchResults.topics.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {searchResults.topics.map((topic: any) => (
                  <Badge key={topic.id} variant="outline" className="cursor-pointer hover:bg-secondary">
                    {topic.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {searchResults.users.length === 0 && searchResults.posts.length === 0 && searchResults.topics.length === 0 && !searchLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          )}
        </motion.div>
      )}

      {/* Main Content - Hidden when searching */}
      {!isSearching && (
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="experts">Experts</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
          </TabsList>

          {/* Trending Topics */}
          <TabsContent value="trending" className="space-y-4">
            {topicsLoading && <TopicSkeleton />}
            {!topicsLoading && (!topics || topics.length === 0) && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No trending topics</h3>
                <p className="text-sm text-muted-foreground">Check back later for trending discussions.</p>
              </div>
            )}
            {!topicsLoading && topics && topics.length > 0 && (
              <div className="space-y-3">
                {topics.map((topic, index) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="font-medium">{topic.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {topic.description || 'Join the discussion'}
                            </p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {topic.follower_count || 0}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rising Experts */}
          <TabsContent value="experts" className="space-y-4">
            {expertsLoading && <ExpertSkeleton />}
            {!expertsLoading && (!experts || experts.length === 0) && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No experts found</h3>
                <p className="text-sm text-muted-foreground">Experts will appear here soon.</p>
              </div>
            )}
            {!expertsLoading && experts && experts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experts.map((expert, index) => (
                  <motion.div
                    key={expert.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/expert/${expert.user_id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={expert.profile?.avatar_url} />
                            <AvatarFallback>{expert.profile?.full_name?.charAt(0) || 'E'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm truncate">{expert.profile?.full_name || 'Expert'}</span>
                              {expert.profile?.is_verified && <CheckCircle className="h-3 w-3 text-primary shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{expert.profile?.headline || 'Financial Expert'}</p>
                            {expert.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs">{expert.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="outline" className="shrink-0">
                            Track
                          </Button>
                        </div>
                        {expert.specializations && expert.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {expert.specializations.slice(0, 3).map((spec: string) => (
                              <Badge key={spec} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Creator Spotlights */}
          <TabsContent value="creators" className="space-y-4">
            {creatorsLoading && <TopicSkeleton />}
            {!creatorsLoading && (!creators || creators.length === 0) && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No featured creators</h3>
                <p className="text-sm text-muted-foreground">Creators will be featured here soon.</p>
              </div>
            )}
            {!creatorsLoading && creators && creators.length > 0 && (
              <div className="space-y-3">
                {creators.map((creator, index) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/profile/${creator.username}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={creator.avatar_url || undefined} />
                            <AvatarFallback className="text-lg">{creator.full_name?.charAt(0) || 'C'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{creator.full_name}</span>
                              {creator.is_verified && <CheckCircle className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{creator.headline || 'Content Creator'}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{creator.followers_count || 0} followers</span>
                              <span>{creator.posts_count || 0} posts</span>
                            </div>
                          </div>
                          <Button size="sm" className="bg-primary text-primary-foreground">
                            Follow
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Discover;
