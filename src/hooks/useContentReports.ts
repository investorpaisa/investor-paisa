import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'misinformation'
  | 'hate_speech'
  | 'violence'
  | 'inappropriate'
  | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'misinformation', label: 'Financial misinformation' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
];

interface ReportContentParams {
  entityId: string;
  entityType: 'post' | 'comment' | 'answer';
  reason: ReportReason;
  description?: string;
}

export const useSubmitReport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityId, entityType, reason, description }: ReportContentParams) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { error } = await (supabase as any)
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          entity_id: entityId,
          entity_type: entityType,
          reason,
          description: description || null,
        });

      if (error) {
        // Check if already reported
        if (error.code === '23505') {
          throw new Error('You have already reported this content');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-reports'] });
      toast.success('Report submitted', {
        description: 'Thank you for helping keep our community safe.',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit report');
    },
  });
};
