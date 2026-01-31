import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import type { ProfileFormData } from '@/hooks/useEditProfile';

interface IdentitySectionProps {
  username: string;
  email: string;
  profile: ProfileFormData;
  onUpdate: (updates: Partial<ProfileFormData>) => void;
  errors?: Record<string, string>;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
  username,
  email,
  profile,
  onUpdate,
  errors = {},
}) => {
  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
          <User className="h-5 w-5 mr-2 text-primary" />
          Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Username - Read Only */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm text-muted-foreground">
            Username
          </Label>
          <div className="flex items-center h-10 px-3 rounded-lg bg-secondary/50 border border-border/50">
            <span className="text-muted-foreground">@{username || 'user'}</span>
          </div>
          <p className="text-xs text-muted-foreground">Username cannot be changed</p>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-sm">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full_name"
            value={profile.full_name}
            onChange={(e) => onUpdate({ full_name: e.target.value })}
            placeholder="Enter your full name"
            className={`bg-secondary/50 border-border/50 ${errors.full_name ? 'border-destructive' : ''}`}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name}</p>
          )}
          <p className="text-xs text-muted-foreground">2-60 characters</p>
        </div>

        {/* Email - Read Only */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            Email
          </Label>
          <div className="flex items-center h-10 px-3 rounded-lg bg-secondary/50 border border-border/50">
            <span className="text-muted-foreground">{email || 'Not set'}</span>
          </div>
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="headline" className="text-sm">
            Headline
          </Label>
          <Input
            id="headline"
            value={profile.headline || ''}
            onChange={(e) => onUpdate({ headline: e.target.value })}
            placeholder="e.g., Senior Investment Analyst at XYZ"
            className="bg-secondary/50 border-border/50"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm">
            Bio
          </Label>
          <textarea
            id="bio"
            value={profile.bio || ''}
            onChange={(e) => onUpdate({ bio: e.target.value })}
            placeholder="Tell us about yourself..."
            rows={3}
            className="flex w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm">
            Location
          </Label>
          <Input
            id="location"
            value={profile.location || ''}
            onChange={(e) => onUpdate({ location: e.target.value })}
            placeholder="e.g., Mumbai, India"
            className="bg-secondary/50 border-border/50"
          />
        </div>
      </CardContent>
    </Card>
  );
};
