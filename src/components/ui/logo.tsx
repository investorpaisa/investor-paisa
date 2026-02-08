import React from 'react';
import { cn } from '@/lib/utils';

interface LogoIconProps {
  className?: string;
  variant?: 'light' | 'dark' | 'mono';
}

// The "iP" monogram icon - continuous line flow design
export const LogoIcon: React.FC<LogoIconProps> = ({ className, variant = 'light' }) => {
  const colorClasses = {
    light: 'text-primary',
    dark: 'text-white',
    mono: 'text-black'
  };

  return (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", colorClasses[variant], className)}
    >
      {/* Continuous line iP monogram */}
      <path 
        d="M12 32V14M12 14C12 10.686 14.686 8 18 8H22C25.314 8 28 10.686 28 14V14C28 17.314 25.314 20 22 20H18M18 20V32M18 20C18 23.314 20.686 26 24 26H28"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on i */}
      <circle 
        cx="12" 
        cy="6" 
        r="2.5" 
        fill="currentColor"
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
    light: 'text-primary',
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
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <LogoIcon 
          className={iconSizeClasses[size]} 
          variant={variant} 
        />
      )}
      <span className={cn("font-bold font-heading", sizeClasses[size], colorClasses[variant])}>
        InvestorPaisa
      </span>
    </div>
  );
};

// Wordmark only (no icon)
export const LogoWordmark: React.FC<LogoProps> = ({ 
  className, 
  variant = 'light',
  size = 'md'
}) => {
  const colorClasses = {
    light: 'text-primary',
    dark: 'text-white',
    mono: 'text-black'
  };
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <span className={cn("font-bold font-heading", sizeClasses[size], colorClasses[variant], className)}>
      InvestorPaisa
    </span>
  );
};

export default Logo;
