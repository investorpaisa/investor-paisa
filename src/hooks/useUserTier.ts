import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserTier = 'guest' | 'unverified_user' | 'verified_user' | 'influencer' | 'expert';

interface TierPermissions {
  canLike: boolean;
  canShare: boolean;
  canComment: boolean;
  canMessage: boolean;
  canAskQuestion: boolean;
  canPostOpinion: boolean;
  canUseAI: boolean;
  canCreateCarousel: boolean;
  canCreateURLSummary: boolean;
  canPromoteProfile: boolean;
  canCreatePaidListing: boolean;
  canMassOutreach: boolean;
}

export const useUserTier = () => {
  const { user, profile } = useAuth();

  const tier: UserTier = useMemo(() => {
    if (!user) return 'guest';
    if (!profile) return 'unverified_user';
    
    // Cast profile to access new fields (will be available after DB sync)
    const p = profile as any;
    
    // Check profile-based tier (computed by database trigger)
    if (p.tier) {
      return p.tier as UserTier;
    }
    
    // Fallback tier computation if tier not in profile yet
    if (p.is_expert) return 'expert';
    
    const streakDays = p.streak_days || 0;
    const upvoteRate = p.upvote_rate || 0;
    const mobileVerified = p.mobile_verified || false;
    const linkedinVerified = p.linkedin_verified || false;
    
    if (streakDays >= 50 && upvoteRate >= 0.7) return 'influencer';
    if (mobileVerified || linkedinVerified) return 'verified_user';
    
    return 'unverified_user';
  }, [user, profile]);

  const permissions: TierPermissions = useMemo(() => {
    // Base permissions for all authenticated users
    const base = {
      canLike: tier !== 'guest',
      canShare: tier !== 'guest',
      canComment: false,
      canMessage: false,
      canAskQuestion: false,
      canPostOpinion: false,
      canUseAI: false,
      canCreateCarousel: false,
      canCreateURLSummary: false,
      canPromoteProfile: false,
      canCreatePaidListing: false,
      canMassOutreach: false,
    };

    switch (tier) {
      case 'guest':
        return base;
        
      case 'unverified_user':
        return {
          ...base,
          // UV can only like and share
        };
        
      case 'verified_user':
        return {
          ...base,
          canComment: true,
          canMessage: true,
          canAskQuestion: true,
          canPostOpinion: true,
          canUseAI: true,
        };
        
      case 'influencer':
        return {
          ...base,
          canComment: true,
          canMessage: true,
          canAskQuestion: true,
          canPostOpinion: true,
          canUseAI: true,
          canCreateCarousel: true,
          canCreateURLSummary: true,
          canPromoteProfile: true,
        };
        
      case 'expert':
        return {
          ...base,
          canComment: true,
          canMessage: true,
          canAskQuestion: true,
          canPostOpinion: true,
          canUseAI: true,
          canCreateCarousel: true,
          canCreateURLSummary: true,
          canPromoteProfile: true,
          canCreatePaidListing: true,
          canMassOutreach: true,
        };
        
      default:
        return base;
    }
  }, [tier]);

  const tierLabel = useMemo(() => {
    switch (tier) {
      case 'guest': return 'Guest';
      case 'unverified_user': return 'Unverified';
      case 'verified_user': return 'Verified';
      case 'influencer': return 'Influencer';
      case 'expert': return 'Expert';
      default: return 'Unknown';
    }
  }, [tier]);

  const isVerified = tier === 'verified_user' || tier === 'influencer' || tier === 'expert';
  const isInfluencerOrAbove = tier === 'influencer' || tier === 'expert';
  const isExpert = tier === 'expert';

  return {
    tier,
    tierLabel,
    permissions,
    isVerified,
    isInfluencerOrAbove,
    isExpert,
    isGuest: tier === 'guest',
    isUnverified: tier === 'unverified_user',
  };
};
