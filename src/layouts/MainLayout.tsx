import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Home, Search, MessageCircle, Bell, 
  TrendingUp, LogOut, BarChart3, Compass
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Error logging out");
    }
  };

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Discover', href: '/discover', icon: Compass },
    { name: 'Markets', href: '/markets', icon: BarChart3 },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => navigate('/feed')}
              >
                <div className="h-9 w-9 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center glow-primary">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold font-heading hidden sm:block">
                  Investor<span className="text-primary">Paisa</span>
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <Button
                variant="ghost"
                onClick={() => navigate('/discover')}
                className="w-full justify-start text-muted-foreground bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-primary/30 rounded-xl h-10"
              >
                <Search className="h-4 w-4 mr-3" />
                <span className="text-sm">Search...</span>
              </Button>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  className={`flex items-center p-2 h-10 w-10 rounded-xl transition-all ${
                    isActive(item.href) 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              ))}
              
              {/* Profile / Auth */}
              <div className="ml-2 flex items-center space-x-2">
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 rounded-full hover:bg-secondary"
                      onClick={() => navigate('/profile')}
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/30 transition-all">
                        <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {profile?.full_name?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-8 w-8 p-0"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-primary text-primary-foreground rounded-xl h-9 px-4"
                  >
                    Sign in
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default MainLayout;
