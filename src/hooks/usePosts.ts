
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Post {
  id: string;
  title: string | null;
  body: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  upvote_count: number | null;
  downvote_count: number | null;
  save_count: number | null;
  author_id: string;
  media_urls: string[] | null;
  author?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    headline: string | null;
    is_verified: boolean | null;
  } | null;
}

export interface CreatePostInput {
  title?: string;
  body: string;
  type?: 'question' | 'tip' | 'thread' | 'video' | 'poll' | 'link_converted' | 'insight';
  media_urls?: string[];
}

// Fetch all posts with author info
export const usePosts = (limit = 20) => {
  return useQuery({
    queryKey: ['posts', limit],
    queryFn: async () => {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('moderation_status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) throw postsError;
      if (!postsData || postsData.length === 0) return [];

      // Get unique author IDs
      const authorIds = [...new Set(postsData.map(p => p.author_id))];

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .in('id', authorIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return postsData.map(post => ({
        ...post,
        author: profilesMap.get(post.author_id) || null,
      })) as Post[];
    },
  });
};

// Fetch single post
export const usePost = (postId: string | undefined) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null;

      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Fetch author
      const { data: author } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, is_verified')
        .eq('id', post.author_id)
        .single();

      return { ...post, author } as Post;
    },
    enabled: !!postId,
  });
};

// Create post mutation
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!user?.id) throw new Error('Must be logged in to create a post');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          title: input.title || null,
          body: input.body,
          type: input.type || 'insight',
          media_urls: input.media_urls || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create post: ' + error.message);
    },
  });
};

// Update post mutation
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: Partial<CreatePostInput> }) => {
      const { data, error } = await supabase
        .from('posts')
        .update({
          title: updates.title,
          body: updates.body,
          type: updates.type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      toast.success('Post updated!');
    },
    onError: (error) => {
      toast.error('Failed to update post: ' + error.message);
    },
  });
};

// Delete post mutation
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete post: ' + error.message);
    },
  });
};
