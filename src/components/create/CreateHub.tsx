import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, X, Loader2, FileText, LayoutGrid, Lightbulb, Video, Send, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ConvertedContent {
  title: string;
  thread: string[];
  carousel: { title: string; content: string }[];
  tip: { title: string; content: string };
  video: { hook: string; body: string; cta: string };
  source_type: string;
  tags: string[];
}

export const CreateHub: React.FC = () => {
  const { isCreateHubOpen, setCreateHubOpen } = useUIStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedContent, setConvertedContent] = useState<ConvertedContent | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'thread' | 'carousel' | 'tip' | 'video'>('thread');
  const [editedContent, setEditedContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConvert = async () => {
    if (!url.trim()) return;

    setIsConverting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-convert-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        }
      );

      if (!response.ok) throw new Error('Failed to convert');

      const data = await response.json();
      setConvertedContent(data);
      setSelectedFormat('thread');
      updateEditedContent(data, 'thread');
    } catch (error) {
      console.error('Convert error:', error);
      toast.error('Failed to convert link');
    } finally {
      setIsConverting(false);
    }
  };

  const updateEditedContent = (content: ConvertedContent, format: string) => {
    switch (format) {
      case 'thread':
        setEditedContent(content.thread.join('\n\n'));
        break;
      case 'carousel':
        setEditedContent(content.carousel.map(s => `**${s.title}**\n${s.content}`).join('\n\n---\n\n'));
        break;
      case 'tip':
        setEditedContent(`**${content.tip.title}**\n\n${content.tip.content}`);
        break;
      case 'video':
        setEditedContent(`**Hook:** ${content.video.hook}\n\n${content.video.body}\n\n**CTA:** ${content.video.cta}`);
        break;
    }
  };

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format as any);
    if (convertedContent) {
      updateEditedContent(convertedContent, format);
    }
  };

  const handlePublish = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!editedContent.trim()) return;

    setIsSubmitting(true);
    try {
      const postType = selectedFormat === 'tip' ? 'tip' : 'thread';
      
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        title: convertedContent?.title || 'Shared Content',
        body: editedContent,
        type: postType,
        link_url: url,
        moderation_status: 'approved',
      });

      if (error) throw error;

      toast.success('Published successfully!');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setCreateHubOpen(false);
      resetState();
      navigate('/feed');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setUrl('');
    setConvertedContent(null);
    setEditedContent('');
    setSelectedFormat('thread');
  };

  const handleClose = () => {
    setCreateHubOpen(false);
    resetState();
  };

  if (!isCreateHubOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 h-[90vh] bg-card border-t border-border rounded-t-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              {convertedContent && (
                <Button variant="ghost" size="icon" onClick={resetState} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-lg font-semibold font-heading">Create Content</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto h-[calc(100%-4rem)]">
            {!convertedContent ? (
              /* Drop Zone / URL Input */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">Drop a link</h3>
                  <p className="text-muted-foreground">Paste a YouTube video, article, or social post to convert it into InvestorPaisa content</p>
                </div>

                <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-8 flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                      <Link2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="w-full max-w-md space-y-4">
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste URL here..."
                        className="text-center bg-secondary/50"
                      />
                      <Button
                        onClick={handleConvert}
                        disabled={!url.trim() || isConverting}
                        className="w-full gap-2 bg-primary text-primary-foreground"
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4" />
                            Convert Link
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Thread</h4>
                        <p className="text-xs text-muted-foreground">Multi-part post</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <LayoutGrid className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Carousel</h4>
                        <p className="text-xs text-muted-foreground">Slide deck</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Tip</h4>
                        <p className="text-xs text-muted-foreground">Quick insight</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Video className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Video Script</h4>
                        <p className="text-xs text-muted-foreground">Short-form</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              /* Content Editor */
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-2">{convertedContent.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {convertedContent.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Tabs value={selectedFormat} onValueChange={handleFormatChange}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="thread" className="gap-1">
                      <FileText className="h-3 w-3" />
                      Thread
                    </TabsTrigger>
                    <TabsTrigger value="carousel" className="gap-1">
                      <LayoutGrid className="h-3 w-3" />
                      Carousel
                    </TabsTrigger>
                    <TabsTrigger value="tip" className="gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Tip
                    </TabsTrigger>
                    <TabsTrigger value="video" className="gap-1">
                      <Video className="h-3 w-3" />
                      Video
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4">
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[300px] bg-secondary/50 border-border/50 font-mono text-sm"
                      placeholder="Edit your content..."
                    />
                  </div>
                </Tabs>

                <Button
                  onClick={handlePublish}
                  disabled={!editedContent.trim() || isSubmitting}
                  className="w-full gap-2 bg-primary text-primary-foreground h-12 rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
