import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, Bookmark, TrendingUp } from 'lucide-react';
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
  like_count: number | null;
  comment_count: number | null;
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
}

export const LandingFeedPreview: React.FC<LandingFeedPreviewProps> = ({ onAuthRequired }) => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['landing-feed-preview'],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, title, body, type, created_at, like_count, comment_count, author_id')
        .eq('moderation_status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!postsData || postsData.length === 0) return [];

      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, is_verified')
        .in('id', authorIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return postsData.map(post => ({
        ...post,
        author: profilesMap.get(post.author_id) || null,
      })) as PostWithAuthor[];
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const handleInteraction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAuthRequired();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="glass border-border/50">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
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
      <div className="text-center py-12 text-muted-foreground">
        <p>No posts yet. Be the first to ask!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.4 }}
        >
          <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.author?.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.author?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">
                        {post.author?.full_name || 'Anonymous'}
                      </span>
                      {post.author?.is_verified && (
                        <TrendingUp className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>@{post.author?.username || 'user'}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
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
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-muted-foreground"
                  onClick={handleInteraction}
                >
                  <Heart className="h-4 w-4" />
                  <span>{post.like_count || 0}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-muted-foreground"
                  onClick={handleInteraction}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comment_count || 0}</span>
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
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
