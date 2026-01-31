import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarWithRingProps {
  src?: string | null;
  fallback: string;
  completionPercentage: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const AvatarWithRing: React.FC<AvatarWithRingProps> = ({
  src,
  fallback,
  completionPercentage,
  size = 'md',
  className,
  onClick,
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { container: 32, avatar: 26, stroke: 2, radius: 13 },
    md: { container: 40, avatar: 34, stroke: 2, radius: 17 },
    lg: { container: 48, avatar: 40, stroke: 3, radius: 20 },
  };

  const config = sizeConfig[size];
  const circumference = config.radius * 2 * Math.PI;
  const offset = circumference - (completionPercentage / 100) * circumference;

  // Ring color based on percentage
  const getRingColor = () => {
    if (completionPercentage >= 100) {
      return 'hsl(var(--primary))'; // Full cyan/teal
    } else if (completionPercentage <= 50) {
      return 'hsl(var(--foreground) / 0.3)'; // White with low opacity
    } else {
      return 'hsl(var(--primary) / 0.4)'; // Cyan with 40% opacity
    }
  };

  return (
    <div 
      className={cn('relative cursor-pointer', className)}
      style={{ width: config.container, height: config.container }}
      onClick={onClick}
    >
      {/* SVG Ring */}
      <svg
        width={config.container}
        height={config.container}
        className="absolute inset-0 -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={config.container / 2}
          cy={config.container / 2}
          r={config.radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={config.stroke}
        />
        {/* Progress ring */}
        <circle
          cx={config.container / 2}
          cy={config.container / 2}
          r={config.radius}
          fill="none"
          stroke={getRingColor()}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Avatar centered inside the ring */}
      <Avatar 
        className="absolute"
        style={{
          width: config.avatar,
          height: config.avatar,
          top: (config.container - config.avatar) / 2,
          left: (config.container - config.avatar) / 2,
        }}
      >
        <AvatarImage src={src || undefined} />
        <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
      </Avatar>
    </div>
  );
};
