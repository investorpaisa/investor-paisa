import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Home, Search, Users, MessageCircle, Bell, 
  TrendingUp, LogOut, PlusCircle, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MainLayout = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error logging out",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Feed', href: '/feed', icon: TrendingUp },
    { name: 'Markets', href: '/markets', icon: BarChart3 },
    { name: 'Circles', href: '/circles', icon: Users },
    { name: 'Messages', href: '/inbox', icon: MessageCircle },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => navigate('/home')}
              >
                <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  InvestorPaisa
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-2xl mx-8">
              <Button
                variant="outline"
                onClick={() => navigate('/discover')}
                className="w-full justify-start text-muted-foreground bg-muted/50 border-border hover:bg-muted rounded-2xl h-12"
              >
                <Search className="h-5 w-5 mr-3" />
                <span>Search people, posts, topics...</span>
              </Button>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-2">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center p-2 h-12 w-12 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              ))}
              
              {/* Profile Dropdown */}
              <div className="ml-4 flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 rounded-full hover:bg-muted"
                  onClick={() => navigate('/profile')}
                >
                  <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all">
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
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Create Post FAB */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all z-30"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <PlusCircle className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default MainLayout;
