import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Phone, Check, Loader2, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MobileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVerified: boolean;
  onVerify?: () => void;
  initialPhone?: string; // Pre-filled phone from profile edit page
}

export const MobileVerificationModal: React.FC<MobileVerificationModalProps> = ({
  isOpen,
  onClose,
  isVerified,
  onVerify,
  initialPhone,
}) => {
  // If initialPhone is provided and valid, start directly on OTP step
  const hasValidInitialPhone = initialPhone && initialPhone.length >= 10;
  const [step, setStep] = useState<'phone' | 'otp'>(hasValidInitialPhone ? 'otp' : 'phone');
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Reset state when modal opens with new initialPhone
  useEffect(() => {
    if (isOpen) {
      if (hasValidInitialPhone) {
        setPhoneNumber(initialPhone);
        setStep('otp');
        // Auto-request OTP when opening with valid phone
        handleRequestOTPSilent(initialPhone);
      } else {
        setStep('phone');
        setPhoneNumber(initialPhone || '');
      }
      setOtp('');
      setDevOtp(null);
    }
  }, [isOpen, initialPhone]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTPSilent = async (phone: string) => {
    // Silent OTP request on modal open
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[1-9]\d{9,14}$/.test(cleanedPhone)) {
      setStep('phone');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        setStep('phone');
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
          body: JSON.stringify({ phoneNumber: cleanedPhone }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setCountdown(60);
        if (data.dev_otp) {
          setDevOtp(data.dev_otp);
        }
        if (data.smsSent) {
          toast.success('OTP sent to your phone!');
        }
      } else {
        setStep('phone');
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('[OTP UI] Request error:', error);
      setStep('phone');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[1-9]\d{9,14}$/.test(cleanedPhone)) {
      toast.error('Please include country code (e.g., +91XXXXXXXXXX)');
      return;
    }

    setIsLoading(true);
    setDevOtp(null);
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
          body: JSON.stringify({ phoneNumber: cleanedPhone }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.smsSent) {
          toast.success('OTP sent to your phone!');
        } else {
          toast.success('OTP generated');
        }
        setStep('otp');
        setCountdown(60);
        if (data.dev_otp) {
          setDevOtp(data.dev_otp);
        }
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('[OTP UI] Request error:', error);
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

      const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-mobile-verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ otp, phoneNumber: cleanedPhone }),
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
        setDevOtp(null);
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('[OTP UI] Verify error:', error);
      toast.error('Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setDevOtp(null);
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
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
          body: JSON.stringify({ phoneNumber: cleanedPhone }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('New OTP sent!');
        setCountdown(60);
        if (data.dev_otp) {
          setDevOtp(data.dev_otp);
        }
      } else {
        toast.error(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(hasValidInitialPhone ? 'otp' : 'phone');
      setOtp('');
      setDevOtp(null);
    }, 200);
  };

  // Format phone for display
  const displayPhone = phoneNumber.startsWith('+') 
    ? phoneNumber 
    : phoneNumber.length > 0 ? `+${phoneNumber}` : '';

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
              : `Enter the 6-digit code sent to ${displayPhone}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center h-10 px-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground">
                  +91
                </div>
                <input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber.replace(/^\+91/, '')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhoneNumber(value ? `+91${value}` : '');
                  }}
                  className="flex-1 h-10 px-3 rounded-xl bg-secondary/50 border border-border/50 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll send a 6-digit code to verify your number
              </p>
            </div>
            <Button 
              onClick={handleRequestOTP} 
              disabled={isLoading || phoneNumber.length < 12}
              className="w-full rounded-xl gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Send OTP'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center space-y-4">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={1} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={2} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={3} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={4} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={5} className="w-10 h-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Dev mode OTP display */}
            {devOtp && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                <p className="text-xs text-amber-500 mb-1">DEV MODE - Your code:</p>
                <p className="text-lg font-bold text-amber-500 tracking-widest">{devOtp}</p>
              </div>
            )}

            <Button 
              onClick={handleVerifyOTP} 
              disabled={isLoading || otp.length !== 6}
              className="w-full rounded-xl gap-2"
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

            <div className="flex justify-between items-center text-sm">
              <button
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setDevOtp(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Change number
              </button>
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0 || isLoading}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
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
      <div className="flex items-center gap-2 text-success text-sm">
        <Check className="h-3.5 w-3.5" />
        Mobile Verified
      </div>
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