import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/contexts/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCreateHubOpen } = useUIStore();
  const { user } = useAuth();

  const navigation = [
    { name: 'Home', href: '/feed', icon: Home },
    { name: 'Markets', href: '/markets', icon: Compass },
    { name: 'Create', action: () => setCreateHubOpen(true), icon: Plus, center: true },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: user ? '/profile' : '/auth', icon: User },
  ];

  const isActive = (href?: string) => href && (location.pathname === href || location.pathname.startsWith(href + '/'));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navigation.map((item) => {
          if (item.center) {
            return (
              <Button
                key={item.name}
                onClick={item.action}
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg -mt-4 glow-primary"
              >
                <item.icon className="h-6 w-6" />
              </Button>
            );
          }

          return (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center justify-center h-14 w-14 rounded-xl gap-1 ${
                isActive(item.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => item.href && navigate(item.href)}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
