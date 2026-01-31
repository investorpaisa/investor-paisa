import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/uiStore';
import { useQueryClient } from '@tanstack/react-query';

interface AnswerBottomSheetProps {
  postId: string;
  postTitle?: string;
  postBody?: string;
  onClose: () => void;
}

interface GeneratedAnswer {
  simple: string;
  detailed: string;
  steps: string[];
}

export const AnswerBottomSheet: React.FC<AnswerBottomSheetProps> = ({ 
  postId, 
  postTitle, 
  postBody, 
  onClose 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAnswerSheetState } = useUIStore();
  
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<GeneratedAnswer | null>(null);
  const [activeTab, setActiveTab] = useState<'simple' | 'detailed' | 'steps'>('simple');
  const [editedContent, setEditedContent] = useState('');

  // Generate answer on mount
  useEffect(() => {
    const generateAnswer = async () => {
      setIsGenerating(true);
      setAnswerSheetState('generating');
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-answer`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              title: postTitle,
              body: postBody,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to generate');

        const data = await response.json();
        setGeneratedAnswer(data);
        setEditedContent(data.simple);
        setAnswerSheetState('open');
      } catch (error) {
        console.error('Generate error:', error);
        toast.error('Failed to generate answer');
        setAnswerSheetState('error');
      } finally {
        setIsGenerating(false);
      }
    };

    generateAnswer();
  }, [postId, postTitle, postBody, setAnswerSheetState]);

  // Update edited content when tab changes
  useEffect(() => {
    if (!generatedAnswer) return;
    
    switch (activeTab) {
      case 'simple':
        setEditedContent(generatedAnswer.simple);
        break;
      case 'detailed':
        setEditedContent(generatedAnswer.detailed);
        break;
      case 'steps':
        setEditedContent(generatedAnswer.steps.join('\n\n'));
        break;
    }
  }, [activeTab, generatedAnswer]);

  const handleSubmit = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!editedContent.trim()) return;

    setIsSubmitting(true);
    setAnswerSheetState('submitting');

    try {
      const { error } = await supabase.from('answers').insert({
        post_id: postId,
        author_id: user.id,
        body_simple: activeTab === 'simple' ? editedContent : generatedAnswer?.simple,
        body_detailed: activeTab === 'detailed' ? editedContent : generatedAnswer?.detailed,
        body_steps: activeTab === 'steps' ? editedContent.split('\n\n') : generatedAnswer?.steps,
        ai_generated: true,
        moderation_status: 'approved',
      });

      if (error) throw error;

      toast.success('Answer posted!');
      queryClient.invalidateQueries({ queryKey: ['answers', postId] });
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to post answer');
      setAnswerSheetState('error');
    } finally {
      setIsSubmitting(false);
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
          <h3 className="text-lg font-semibold font-heading flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Generated Answer
          </h3>
        </div>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-sm">Generating answer...</p>
          </div>
        ) : generatedAnswer ? (
          <>
            {/* Format Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="simple">Simple</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[200px] bg-secondary/50 border-border/50"
                  placeholder="Edit your answer..."
                />
              </div>
            </Tabs>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!editedContent.trim() || isSubmitting}
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
                  Post Answer
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Failed to generate answer. Please try again.
          </div>
        )}
      </div>
    </motion.div>
  );
};
