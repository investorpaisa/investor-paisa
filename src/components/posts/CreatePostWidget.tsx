import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Image, Video, FileText, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CreatePostModal } from './CreatePostModal';
import { ProfessionalUser } from '@/types/professional';

export const CreatePostWidget: React.FC = () => {
  const { profile } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'article' | 'poll'>('text');

  const handleCreatePost = (type: typeof postType) => {
    setPostType(type);
    setIsCreateModalOpen(true);
  };

  if (!profile) return null;

  // Convert UserProfile to ProfessionalUser format
  const professionalProfile: ProfessionalUser = {
    id: profile.id || '1',
    username: profile.username || '',
    full_name: profile.full_name || 'Professional User',
    headline: profile.headline || 'Financial Professional',
    avatar_url: profile.avatar_url || '',
    banner_url: profile.cover_url || '',
    location: profile.location || '',
    industry: 'Financial Services',
    current_company: '',
    about: profile.bio || '',
    followers: profile.followers_count || 0,
    following: profile.following_count || 0,
    connections: 0,
    is_verified: profile.is_verified || false,
    premium_member: profile.is_premium || false,
    experience_years: 0
  };

  return (
    <>
      <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => handleCreatePost('text')}
              className="flex-1 text-left p-4 border border-border rounded-full text-muted-foreground hover:bg-muted transition-colors font-medium"
            >
              Start a post, share an update...
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => handleCreatePost('image')}
            >
              <Image className="h-5 w-5 text-primary" />
              <span className="font-medium">Photo</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-muted-foreground hover:bg-secondary/10 hover:text-secondary-foreground transition-colors"
              onClick={() => handleCreatePost('video')}
            >
              <Video className="h-5 w-5 text-secondary-foreground" />
              <span className="font-medium">Video</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground transition-colors"
              onClick={() => handleCreatePost('article')}
            >
              <FileText className="h-5 w-5 text-accent-foreground" />
              <span className="font-medium">Article</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => handleCreatePost('poll')}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Poll</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        postType={postType}
        userProfile={professionalProfile}
      />
    </>
  );
};
