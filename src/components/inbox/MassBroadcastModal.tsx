import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Radio, Loader2, Send, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MassBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIER_OPTIONS = [
  { value: 'verified_user', label: 'Verified Users' },
  { value: 'influencer', label: 'Influencers' },
  { value: 'expert', label: 'Experts' },
];

const INTEREST_OPTIONS = [
  'Stocks', 'Mutual Funds', 'Cryptocurrency', 'Real Estate',
  'Tax Planning', 'Insurance', 'Retirement', 'Trading'
];

export const MassBroadcastModal: React.FC<MassBroadcastModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [message, setMessage] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [minFollowers, setMinFollowers] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return;
      }

      const audience_filter: Record<string, any> = {};
      if (selectedTiers.length > 0) audience_filter.tier = selectedTiers;
      if (selectedInterests.length > 0) audience_filter.interests = selectedInterests;
      if (minFollowers) audience_filter.follower_count_min = minFollowers;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/messages-mass`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            body: message,
            audience_filter: Object.keys(audience_filter).length > 0 ? audience_filter : undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onClose();
        setMessage('');
        setSelectedTiers([]);
        setSelectedInterests([]);
        setMinFollowers(undefined);
      } else {
        toast.error(data.error || 'Failed to send broadcast');
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTier = (tier: string) => {
    setSelectedTiers(prev => 
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Expert Broadcast
          </DialogTitle>
          <DialogDescription>
            Send a message to multiple users at once. Recipients will receive individual messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Message</Label>
            <Textarea
              id="broadcast-message"
              placeholder="Write your broadcast message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-32 rounded-xl"
            />
          </div>

          {/* Audience Filters */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Audience Filters (optional)
            </Label>

            {/* Tier filter */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">User Tier</span>
              <div className="flex flex-wrap gap-2">
                {TIER_OPTIONS.map(tier => (
                  <Badge
                    key={tier.value}
                    variant={selectedTiers.includes(tier.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTier(tier.value)}
                  >
                    {tier.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Interest filter */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Interests</span>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(interest => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !message.trim()} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Broadcast
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
