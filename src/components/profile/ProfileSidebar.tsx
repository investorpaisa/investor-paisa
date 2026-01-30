
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SystemCard, Typography } from '@/components/ui/design-system';
import { MapPin, Building, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

export const ProfileSidebar: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <SystemCard className="p-0 overflow-hidden">
      {/* Banner */}
      <div className="h-16 bg-gradient-to-r from-gray-800 to-black"></div>
      
      {/* Profile Info */}
      <div className="p-4 -mt-8">
        <div className="relative flex justify-center">
          <Avatar 
            className="w-16 h-16 border-4 border-white cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Profile'} />
            <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center mt-3">
          <Typography.H3 
            className="font-semibold text-black cursor-pointer hover:underline"
            onClick={() => navigate('/profile')}
          >
            {profile?.full_name || 'Complete Your Profile'}
          </Typography.H3>
          <Typography.Small className="text-gray-600 mt-1">
            {profile?.headline || 'Add your headline'}
          </Typography.Small>
        </div>

        <div className="mt-4 space-y-2">
          {profile?.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {profile.location}
            </div>
          )}
          {profile?.headline && (
            <div className="flex items-center text-sm text-gray-600">
              <Building className="w-4 h-4 mr-2" />
              Finance Professional
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            {profile?.followers_count || 0} connections
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Followers</span>
            <span className="text-black font-semibold">{profile?.followers_count || 0}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-600">Posts</span>
            <span className="text-black font-semibold">{profile?.posts_count || 0}</span>
          </div>
        </div>
      </div>
    </SystemCard>
  );
};
