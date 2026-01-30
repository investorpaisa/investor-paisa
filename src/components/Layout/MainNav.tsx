import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Users,
  TrendingUp,
  BarChart3,
  Search,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Crown,
  Verified
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Feed', href: '/feed', icon: TrendingUp },
  { name: 'Circles', href: '/circles', icon: Users },
  { name: 'Discover', href: '/discover', icon: Search },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
];

export const MainNav = () => {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const getTrustLevelIcon = (level: string | null | undefined) => {
    switch (level) {
      case 'expert':
      case 'legend':
        return <Crown className="h-3 w-3 text-primary" />;
      case 'trusted':
        return <Verified className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  const getTrustLevelBadge = (level: string | null | undefined) => {
    switch (level) {
      case 'expert':
        return <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Expert</Badge>;
      case 'legend':
        return <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Legend</Badge>;
      case 'trusted':
        return <Badge variant="secondary" className="text-xs bg-secondary/10 text-secondary-foreground">Trusted</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Logo */}
        <Link to="/home" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">IP</span>
          </div>
          <span className="font-bold text-xl text-foreground">InvestorPaisa</span>
        </Link>

        {/* Navigation */}
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>

          {/* Messages */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/inbox">
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || profile?.username || 'User'} />
                  <AvatarFallback>
                    {(profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || profile?.username || 'User'}
                    </p>
                    {getTrustLevelIcon(profile?.trust_level)}
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                  {getTrustLevelBadge(profile?.trust_level)}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/edit-profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
