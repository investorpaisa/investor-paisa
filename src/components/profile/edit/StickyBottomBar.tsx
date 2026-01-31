import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

interface StickyBottomBarProps {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  onSave,
  onCancel,
  isSaving,
  isDirty,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 z-50 safe-area-pb">
      <div className="max-w-2xl mx-auto flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="h-10"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
