import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Phone, Check, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MobileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVerified: boolean;
  onVerify?: () => void;
}

export const MobileVerificationModal: React.FC<MobileVerificationModalProps> = ({
  isOpen,
  onClose,
  isVerified,
  onVerify,
}) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-mobile-request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ phoneNumber }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('OTP sent to your phone');
        setStep('otp');
        // For development, show OTP in toast if returned
        if (data.otp) {
          toast.info(`Dev OTP: ${data.otp}`, { duration: 10000 });
        }
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      toast.error('Failed to request OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-mobile-verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ otp, phoneNumber }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Mobile number verified!');
        onVerify?.();
        onClose();
        // Reset state
        setStep('phone');
        setPhoneNumber('');
        setOtp('');
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verify error:', error);
      toast.error('Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setStep('phone');
      setOtp('');
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Mobile Verification
          </DialogTitle>
          <DialogDescription>
            {step === 'phone' 
              ? 'Enter your mobile number to receive a verification code'
              : 'Enter the 6-digit code sent to your phone'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +91 for India)
              </p>
            </div>
            <Button 
              onClick={handleRequestOTP} 
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full rounded-xl gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center space-y-4">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-sm text-muted-foreground">
                Sent to {phoneNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep('phone')}
                className="flex-1 rounded-xl"
              >
                Change Number
              </Button>
              <Button 
                onClick={handleVerifyOTP} 
                disabled={isLoading || otp.length !== 6}
                className="flex-1 rounded-xl gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
            </div>
            <Button 
              variant="link" 
              onClick={handleRequestOTP}
              disabled={isLoading}
              className="w-full text-sm"
            >
              Didn't receive code? Resend
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Standalone button component for triggering verification
interface MobileVerifyButtonProps {
  isVerified: boolean;
  onVerify?: () => void;
}

export const MobileVerifyButton: React.FC<MobileVerifyButtonProps> = ({
  isVerified,
  onVerify,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isVerified) {
    return (
      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
        <Check className="h-3 w-3 mr-1" />
        Mobile Verified
      </Badge>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="gap-2 rounded-2xl border-green-200 hover:bg-green-50"
      >
        <Phone className="h-4 w-4 text-green-600" />
        Verify Mobile
      </Button>
      <MobileVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isVerified={isVerified}
        onVerify={onVerify}
      />
    </>
  );
};
