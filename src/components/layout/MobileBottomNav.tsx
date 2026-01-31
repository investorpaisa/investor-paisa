import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { RoleAwareCreateButton } from '@/components/create/RoleAwareCreateButton';
import { AvatarWithRing } from '@/components/ui/avatar-with-ring';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  // Get profile completeness from profile
  const completionPercentage = (profile as any)?.profile_completeness_score || 0;

  const navigation = [
    { name: 'Home', href: '/feed', icon: Home },
    { name: 'Markets', href: '/markets', icon: Compass },
    { name: 'Create', center: true },
    { name: 'Alerts', href: '/notifications', icon: Bell },
    { name: 'Profile', href: user ? '/profile' : '/auth', useAvatar: true },
  ];

  const isActive = (href?: string) => href && (location.pathname === href || location.pathname.startsWith(href + '/'));

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around h-14 px-1">
        {navigation.map((item) => {
          if (item.center) {
            return (
              <RoleAwareCreateButton key={item.name} isMobile />
            );
          }

          // Profile with avatar ring
          if (item.useAvatar) {
            return (
              <div 
                key={item.name}
                className="flex flex-col items-center justify-center h-12 w-12"
                onClick={() => navigate(item.href || '/auth')}
              >
                <AvatarWithRing
                  src={profile?.avatar_url}
                  fallback={getInitials(profile?.full_name)}
                  completionPercentage={user ? completionPercentage : 0}
                  size="sm"
                />
                <span className={`text-[9px] font-medium mt-0.5 ${
                  isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {item.name}
                </span>
              </div>
            );
          }

          return (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center justify-center h-12 w-12 rounded-lg gap-0.5 ${
                isActive(item.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => item.href && navigate(item.href)}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              <span className="text-[9px] font-medium">{item.name}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
