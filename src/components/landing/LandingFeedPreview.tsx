import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, ArrowDown, MessageSquare, Bookmark, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  // Get type label
  const getTypeLabel = (type: string) => {
    if (type === 'question') return 'Question';
    if (type === 'opinion') return 'Opinion';
    if (type === 'news') return 'News';
    return type;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Tabs value={activeTab} className="w-full mb-4">
          <TabsList className="grid grid-cols-2 w-full bg-secondary/50 rounded-xl">
            <TabsTrigger value="pulse" className="rounded-lg">Pulse</TabsTrigger>
            <TabsTrigger value="trending" className="rounded-lg">Trending</TabsTrigger>
          </TabsList>
        </Tabs>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="glass border-border/50">
            <CardHeader className="p-3 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="p-3 pt-2">
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
    <div className="space-y-3">
      {/* Tab Navigation */}
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

      {/* Post Cards - MANDATORY HEADER STRUCTURE APPLIED */}
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
            <CardHeader className="p-3 pb-2">
              {/* MANDATORY HEADER: [ @username • time ] ---- [ Type Badge ] [ ... ] */}
              <div className="flex items-center justify-between gap-2">
                {/* LEFT: Username + time - single line */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    onClick={handleInteraction}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors truncate"
                  >
                    @{post.author?.username || 'anonymous'}
                  </button>
                  <span className="text-muted-foreground shrink-0">•</span>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                {/* RIGHT: Type Badge + 3-dot menu */}
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-[10px] capitalize bg-primary/10 text-primary border-primary/30 h-5 px-1.5">
                    {getTypeLabel(post.type)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleInteraction}>Share</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleInteraction}>Copy link</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 pt-1 text-left">
              {/* Title - 2 line clamp */}
              {post.title && (
                <h3 className="text-sm font-medium mb-1 line-clamp-2">{post.title}</h3>
              )}
              {/* Body - 3 line clamp */}
              {post.body && (
                <p className="text-muted-foreground text-xs line-clamp-3">{post.body}</p>
              )}
            </CardContent>
            
            <CardFooter className="p-3 pt-0 flex justify-between">
              {/* Left: Votes + Comments - equidistant */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground h-7 px-1.5"
                    onClick={handleInteraction}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium min-w-[20px] text-center">
                    {getVoteCount(post)}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground h-7 px-1.5"
                    onClick={handleInteraction}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-muted-foreground h-7 px-2"
                  onClick={handleInteraction}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">{post.comment_count || 0}</span>
                </Button>
              </div>
              
              {/* Right: Bookmark only (Share moved to 3-dot menu) */}
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