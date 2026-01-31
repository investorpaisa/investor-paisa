import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageSquare, Share2, Bookmark, ArrowLeft, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToggleReaction, useUserReaction } from '@/hooks/useReactions';
import { useToggleBookmark, useIsBookmarked } from '@/hooks/useBookmarks';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AnswerBottomSheet } from '@/components/answer/AnswerBottomSheet';
import { useUIStore } from '@/stores/uiStore';

interface Answer {
  id: string;
  body_simple: string | null;
  body_detailed: string | null;
  body_steps: any;
  created_at: string;
  is_accepted: boolean | null;
  upvote_count: number | null;
  author_id: string;
  author?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
}

// Skeleton for post detail page
const PostDetailSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Card className="border border-border/50 bg-card/50">
      <CardHeader className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-3/4" />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
    
    <div className="space-y-4">
      <Skeleton className="h-6 w-24" />
      {[1, 2, 3].map(i => (
        <Card key={i} className="border border-border/50 bg-card/50">
          <CardHeader className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toggleReaction = useToggleReaction();
  const toggleBookmark = useToggleBookmark();
  const { isAnswerSheetOpen, openAnswerSheet, closeAnswerSheet } = useUIStore();
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);

  // Fetch post
  const { data: post, isLoading: postLoading, error: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      const { data: postData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      // Fetch author
      const { data: author } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .eq('id', postData.author_id)
        .single();
      
      return { ...postData, author };
    },
    enabled: !!postId,
  });

  // Fetch answers
  const { data: answers, isLoading: answersLoading } = useQuery({
    queryKey: ['answers', postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const { data: answersData, error } = await supabase
        .from('answers')
        .select('id, body_simple, body_detailed, body_steps, created_at, is_accepted, upvote_count, author_id')
        .eq('post_id', postId)
        .order('is_accepted', { ascending: false })
        .order('upvote_count', { ascending: false });
      
      if (error) throw error;
      if (!answersData || answersData.length === 0) return [];
      
      // Fetch authors
      const authorIds = [...new Set(answersData.map(a => a.author_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, is_verified')
        .in('id', authorIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      return answersData.map(answer => ({
        ...answer,
        author: profilesMap.get(answer.author_id) || null,
      })) as Answer[];
    },
    enabled: !!postId,
  });

  const { data: userReactions } = useUserReaction(postId || '', 'post');
  const { data: isBookmarked } = useIsBookmarked(postId || '');
  const isLiked = userReactions?.some(r => r.reaction_type === 'like') || false;

  const handleLike = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!postId) return;
    
    toggleReaction.mutate({
      entityId: postId,
      entityType: 'post',
      reactionType: 'like',
    });
  };

  const handleSave = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!postId) return;
    
    toggleBookmark.mutate({
      entityId: postId,
      entityType: 'post',
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (postLoading || answersLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <PostDetailSkeleton />
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Post not found</h3>
          <p className="text-muted-foreground text-sm mb-4">This post may have been deleted or doesn't exist.</p>
          <Button onClick={() => navigate('/feed')}>Go to Feed</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Post Hero */}
        <Card className="border border-border/50 bg-card/50 mb-6">
          <CardHeader className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar 
                className="h-12 w-12 cursor-pointer"
                onClick={() => post.author?.username && navigate(`/profile/${post.author.username}`)}
              >
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-lg">
                  {post.author?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="font-medium hover:underline cursor-pointer"
                    onClick={() => post.author?.username && navigate(`/profile/${post.author.username}`)}
                  >
                    {post.author?.full_name || 'Anonymous'}
                  </span>
                  {post.author?.is_verified && (
                    <TrendingUp className="h-4 w-4 text-primary" />
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {post.type}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  @{post.author?.username || 'user'} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            {post.title && (
              <h1 className="text-2xl font-bold font-heading">{post.title}</h1>
            )}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {post.body && (
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.body}</p>
            )}
          </CardContent>
          <CardFooter className="p-6 pt-0 flex justify-between border-t border-border/50 mt-4 pt-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${isLiked ? 'text-primary' : ''}`}
                onClick={handleLike}
              >
                <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                <span>{post.like_count || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{answers?.length || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className={isBookmarked ? 'text-primary' : ''}
              onClick={handleSave}
            >
              <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
            </Button>
          </CardFooter>
        </Card>

        {/* Answers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              {answers && answers.length > 0 ? `${answers.length} Answers` : 'Answers'}
            </h2>
            <Button 
              className="bg-primary text-primary-foreground"
              onClick={() => {
                if (!user) {
                  navigate('/auth');
                  return;
                }
                setShowAnswerSheet(true);
              }}
            >
              Answer
            </Button>
          </div>

          {answers && answers.length === 0 && (
            <Card className="border border-border/50 bg-card/50">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No answers yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Be the first to help!</p>
                <Button 
                  className="bg-primary text-primary-foreground"
                  onClick={() => {
                    if (!user) {
                      navigate('/auth');
                      return;
                    }
                    setShowAnswerSheet(true);
                  }}
                >
                  Write an Answer
                </Button>
              </CardContent>
            </Card>
          )}

          {answers && answers.map((answer, index) => (
            <motion.div
              key={answer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card className={`border ${answer.is_accepted ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-card/50'}`}>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={answer.author?.avatar_url || undefined} />
                        <AvatarFallback className="bg-secondary">
                          {answer.author?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{answer.author?.full_name || 'Anonymous'}</span>
                          {answer.author?.is_verified && (
                            <TrendingUp className="h-3 w-3 text-primary" />
                          )}
                          {answer.is_accepted && (
                            <Badge className="bg-primary/20 text-primary text-xs">Accepted</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-foreground text-sm whitespace-pre-wrap">
                    {answer.body_simple || answer.body_detailed || 'No content'}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{answer.upvote_count || 0}</span>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Answer Bottom Sheet */}
      <AnimatePresence>
        {showAnswerSheet && post && (
          <AnswerBottomSheet
            postId={post.id}
            postTitle={post.title}
            postBody={post.body}
            onClose={() => setShowAnswerSheet(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostDetail;
