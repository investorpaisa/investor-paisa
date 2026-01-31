import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = "Something went wrong", 
  description = "An error occurred. Please try again.", 
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="h-10 w-10 text-destructive mb-4" />
    <h3 className="font-medium text-base mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm mb-4 max-w-xs">{description}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    )}
  </div>
);

export default ErrorState;
