
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileHeaderProps {
  profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    location?: string | null;
    interests?: string[] | null;
  };
  isOwnProfile?: boolean;
}

const ProfileHeader = ({ profile, isOwnProfile = true }: ProfileHeaderProps) => {
  const navigate = useNavigate();

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name || 'Anonymous User'}</h1>
                <p className="text-muted-foreground">@{profile.username || 'user'}</p>
              </div>
              
              {isOwnProfile && (
                <Button onClick={() => navigate('/edit-profile')}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              )}
            </div>
            
            <div className="mt-4">
              {profile.bio && <p>{profile.bio}</p>}
              
              {profile.location && (
                <div className="flex items-center mt-2 text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4" /> {profile.location}
                </div>
              )}
            </div>
            
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.interests.map((interest, index) => (
                  <span key={index} className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
