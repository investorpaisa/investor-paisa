import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/uiStore';
import { useQueryClient } from '@tanstack/react-query';

interface AskBottomSheetProps {
  onAskPaisaBot: () => void;
  onClose: () => void;
}

export const AskBottomSheet: React.FC<AskBottomSheetProps> = ({ onAskPaisaBot, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setAskSheetState, closeAskSheet } = useUIStore();
  
  const [question, setQuestion] = useState('');
  const [rewrittenQuestion, setRewrittenQuestion] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const debouncedQuestion = useDebounce(question, 300);

  // Focus textarea on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // AI rewrite on debounced input
  useEffect(() => {
    if (debouncedQuestion.length < 10) {
      setRewrittenQuestion('');
      setSuggestedTags([]);
      return;
    }

    const rewrite = async () => {
      setIsRewriting(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-rewrite`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: debouncedQuestion }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          setRewrittenQuestion(data.rewritten);
        }
      } catch (error) {
        console.error('Rewrite error:', error);
      } finally {
        setIsRewriting(false);
      }
    };

    const suggestTags = async () => {
      setIsSuggestingTags(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-suggest-tags`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: debouncedQuestion }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestedTags(data.tags || []);
        }
      } catch (error) {
        console.error('Tags error:', error);
      } finally {
        setIsSuggestingTags(false);
      }
    };

    rewrite();
    suggestTags();
  }, [debouncedQuestion]);

  const handlePost = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const content = rewrittenQuestion || question;
    if (!content.trim()) return;

    setIsSubmitting(true);
    setAskSheetState('submitting');

    try {
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        title: content.length > 100 ? content.substring(0, 100) + '...' : content,
        body: content,
        type: 'question',
        moderation_status: 'approved',
      });

      if (error) throw error;

      toast.success('Question posted!');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      closeAskSheet();
      navigate('/feed');
    } catch (error) {
      console.error('Post error:', error);
      toast.error('Failed to post question');
      setAskSheetState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const useRewritten = () => {
    if (rewrittenQuestion) {
      setQuestion(rewrittenQuestion);
      setRewrittenQuestion('');
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-40 bg-card border-t border-border rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold font-heading">Ask a Question</h3>
        </div>

        {/* Input */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="What would you like to know about investing, markets, or personal finance?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] resize-none bg-secondary/50 border-border/50 focus:border-primary/50"
          />
          {isRewriting && (
            <div className="absolute bottom-2 right-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* AI Rewrite suggestion */}
        {rewrittenQuestion && rewrittenQuestion !== question && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2 text-xs text-primary">
              <Sparkles className="h-3 w-3" />
              AI-improved version
            </div>
            <p className="text-sm text-foreground/80 mb-2">{rewrittenQuestion}</p>
            <Button size="sm" variant="ghost" onClick={useRewritten} className="text-xs">
              Use this version
            </Button>
          </motion.div>
        )}

        {/* Tags */}
        {suggestedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Post Button */}
        <Button
          onClick={handlePost}
          disabled={!question.trim() || isSubmitting}
          className="w-full gap-2 bg-primary text-primary-foreground h-12 rounded-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Post Question
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
