import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProfileCompletionRingProps {
  profile: {
    full_name?: string;
    bio?: string;
    headline?: string;
    location?: string;
    avatar_url?: string;
    interests?: string[];
    goals?: string[];
    mobile_verified?: boolean;
    linkedin_verified?: boolean;
  };
  experienceCount: number;
  educationCount: number;
  skillCount: number;
  certificationCount: number;
}

interface CompletionItem {
  label: string;
  completed: boolean;
  points: number;
}

export const ProfileCompletionRing: React.FC<ProfileCompletionRingProps> = ({
  profile,
  experienceCount,
  educationCount,
  skillCount,
  certificationCount,
}) => {
  const items: CompletionItem[] = [
    { label: 'Full Name', completed: !!(profile.full_name && profile.full_name.trim().length > 0), points: 10 },
    { label: 'Headline', completed: !!(profile.headline && profile.headline.trim().length > 0), points: 10 },
    { label: 'Bio', completed: !!(profile.bio && profile.bio.trim().length > 0), points: 10 },
    { label: 'Location', completed: !!(profile.location && profile.location.trim().length > 0), points: 10 },
    // Avatar removed from scoring per user request
    { label: 'Interests', completed: !!(profile.interests && profile.interests.length > 0), points: 10 },
    { label: 'Goals', completed: !!(profile.goals && profile.goals.length > 0), points: 15 }, // Increased from 10
    { label: 'Mobile Verified', completed: !!profile.mobile_verified, points: 20 },
    { label: 'LinkedIn Connected', completed: !!profile.linkedin_verified, points: 15 },
  ];

  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = items.filter(item => item.completed).reduce((sum, item) => sum + item.points, 0);
  const percentage = Math.round((earnedPoints / totalPoints) * 100);

  // SVG circle properties
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="glass border-border/50 rounded-2xl">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Circular Progress */}
          <div className="relative flex-shrink-0">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{percentage}%</span>
            </div>
          </div>

          {/* Completion Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base mb-2">Profile Completeness</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
              {items.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs">
                  {item.completed ? (
                    <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
