
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Menu, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { SearchComponent } from '@/components/header/SearchComponent';
import { NotificationsComponent } from '@/components/header/NotificationsComponent';
import { Typography, SystemIconButton } from '@/components/ui/design-system';

export const MainNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.nav 
      className="border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-50"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <Typography.H3 className="text-xl">
            Investor<span className="text-gold">Paisa</span>
          </Typography.H3>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <SearchComponent />

          {/* Notifications */}
          <NotificationsComponent />

          {/* Profile Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 rounded-xl hover:bg-white/5 transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center">
                  <User className="w-4 h-4 text-black" />
                </div>
              )}
              <Typography.Small className="hidden md:block text-white/80 font-medium">
                {profile?.full_name || profile?.username || 'User'}
              </Typography.Small>
            </motion.button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/profile"
                  className="block px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors duration-200"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Typography.Body className="text-sm">View Profile</Typography.Body>
                </Link>
                <Link
                  to="/edit-profile"
                  className="block px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors duration-200"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Typography.Body className="text-sm">Edit Profile</Typography.Body>
                </Link>
                <hr className="border-white/10" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition-colors duration-200 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <Typography.Body className="text-sm">Sign Out</Typography.Body>
                </button>
              </motion.div>
            )}
          </div>

          {/* Mobile menu */}
          <SystemIconButton
            icon={Menu}
            variant="ghost"
            className="md:hidden"
          />
        </div>
      </div>
    </motion.nav>
  );
};
