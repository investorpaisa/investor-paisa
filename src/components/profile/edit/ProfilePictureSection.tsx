
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';

interface ProfilePictureSectionProps {
  avatar: string | undefined;
  name: string;
}

export const ProfilePictureSection = ({ avatar, name }: ProfilePictureSectionProps) => {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>
        <p className="text-xs text-muted-foreground">Recommended: Square JPG or PNG, 300x300 pixels</p>
      </div>
    </div>
  );
};
