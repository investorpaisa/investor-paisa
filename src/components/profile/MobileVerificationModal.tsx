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
import { supabase, getSupabaseUrl } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type OTPFlowState = 'idle' | 'phone' | 'sending' | 'sent' | 'verifying' | 'success';

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
  // State machine: idle -> phone -> sending -> sent -> verifying -> success
  const [flowState, setFlowState] = useState<OTPFlowState>('idle');
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Determine initial step based on whether initialPhone is provided
  const hasValidInitialPhone = initialPhone && initialPhone.length >= 10;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(initialPhone || '');
      setOtp('');
      setDevOtp(null);
      // Start in phone step if no valid initial phone, otherwise stay in phone (user must click Send OTP)
      // Key fix: NEVER auto-request OTP - always require explicit user action
      setFlowState(hasValidInitialPhone ? 'phone' : 'phone');
    } else {
      // Reset when modal closes
      setFlowState('idle');
    }
  }, [isOpen, initialPhone, hasValidInitialPhone]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Validate JSON response helper
  const parseJsonResponse = async (response: Response) => {
    // Check for 404 - function not deployed
    if (response.status === 404) {
      console.error('[OTP UI] Edge function not found (404)');
      throw new Error('Mobile verification service is temporarily unavailable. Please try again later.');
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[OTP UI] Invalid response content-type:', contentType, 'Status:', response.status);
      const text = await response.text().catch(() => 'Unable to read response');
      console.error('[OTP UI] Response body:', text.substring(0, 200));
      throw new Error('Mobile verification service returned an unexpected response. Please try again.');
    }
    return response.json();
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

    setFlowState('sending');
    setDevOtp(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        setFlowState('phone');
        return;
      }

      const response = await fetch(
        `${getSupabaseUrl()}/functions/v1/auth-mobile-request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ phoneNumber: cleanedPhone }),
        }
      );

      const data = await parseJsonResponse(response);

      if (data.success) {
        setFlowState('sent');
        setCountdown(60);
        
        if (data.smsSent) {
          toast.success('OTP sent to your phone!');
        } else if (data.dev_otp) {
          // Trial/dev mode - show OTP in modal for testing
          setDevOtp(data.dev_otp);
          toast.info('SMS service in trial mode - use the code shown below');
          if (data.smsError) {
            console.warn('[OTP UI] SMS Error (trial mode):', data.smsError);
          }
        } else {
          toast.success('OTP generated - check your phone');
        }
        
        // Store dev_otp if available
        if (data.dev_otp) {
          setDevOtp(data.dev_otp);
        }
      } else {
        toast.error(data.error || 'Failed to send OTP');
        setFlowState('phone');
      }
    } catch (error) {
      console.error('[OTP UI] Request error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request OTP');
      setFlowState('phone');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setFlowState('verifying');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        setFlowState('sent');
        return;
      }

      const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

      const response = await fetch(
        `${getSupabaseUrl()}/functions/v1/auth-mobile-verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ otp, phoneNumber: cleanedPhone }),
        }
      );

      const data = await parseJsonResponse(response);

      if (data.success) {
        setFlowState('success');
        toast.success('Mobile number verified!');
        onVerify?.();
        // Close after short delay to show success state
        setTimeout(() => {
          onClose();
          // Reset state
          setFlowState('idle');
          setPhoneNumber('');
          setOtp('');
          setDevOtp(null);
        }, 500);
      } else {
        toast.error(data.error || 'Invalid OTP');
        setFlowState('sent');
      }
    } catch (error) {
      console.error('[OTP UI] Verify error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
      setFlowState('sent');
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setDevOtp(null);
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    setFlowState('sending');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        setFlowState('sent');
        return;
      }

      const response = await fetch(
        `${getSupabaseUrl()}/functions/v1/auth-mobile-request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ phoneNumber: cleanedPhone }),
        }
      );

      const data = await parseJsonResponse(response);

      if (data.success) {
        toast.success('New OTP sent!');
        setFlowState('sent');
        setCountdown(60);
        if (data.dev_otp) {
          setDevOtp(data.dev_otp);
        }
      } else {
        toast.error(data.error || 'Failed to resend OTP');
        setFlowState('sent');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend OTP');
      setFlowState('sent');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setFlowState('idle');
      setOtp('');
      setDevOtp(null);
    }, 200);
  };

  // Format phone for display
  const displayPhone = phoneNumber.startsWith('+') 
    ? phoneNumber 
    : phoneNumber.length > 0 ? `+${phoneNumber}` : '';

  // Determine if we're in the OTP entry phase
  const isOtpPhase = flowState === 'sent' || flowState === 'verifying';
  const isLoading = flowState === 'sending' || flowState === 'verifying';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Mobile Verification
          </DialogTitle>
          <DialogDescription>
            {isOtpPhase 
              ? `Enter the 6-digit code sent to ${displayPhone}`
              : 'Enter your mobile number to receive a verification code'
            }
          </DialogDescription>
        </DialogHeader>

        {!isOtpPhase ? (
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
                  disabled={isLoading}
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
              <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus disabled={flowState === 'verifying'}>
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
              {flowState === 'verifying' ? (
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
                  setFlowState('phone');
                  setOtp('');
                  setDevOtp(null);
                }}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
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