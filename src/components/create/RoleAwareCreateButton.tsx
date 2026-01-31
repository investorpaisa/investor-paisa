import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useUserTier } from '@/hooks/useUserTier';
import { VerificationModal } from '@/components/auth/VerificationModal';

interface RoleAwareCreateButtonProps {
  isMobile?: boolean;
  className?: string;
}

export const RoleAwareCreateButton: React.FC<RoleAwareCreateButtonProps> = ({ 
  isMobile = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const { setCreateHubOpen } = useUIStore();
  const { isGuest, isUnverified, tier } = useUserTier();
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const handleClick = () => {
    if (isGuest) {
      navigate('/auth');
      return;
    }
    if (isUnverified) {
      setShowVerifyModal(true);
      return;
    }
    setCreateHubOpen(true);
  };

  const getIcon = () => {
    if (isGuest) return LogIn;
    if (isUnverified) return ShieldCheck;
    return Plus;
  };

  const getLabel = () => {
    if (isGuest) return 'Sign in';
    if (isUnverified) return 'Verify';
    return 'Create';
  };

  const Icon = getIcon();

  // Mobile center button with gradient border
  if (isMobile) {
    return (
      <>
        <button
          onClick={handleClick}
          className="create-button-gradient h-12 w-12 rounded-full shadow-lg -mt-4 flex items-center justify-center"
        >
          <span className="flex items-center justify-center h-[calc(100%-3px)] w-[calc(100%-3px)] bg-background rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </span>
        </button>
        <VerificationModal open={showVerifyModal} onOpenChange={setShowVerifyModal} />
      </>
    );
  }

  // Desktop floating button with gradient border
  return (
    <>
      <button
        onClick={handleClick}
        className={`create-button-gradient h-14 w-14 rounded-full shadow-lg flex items-center justify-center ${className}`}
      >
        <span className="flex items-center justify-center h-[calc(100%-3px)] w-[calc(100%-3px)] bg-background rounded-full">
          <Icon className="h-6 w-6 text-primary" />
        </span>
      </button>
      <VerificationModal open={showVerifyModal} onOpenChange={setShowVerifyModal} />
    </>
  );
};
