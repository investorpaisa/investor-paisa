import React from 'react';
import { cn } from '@/lib/utils';

interface LogoIconProps {
  className?: string;
  variant?: 'light' | 'dark' | 'mono';
}

// The "iP" monogram icon - continuous line flow design from brand kit
// Primary: Teal (#0D9488) on light backgrounds
// White on dark backgrounds (#121212)
// Black for mono state
export const LogoIcon: React.FC<LogoIconProps> = ({ className, variant = 'light' }) => {
  // Use teal for light variant, white for dark, black for mono
  const strokeColor = variant === 'dark' ? '#FFFFFF' : variant === 'mono' ? '#000000' : '#0D9488';

  return (
    <svg 
      viewBox="0 0 60 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
    >
      {/* Continuous line "iP" monogram - exact match to brand kit */}
      {/* The design flows: dot on i, vertical line down, curves into P shape */}
      
      {/* Dot of the 'i' */}
      <circle 
        cx="18" 
        cy="12" 
        r="4" 
        fill={strokeColor}
      />
      
      {/* Main continuous path: i stem + P loop */}
      <path 
        d="M18 20 L18 48 M18 28 C18 28 18 20 28 20 L35 20 C44 20 44 34 35 34 L28 34 C18 34 18 34 18 42 L18 48"
        stroke={strokeColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Inner P curve - the distinctive loop */}
      <path 
        d="M24 24 L32 24 C38 24 40 27 40 30 C40 33 38 36 32 36 L24 36"
        stroke={strokeColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'mono';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Full logo with icon + wordmark
export const Logo: React.FC<LogoProps> = ({ 
  className, 
  variant = 'light',
  showIcon = true,
  size = 'md'
}) => {
  const colorClasses = {
    light: 'text-[#0D9488]', // Teal from brand kit
    dark: 'text-white',
    mono: 'text-black'
  };
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {showIcon && (
        <LogoIcon 
          className={iconSizeClasses[size]} 
          variant={variant} 
        />
      )}
      <span className={cn("font-bold font-heading tracking-tight", sizeClasses[size], colorClasses[variant])}>
        InvestorPaisa
      </span>
    </div>
  );
};

// Wordmark only (no icon) - teal text matching brand kit
export const LogoWordmark: React.FC<LogoProps> = ({ 
  className, 
  variant = 'light',
  size = 'md'
}) => {
  const colorClasses = {
    light: 'text-[#0D9488]',
    dark: 'text-white',
    mono: 'text-black'
  };
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <span className={cn("font-bold font-heading tracking-tight", sizeClasses[size], colorClasses[variant], className)}>
      InvestorPaisa
    </span>
  );
};

export default Logo;
