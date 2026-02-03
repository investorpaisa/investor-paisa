import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UnfollowConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
  isLoading?: boolean;
}

export const UnfollowConfirmModal: React.FC<UnfollowConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  username,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unfollow @{username}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to unfollow this user? You can always follow them again later.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Unfollowing...' : 'Unfollow'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
