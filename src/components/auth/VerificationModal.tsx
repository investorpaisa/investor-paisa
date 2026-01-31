import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Linkedin, Shield, CheckCircle2, Sparkles } from 'lucide-react';

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const benefits = [
    'Ask questions and get expert answers',
    'Post opinions and investment tips',
    'Use AI-powered content creation',
    'Build your investor reputation',
  ];

  const handleMobileVerify = () => {
    onOpenChange(false);
    navigate('/edit-profile?tab=verification');
  };

  const handleLinkedInVerify = () => {
    onOpenChange(false);
    navigate('/edit-profile?tab=verification');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Verify Your Account</DialogTitle>
          <DialogDescription className="text-center">
            Unlock all features by verifying your identity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Why verify?</span>
              </div>
              <ul className="space-y-2">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Verification Options */}
          <div className="space-y-3">
            <Button 
              onClick={handleMobileVerify}
              variant="outline" 
              className="w-full h-14 justify-start gap-4 hover:border-primary/50"
            >
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Mobile OTP</div>
                <div className="text-xs text-muted-foreground">Verify via SMS code</div>
              </div>
            </Button>

            <Button 
              onClick={handleLinkedInVerify}
              variant="outline" 
              className="w-full h-14 justify-start gap-4 hover:border-primary/50"
            >
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Linkedin className="h-5 w-5 text-[#0A66C2]" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Connect LinkedIn</div>
                <div className="text-xs text-muted-foreground">Professional verification</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
