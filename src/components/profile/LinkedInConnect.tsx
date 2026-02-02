import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LinkedInConnectProps {
  isConnected: boolean;
  onConnect?: () => void;
}

// Validate JSON response helper
const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.error('[LinkedIn] Invalid response content-type:', contentType);
    throw new Error('Server returned invalid response. LinkedIn Connect may not be available.');
  }
  return response.json();
};

export const LinkedInConnect: React.FC<LinkedInConnectProps> = ({ 
  isConnected, 
  onConnect 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to connect LinkedIn');
        return;
      }

      const redirectUri = `${window.location.origin}/profile/edit`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-linkedin-connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'get_auth_url',
            redirectUri,
          }),
        }
      );

      const data = await parseJsonResponse(response);

      if (data.error) {
        if (data.message) {
          toast.error(data.message);
        } else {
          toast.error(data.error);
        }
        return;
      }

      // Store state for verification
      sessionStorage.setItem('linkedin_oauth_state', data.state);
      
      // Redirect to LinkedIn OAuth
      window.location.href = data.authUrl;

    } catch (error) {
      console.error('LinkedIn connect error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect LinkedIn');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback
  React.useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = sessionStorage.getItem('linkedin_oauth_state');

      if (code && state && storedState === state) {
        setIsLoading(true);
        sessionStorage.removeItem('linkedin_oauth_state');

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error('Session expired');
            return;
          }

          const redirectUri = `${window.location.origin}/profile/edit`;

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-linkedin-connect`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                action: 'exchange_code',
                code,
                redirectUri,
              }),
            }
          );

          const data = await parseJsonResponse(response);

          if (data.success) {
            toast.success('LinkedIn connected successfully!');
            onConnect?.();
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            toast.error(data.error || 'Failed to connect LinkedIn');
          }
        } catch (error) {
          console.error('LinkedIn callback error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to complete LinkedIn connection');
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [onConnect]);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-success/10 text-success border-success/30">
          <Check className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={isLoading}
      className="gap-2 rounded-2xl border-blue-500/30 hover:bg-blue-500/10"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Linkedin className="h-4 w-4 text-blue-500" />
      )}
      Connect LinkedIn
    </Button>
  );
};