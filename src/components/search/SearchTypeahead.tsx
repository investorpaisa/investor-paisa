import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, User, Hash, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchTypeaheadProps {
  query: string;
  onClose: () => void;
  onResultClick: () => void;
}

interface SearchResults {
  posts: Array<{ id: string; title: string | null; body: string | null; type: string }>;
  users: Array<{ id: string; full_name: string | null; username: string | null; avatar_url: string | null; is_verified: boolean | null }>;
  topics: Array<{ id: string; name: string; follower_count: number | null }>;
}

export const SearchTypeahead: React.FC<SearchTypeaheadProps> = ({ query, onClose, onResultClick }) => {
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 150);
  const [results, setResults] = useState<SearchResults>({ posts: [], users: [], topics: [] });
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults({ posts: [], users: [], topics: [] });
      return;
    }

    const search = async () => {
      setIsLoading(true);
      try {
        const [postsResult, usersResult, topicsResult] = await Promise.all([
          supabase
            .from('posts')
            .select('id, title, body, type')
            .or(`title.ilike.%${debouncedQuery}%,body.ilike.%${debouncedQuery}%`)
            .eq('moderation_status', 'approved')
            .is('deleted_at', null)
            .limit(3),
          supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, is_verified')
            .or(`full_name.ilike.%${debouncedQuery}%,username.ilike.%${debouncedQuery}%`)
            .limit(3),
          supabase
            .from('topics')
            .select('id, name, follower_count')
            .ilike('name', `%${debouncedQuery}%`)
            .limit(3),
        ]);

        setResults({
          posts: postsResult.data || [],
          users: usersResult.data || [],
          topics: topicsResult.data || [],
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
    onResultClick();
  };

  const handleUserClick = (username: string | null) => {
    if (username) {
      navigate(`/u/${username}`);
      onResultClick();
    }
  };

  const handleTopicClick = (topicName: string) => {
    navigate(`/feed?topic=${encodeURIComponent(topicName)}`);
    onResultClick();
  };

  const hasResults = results.posts.length > 0 || results.users.length > 0 || results.topics.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
      >
        {isLoading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !hasResults && query.length > 0 && (
          <div className="p-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Start typing to explore knowledge</p>
          </div>
        )}

        {!isLoading && hasResults && (
          <div className="divide-y divide-border/50">
            {/* Posts */}
            {results.posts.length > 0 && (
              <div className="p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Posts
                </h4>
                <div className="space-y-2">
                  {results.posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                      onClick={() => handlePostClick(post.id)}
                    >
                      <Badge variant="outline" className="text-xs capitalize shrink-0">
                        {post.type}
                      </Badge>
                      <span className="text-sm line-clamp-1">
                        {post.title || post.body?.substring(0, 50)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* People */}
            {results.users.length > 0 && (
              <div className="p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  People
                </h4>
                <div className="space-y-2">
                  {results.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                      onClick={() => handleUserClick(user.username)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {user.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground truncate">@{user.username || 'user'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {results.topics.length > 0 && (
              <div className="p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Topics
                </h4>
                <div className="space-y-2">
                  {results.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                      onClick={() => handleTopicClick(topic.name)}
                    >
                      <span className="text-sm font-medium">#{topic.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {topic.follower_count || 0} followers
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
