import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Share2, CheckCircle2 } from 'lucide-react';
import { LinkedInConnect } from '@/components/profile/LinkedInConnect';
import type { ProfileFormData } from '@/hooks/useEditProfile';

// Simple SVG icons for social platforms
const LinkedInIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

interface SocialProfilesSectionProps {
  profile: ProfileFormData;
  linkedinVerified: boolean;
  onUpdate: (updates: Partial<ProfileFormData>) => void;
  onLinkedInConnected?: () => void;
  errors?: Record<string, string>;
}

export const SocialProfilesSection: React.FC<SocialProfilesSectionProps> = ({
  profile,
  linkedinVerified,
  onUpdate,
  onLinkedInConnected,
  errors = {},
}) => {
  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
          <Share2 className="h-5 w-5 mr-2 text-primary" />
          Social Profiles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* LinkedIn */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <LinkedInIcon />
              LinkedIn
            </Label>
            {linkedinVerified && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={profile.linkedin_url || ''}
              onChange={(e) => onUpdate({ linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
              className={`flex-1 bg-secondary/50 border-border/50 ${errors.linkedin_url ? 'border-destructive' : ''}`}
            />
            {!linkedinVerified && profile.linkedin_url && (
              <LinkedInConnect isConnected={linkedinVerified} onConnect={onLinkedInConnected} />
            )}
          </div>
          {errors.linkedin_url && (
            <p className="text-xs text-destructive">{errors.linkedin_url}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Connect LinkedIn to increase your trust score
          </p>
        </div>

        {/* Twitter/X */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <TwitterIcon />
            X (Twitter)
          </Label>
          <Input
            value={profile.twitter_url || ''}
            onChange={(e) => onUpdate({ twitter_url: e.target.value })}
            placeholder="https://x.com/yourhandle"
            className={`bg-secondary/50 border-border/50 ${errors.twitter_url ? 'border-destructive' : ''}`}
          />
          {errors.twitter_url && (
            <p className="text-xs text-destructive">{errors.twitter_url}</p>
          )}
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <InstagramIcon />
            Instagram
          </Label>
          <Input
            value={profile.instagram_url || ''}
            onChange={(e) => onUpdate({ instagram_url: e.target.value })}
            placeholder="https://instagram.com/yourprofile"
            className={`bg-secondary/50 border-border/50 ${errors.instagram_url ? 'border-destructive' : ''}`}
          />
          {errors.instagram_url && (
            <p className="text-xs text-destructive">{errors.instagram_url}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
