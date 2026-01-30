import { useAuth } from '@/contexts/AuthContext';
import { ExtendedUser } from '@/types/app';

export const useUserData = (): ExtendedUser | null => {
  const { user, profile } = useAuth();
  
  if (!user || !profile) return null;
  
  // Map trust_level to a role-like value for backward compatibility
  const mapTrustLevelToRole = (trustLevel: string | null | undefined): string => {
    switch (trustLevel) {
      case 'expert':
      case 'legend':
        return 'expert';
      case 'trusted':
        return 'trusted';
      case 'member':
        return 'member';
      default:
        return 'newbie';
    }
  };
  
  return {
    id: user.id,
    email: user.email || '',
    name: profile.full_name,
    username: profile.username,
    avatar: profile.avatar_url,
    bio: profile.bio,
    role: mapTrustLevelToRole(profile.trust_level)
  };
};
