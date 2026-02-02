import React, { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useSubmitReport, REPORT_REASONS, ReportReason } from '@/hooks/useContentReports';

interface ReportContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: 'post' | 'comment' | 'answer';
  contentPreview?: string;
}

export const ReportContentModal: React.FC<ReportContentModalProps> = ({
  open,
  onOpenChange,
  entityId,
  entityType,
  contentPreview,
}) => {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const submitReport = useSubmitReport();

  const handleSubmit = async () => {
    if (!reason) return;

    await submitReport.mutateAsync({
      entityId,
      entityType,
      reason,
      description: description.trim() || undefined,
    });

    // Reset and close
    setReason('');
    setDescription('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this {entityType}.
          </DialogDescription>
        </DialogHeader>

        {contentPreview && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground line-clamp-2">
            {contentPreview}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Why are you reporting this?</Label>
            <RadioGroup
              value={reason}
              onValueChange={(value) => setReason(value as ReportReason)}
              className="space-y-2"
            >
              {REPORT_REASONS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={item.value} id={item.value} />
                  <Label 
                    htmlFor={item.value} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Provide more context about your report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || submitReport.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitReport.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
