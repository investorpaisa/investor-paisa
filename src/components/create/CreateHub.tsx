import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, X, Loader2, FileText, Lightbulb, Send, ArrowLeft, Users, Handshake, MessageSquare, HelpCircle, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTier } from '@/hooks/useUserTier';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface ConvertedContent {
  title: string;
  thread: string[];
  carousel: { title: string; content: string }[];
  tip: { title: string; content: string };
  video: { hook: string; body: string; cta: string };
  source_type: string;
  tags: string[];
}

type CreateOption = 'question' | 'opinion' | 'community' | 'collab';

export const CreateHub: React.FC = () => {
  const { isCreateHubOpen, setCreateHubOpen } = useUIStore();
  const { user } = useAuth();
  const { permissions, tier, isVerified } = useUserTier();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedContent, setConvertedContent] = useState<ConvertedContent | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'thread' | 'carousel' | 'tip' | 'video'>('thread');
  const [editedContent, setEditedContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<CreateOption | null>(null);
  
  // Direct post form state
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'community'>('public');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  // Fetch user's communities for the selector
  const { data: userCommunities } = useQuery({
    queryKey: ['user-communities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id, communities(id, name, is_closed)')
        .eq('user_id', user.id);
      if (error) return [];
      return data?.map((m: any) => m.communities).filter(Boolean) || [];
    },
    enabled: !!user?.id,
  });

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

    // Check permissions for posting
    if (!permissions.canPostOpinion) {
      toast.error('Please verify your account to post content');
      return;
    }

    const content = convertedContent ? editedContent : postBody;
    const title = convertedContent ? convertedContent.title : postTitle;

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const postType = selectedOption === 'question' ? 'question' : 
                       selectedOption === 'opinion' ? 'insight' : 
                       selectedFormat === 'tip' ? 'tip' : 'thread';
      
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        title: title || 'Shared Content',
        body: content,
        type: postType,
        link_url: url || null,
        moderation_status: 'approved',
        community_id: postVisibility === 'community' ? selectedCommunityId : null,
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
    setSelectedOption(null);
    setPostTitle('');
    setPostBody('');
    setPostVisibility('public');
    setSelectedCommunityId(null);
  };

  const handleClose = () => {
    setCreateHubOpen(false);
    resetState();
  };

  const handleOptionSelect = (option: CreateOption) => {
    if (option === 'collab') {
      toast.info('Brand Collaboration is coming soon!');
      return;
    }
    setSelectedOption(option);
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
              {(convertedContent || selectedOption) && (
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
            {!convertedContent && !selectedOption ? (
              /* Create Options */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">What would you like to create?</h3>
                  <p className="text-muted-foreground">Choose an option to get started</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleOptionSelect('question')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Ask Question</h4>
                        <p className="text-xs text-muted-foreground">Get expert answers</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card 
                    className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleOptionSelect('opinion')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Share Opinion</h4>
                        <p className="text-xs text-muted-foreground">Share your insights</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card 
                    className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleOptionSelect('community')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Create Community</h4>
                        <p className="text-xs text-muted-foreground">Build your circle</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card 
                    className="p-4 cursor-pointer hover:border-muted transition-colors opacity-60"
                    onClick={() => handleOptionSelect('collab')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Handshake className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          Brand Collaboration
                          <Badge variant="secondary" className="text-[10px]">Soon</Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground">Partner with brands</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Link Conversion Section */}
                <div className="pt-6 border-t border-border/50">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">Or convert a link</h3>
                    <p className="text-muted-foreground text-sm">Paste a YouTube video, article, or social post</p>
                  </div>

                  <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                        <Link2 className="h-6 w-6 text-muted-foreground" />
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
                </div>
              </div>
            ) : selectedOption && !convertedContent ? (
              /* Direct Post Form */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">
                    {selectedOption === 'question' ? 'Ask a Question' : 
                     selectedOption === 'opinion' ? 'Share Your Opinion' :
                     'Create Community'}
                  </h3>
                </div>

                {selectedOption === 'community' ? (
                  <div className="space-y-4">
                    <Input
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Community name"
                      className="bg-secondary/50"
                    />
                    <Textarea
                      value={postBody}
                      onChange={(e) => setPostBody(e.target.value)}
                      placeholder="What's this community about?"
                      className="min-h-[150px] bg-secondary/50"
                    />
                    <Button
                      onClick={async () => {
                        if (!user) {
                          navigate('/auth');
                          return;
                        }
                        if (!postTitle.trim()) {
                          toast.error('Please enter a community name');
                          return;
                        }
                        setIsSubmitting(true);
                        try {
                          const { error } = await supabase.from('communities').insert({
                            name: postTitle,
                            objective: postBody,
                            creator_id: user.id,
                            is_closed: false,
                          });
                          if (error) throw error;
                          toast.success('Community created!');
                          setCreateHubOpen(false);
                          resetState();
                        } catch (err) {
                          toast.error('Failed to create community');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={!postTitle.trim() || isSubmitting}
                      className="w-full gap-2 bg-primary text-primary-foreground h-12 rounded-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4" />
                          Create Community
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Permission check for unverified users */}
                    {!permissions.canPostOpinion && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                        <p className="text-sm text-amber-500 font-medium">
                          Verify your account to post content
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2 border-amber-500/30 text-amber-500"
                          onClick={() => {
                            handleClose();
                            navigate('/profile/edit');
                          }}
                        >
                          Verify Now
                        </Button>
                      </div>
                    )}
                    
                    <Input
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder={selectedOption === 'question' ? "What's your question?" : "Title"}
                      className="bg-secondary/50"
                      disabled={!permissions.canPostOpinion}
                    />
                    <Textarea
                      value={postBody}
                      onChange={(e) => setPostBody(e.target.value)}
                      placeholder={selectedOption === 'question' 
                        ? "Add more context to help others answer..."
                        : "Share your thoughts..."
                      }
                      className="min-h-[150px] bg-secondary/50"
                      disabled={!permissions.canPostOpinion}
                    />
                    
                    {/* Visibility Selector - Public or Community */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Post to</label>
                      <Select 
                        value={postVisibility} 
                        onValueChange={(val: 'public' | 'community') => {
                          setPostVisibility(val);
                          if (val === 'public') setSelectedCommunityId(null);
                        }}
                        disabled={!permissions.canPostOpinion}
                      >
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Public
                            </div>
                          </SelectItem>
                          <SelectItem value="community">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Community
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Community selector when visibility is community */}
                    {postVisibility === 'community' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Community</label>
                        <Select 
                          value={selectedCommunityId || ''} 
                          onValueChange={setSelectedCommunityId}
                          disabled={!permissions.canPostOpinion}
                        >
                          <SelectTrigger className="bg-secondary/50">
                            <SelectValue placeholder="Choose a community" />
                          </SelectTrigger>
                          <SelectContent>
                            {userCommunities?.map((community: any) => (
                              <SelectItem key={community.id} value={community.id}>
                                <div className="flex items-center gap-2">
                                  {community.is_closed ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                  {community.name}
                                </div>
                              </SelectItem>
                            ))}
                            {(!userCommunities || userCommunities.length === 0) && (
                              <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                You haven't joined any communities yet
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button
                      onClick={handlePublish}
                      disabled={!postTitle.trim() || isSubmitting || !permissions.canPostOpinion || (postVisibility === 'community' && !selectedCommunityId)}
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
            ) : (
              /* Content Editor (from link conversion) */
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-2">{convertedContent?.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {convertedContent?.tags.map((tag) => (
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
                      <FileText className="h-3 w-3" />
                      Carousel
                    </TabsTrigger>
                    <TabsTrigger value="tip" className="gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Tip
                    </TabsTrigger>
                    <TabsTrigger value="video" className="gap-1">
                      <FileText className="h-3 w-3" />
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
