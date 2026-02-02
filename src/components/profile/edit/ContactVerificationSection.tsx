import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, CheckCircle2 } from 'lucide-react';
import { MobileVerificationModal } from '@/components/profile/MobileVerificationModal';
import type { ProfileFormData } from '@/hooks/useEditProfile';

interface ContactVerificationSectionProps {
  profile: ProfileFormData;
  mobileVerified: boolean;
  onUpdate: (updates: Partial<ProfileFormData>) => void;
  onMobileVerified?: () => void;
}

export const ContactVerificationSection: React.FC<ContactVerificationSectionProps> = ({
  profile,
  mobileVerified,
  onUpdate,
  onMobileVerified,
}) => {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [originalPhone] = useState(profile.phone);

  const phoneChanged = profile.phone !== originalPhone && originalPhone !== '';

  const handleVerifyClick = () => {
    if (!profile.phone || profile.phone.length < 10) {
      return;
    }
    setShowOtpModal(true);
  };

  const handleVerificationSuccess = () => {
    setShowOtpModal(false);
    onMobileVerified?.();
  };

  // Format phone for display (remove +91 prefix)
  const displayPhone = profile.phone?.replace(/^\+91/, '') || '';

  return (
    <>
      <Card id="verification-section" className="glass border-border/50 rounded-2xl scroll-mt-20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
            <Phone className="h-5 w-5 mr-2 text-primary" />
            Contact & Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile Number */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone" className="text-sm">
                Mobile Number
              </Label>
              {mobileVerified && !phoneChanged ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : null}
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center h-10 px-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground">
                +91
              </div>
              <Input
                id="phone"
                type="tel"
                value={displayPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  onUpdate({ phone: value ? `+91${value}` : '' });
                }}
                placeholder="Enter 10-digit mobile number"
                className="flex-1 bg-secondary/50 border-border/50"
              />
              {(!mobileVerified || phoneChanged) && profile.phone && profile.phone.length >= 13 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyClick}
                  className="h-10 px-4 border-primary/50 text-primary hover:bg-primary/10"
                >
                  Verify
                </Button>
              )}
            </div>
            
            {phoneChanged && mobileVerified && (
              <p className="text-xs text-warning">
                Phone number changed. Please verify again.
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Verify your mobile number to unlock verified user status and increase profile trust
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OTP Verification Modal - Pass phone number to skip re-entry */}
      <MobileVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        isVerified={mobileVerified}
        onVerify={handleVerificationSuccess}
        initialPhone={profile.phone}
      />
    </>
  );
};