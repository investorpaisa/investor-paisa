import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trackEvents } from '@/services/analytics/googleAnalytics';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Create free account to interact" 
}) => {
  const navigate = useNavigate();

  const handleGoogleAuth = () => {
    trackEvents.authOpen();
    onClose();
    navigate('/auth?provider=google');
  };

  const handleEmailAuth = () => {
    trackEvents.authOpen();
    onClose();
    navigate('/auth');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="glass border-border/50 rounded-3xl max-w-md p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-xl font-heading text-center">
                  {title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-3 px-6 pb-6">
                <Button
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center space-x-3 py-4 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                  </svg>
                  <span>Continue with Google</span>
                </Button>
                
                <Button
                  onClick={handleEmailAuth}
                  variant="outline"
                  className="w-full py-4 h-12 px-6 rounded-xl border-2 border-border hover:bg-secondary/50 transition-all"
                >
                  Continue with Email
                </Button>
                
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default AuthGateModal;
