import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, Smile } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface InlineAnswerInputProps {
  postId: string;
  parentAnswerId?: string | null;
  placeholder?: string;
  onSubmitSuccess?: () => void;
  autoFocus?: boolean;
  depth?: number;
  maxDepth?: number;
}

export const InlineAnswerInput: React.FC<InlineAnswerInputProps> = ({
  postId,
  parentAnswerId = null,
  placeholder = 'Add an answer...',
  onSubmitSuccess,
  autoFocus = false,
  depth = 0,
  maxDepth = 3,
}) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, newline on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    if (!user) {
      toast.error('Please log in to post an answer');
      return;
    }

    // Check depth limit
    if (depth >= maxDepth) {
      toast.error('Maximum reply depth reached. Please reply to a parent comment.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('answers').insert({
        post_id: postId,
        author_id: user.id,
        body_simple: content.trim(),
        body_detailed: null,
        body_steps: null,
        ai_generated: false,
        moderation_status: 'approved',
      });

      if (error) throw error;

      toast.success('Answer posted!');
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['answers', postId] });
      onSubmitSuccess?.();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to post answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8 mt-2' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-secondary">
          {getInitials(profile?.full_name || null)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`min-h-[40px] max-h-[200px] resize-none bg-secondary/50 border-border/50 rounded-xl transition-all ${
            isFocused ? 'min-h-[80px]' : ''
          }`}
          disabled={isSubmitting}
        />
        
        {(isFocused || content.trim()) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Smile className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Shift+Enter for new line
              </span>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              size="sm"
              className="h-8 gap-2 rounded-xl"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
