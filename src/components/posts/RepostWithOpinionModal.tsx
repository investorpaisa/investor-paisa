import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Repeat, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostPreview {
  id: string;
  title: string | null;
  body: string | null;
  type: string;
  created_at: string;
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface RepostWithOpinionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostPreview;
  onRepost: (postId: string, opinion: string | undefined) => Promise<void>;
  isLoading?: boolean;
}

export const RepostWithOpinionModal: React.FC<RepostWithOpinionModalProps> = ({
  open,
  onOpenChange,
  post,
  onRepost,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [opinion, setOpinion] = useState('');

  const handleSubmit = async () => {
    await onRepost(post.id, opinion.trim() || undefined);
    setOpinion('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setOpinion('');
    onOpenChange(false);
  };

  const handlePreviewClick = () => {
    onOpenChange(false);
    navigate(`/post/${post.id}`);
  };

  const getTypeLabel = () => {
    if (post.type === 'question') return 'Question';
    if (post.type === 'opinion') return 'Opinion';
    if (post.type === 'news') return 'News';
    return post.type;
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Repost
          </DialogTitle>
          <DialogDescription>
            Share your thoughts along with this post
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opinion Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add your thoughts (optional)..."
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              rows={3}
              maxLength={280}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {opinion.length}/280
            </p>
          </div>

          {/* Post Preview - Clickable */}
          <Card 
            className="border border-border/50 bg-muted/30 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={handlePreviewClick}
          >
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {post.author?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-xs font-medium truncate">
                    {post.author?.full_name || 'Anonymous'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    @{post.author?.username || 'user'}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {timeAgo}
                  </span>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-[9px] capitalize bg-primary/10 text-primary border-primary/30 h-4 px-1"
                >
                  {getTypeLabel()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              {post.title && (
                <h4 className="text-sm font-medium mb-1 line-clamp-2">{post.title}</h4>
              )}
              {post.body && (
                <p className="text-xs text-muted-foreground line-clamp-2">{post.body}</p>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Click the preview to view the original post
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-primary text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reposting...
              </>
            ) : (
              <>
                <Repeat className="mr-2 h-4 w-4" />
                Repost
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
