import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, ArrowDown, MessageSquare, Bookmark, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface LandingFeedPreviewProps {
  onAuthRequired: () => void;
}

interface PostWithAuthor {
  id: string;
  title: string | null;
  body: string | null;
  type: string;
  created_at: string;
  upvote_count: number | null;
  downvote_count: number | null;
  comment_count: number | null;
  author?: {
    username: string | null;
  } | null;
}

type FeedTab = 'pulse' | 'trending';

export const LandingFeedPreview: React.FC<LandingFeedPreviewProps> = ({ onAuthRequired }) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('pulse');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['landing-feed-preview', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('id, title, body, type, created_at, upvote_count, downvote_count, comment_count, author_id')
        .eq('moderation_status', 'approved')
        .is('deleted_at', null)
        .limit(10);

      if (activeTab === 'pulse') {
        query = query.eq('type', 'question').order('created_at', { ascending: false });
      } else {
        // Trending: last 48 hours, sorted by votes
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        query = query
          .gte('created_at', twoDaysAgo)
          .order('upvote_count', { ascending: false });
      }

      const { data: postsData, error } = await query;

      if (error) throw error;
      if (!postsData || postsData.length === 0) return [];

      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', authorIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, { username: p.username }]) || []);

      return postsData.map(post => ({
        ...post,
        author: profilesMap.get(post.author_id) || null,
      })) as PostWithAuthor[];
    },
    staleTime: 60000,
  });

  const handleInteraction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAuthRequired();
  };

  const getVoteCount = (post: PostWithAuthor) => {
    return (post.upvote_count || 0) - (post.downvote_count || 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Tabs value={activeTab} className="w-full mb-4">
          <TabsList className="grid grid-cols-2 w-full bg-secondary/50 rounded-xl">
            <TabsTrigger value="pulse" className="rounded-lg">Pulse</TabsTrigger>
            <TabsTrigger value="trending" className="rounded-lg">Trending</TabsTrigger>
          </TabsList>
        </Tabs>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="glass border-border/50">
            <CardHeader className="p-4 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-secondary/50 border border-border/50 rounded-xl p-1">
            <TabsTrigger value="pulse" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              Pulse
            </TabsTrigger>
            <TabsTrigger value="trending" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              Trending
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-primary/60" />
          </div>
          <p className="font-medium text-foreground mb-1">Be the first to ask!</p>
          <p className="text-sm text-muted-foreground">Start a conversation about money</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation - Only Pulse and Trending for logged-out users */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as FeedTab)} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full bg-secondary/50 border border-border/50 rounded-xl p-1">
          <TabsTrigger
            value="pulse" 
            className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
          >
            Pulse
          </TabsTrigger>
          <TabsTrigger 
            value="trending" 
            className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
          >
            Trending
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Post Cards - Username only, no avatar for logged-out */}
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.4 }}
        >
          <Card 
            className="glass border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer"
            onClick={handleInteraction}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {/* Username only - no avatar for logged-out users */}
                  <button
                    onClick={handleInteraction}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    @{post.author?.username || 'anonymous'}
                  </button>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {post.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {post.title && (
                <h3 className="text-base font-medium mb-1 line-clamp-2">{post.title}</h3>
              )}
              {post.body && (
                <p className="text-muted-foreground text-sm line-clamp-2">{post.body}</p>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <div className="flex items-center gap-1">
                {/* Upvote/Downvote buttons */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-muted-foreground h-7 px-2"
                  onClick={handleInteraction}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[20px] text-center">
                  {getVoteCount(post)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-muted-foreground h-7 px-2"
                  onClick={handleInteraction}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-muted-foreground ml-2 h-7 px-2"
                  onClick={handleInteraction}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">{post.comment_count || 0}</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground h-7 px-2"
                  onClick={handleInteraction}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground h-7 px-2"
                onClick={handleInteraction}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
