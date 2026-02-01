import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Home, Search, MessageCircle, Bell, 
  Compass
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CreateHub } from '@/components/create/CreateHub';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTopBar } from '@/components/layout/MobileTopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SearchTypeahead } from '@/components/search/SearchTypeahead';
import { RoleAwareCreateButton } from '@/components/create/RoleAwareCreateButton';
import { AvatarWithRing } from '@/components/ui/avatar-with-ring';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for focusSearch event (triggered by Find People button)
  useEffect(() => {
    const handleFocusSearch = () => {
      if (!isMobile && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener('focusSearch', handleFocusSearch);
    return () => window.removeEventListener('focusSearch', handleFocusSearch);
  }, [isMobile]);

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Markets', href: '/markets', icon: Compass },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <MobileTopBar />
        <main className="flex-1">
          {children || <Outlet />}
        </main>
        <MobileBottomNav />
        <CreateHub />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => navigate('/feed')}
              >
                <span className="text-xl font-bold font-heading">
                  Investor<span className="text-primary">Paisa</span>
                </span>
              </div>
            </div>

            {/* Search with Typeahead */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search posts, people, topics..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.length > 0);
                  }}
                  onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
                  className="pl-10 bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-primary/30 rounded-xl h-10"
                />
              </div>
              {showSearchResults && (
                <SearchTypeahead 
                  query={searchQuery} 
                  onClose={() => setShowSearchResults(false)}
                  onResultClick={() => {
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                />
              )}
            </div>

            {/* Navigation Links - All icons with rounded-xl (12px radius) */}
            <div className="flex items-center space-x-1">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  className={`flex items-center justify-center p-2 h-10 w-10 rounded-xl transition-all ${
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 rounded-full hover:bg-secondary"
                    onClick={() => navigate('/profile')}
                  >
                    <AvatarWithRing 
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                      fallback={profile?.full_name?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || 'U'}
                      completionPercentage={(profile as any)?.profile_completeness_score || 0}
                      className="h-8 w-8"
                    />
                  </Button>
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
      
      {/* Create Hub Modal */}
      <CreateHub />

      {/* Floating Create Button - Desktop only with gradient animation */}
      <div className="fixed bottom-6 right-6 z-50">
        <RoleAwareCreateButton />
      </div>
    </div>
  );
};

export default MainLayout;
