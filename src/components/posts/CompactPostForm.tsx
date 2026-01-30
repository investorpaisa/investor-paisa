
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CompactPostFormProps {
  userAvatar: string | undefined;
  userName: string | undefined;
  onExpand: () => void;
}

const CompactPostForm = ({ userAvatar, userName, onExpand }: CompactPostFormProps) => {
  return (
    <div 
      className="flex items-center gap-4 cursor-pointer" 
      onClick={onExpand}
    >
      <Avatar>
        <AvatarImage src={userAvatar || undefined} />
        <AvatarFallback>{userName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 bg-muted rounded-md px-4 py-2 text-muted-foreground">
        Share your financial knowledge or ask a question...
      </div>
    </div>
  );
};

export default CompactPostForm;
