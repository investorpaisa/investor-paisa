import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PrivacySectionProps {
  privacyExperience: boolean;
  privacyEducation: boolean;
  privacyCertifications: boolean;
  privacySkills: boolean;
  privacyInterests?: boolean;
  onUpdate: (updates: {
    privacy_experience?: boolean;
    privacy_education?: boolean;
    privacy_certifications?: boolean;
    privacy_skills?: boolean;
    privacy_interests?: boolean;
  }) => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  privacyExperience,
  privacyEducation,
  privacyCertifications,
  privacySkills,
  privacyInterests = true,
  onUpdate,
}) => {
  const privacySettings = [
    {
      key: 'privacy_experience',
      label: 'Experience',
      description: 'Show your work experience on public profile',
      value: privacyExperience,
    },
    {
      key: 'privacy_education',
      label: 'Education',
      description: 'Show your education on public profile',
      value: privacyEducation,
    },
    {
      key: 'privacy_certifications',
      label: 'Certifications',
      description: 'Show your certifications on public profile',
      value: privacyCertifications,
    },
    {
      key: 'privacy_skills',
      label: 'Skills',
      description: 'Show your skills on public profile',
      value: privacySkills,
    },
    {
      key: 'privacy_interests',
      label: 'Interests',
      description: 'Show your financial interests on public profile',
      value: privacyInterests,
    },
  ];

  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
          <Lock className="h-5 w-5 mr-2 text-primary" />
          Privacy Settings
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Control what others can see on your public profile
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {privacySettings.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {setting.value ? (
                <Eye className="h-4 w-4 text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label className="text-sm font-medium">{setting.label}</Label>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </div>
            </div>
            <Switch
              checked={setting.value}
              onCheckedChange={(checked) => {
                onUpdate({ [setting.key]: checked });
              }}
            />
          </div>
        ))}
        
        <div className="pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground">
            Note: Your name, bio, goals, and activity (posts/answers/comments) are always visible on your public profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
