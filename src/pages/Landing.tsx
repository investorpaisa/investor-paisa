import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LandingFeedPreview } from '@/components/landing/LandingFeedPreview';
import logoIcon from '@/assets/logo-icon.png';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);

  const handleContinue = () => {
    navigate('/feed');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleAuthGate = () => {
    setShowAuthGate(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Animated gradient noise background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"
          animate={{ 
            x: [0, -40, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[80px]"
          animate={{ 
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoIcon} 
              alt="InvestorPaisa" 
              className="w-10 h-10 rounded-xl"
            />
            <span className="font-bold text-xl font-heading">
              Investor<span className="text-primary">Paisa</span>
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={handleSignIn}
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            Sign in
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        className="relative z-10 pt-16 pb-12 px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-heading"
            variants={itemVariants}
          >
            Ask anything about{' '}
            <span className="gradient-text">money.</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mb-12"
            variants={itemVariants}
          >
            AI + community + experts.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                size="lg" 
                onClick={handleContinue}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-6 h-auto rounded-2xl glow-primary font-semibold"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleSignIn}
                className="text-lg px-10 py-6 h-auto border-2 border-border hover:bg-secondary rounded-2xl"
              >
                Sign in
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Limited Pulse Feed Preview (first 10 items, read-only) */}
      <motion.section
        className="relative z-10 px-6 pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-lg font-medium text-muted-foreground">
              Trending discussions
            </h2>
          </div>
          <LandingFeedPreview onAuthRequired={handleAuthGate} />
        </div>
      </motion.section>

      {/* Auth Gate Modal */}
      <AnimatePresence>
        {showAuthGate && (
          <Dialog open={showAuthGate} onOpenChange={setShowAuthGate}>
            <DialogContent className="glass border-border/50 rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading text-center">
                  Create a free account to save & ask.
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Button
                  onClick={() => navigate('/auth?provider=google')}
                  className="w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl bg-primary text-primary-foreground font-medium"
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
                  onClick={() => navigate('/auth')}
                  variant="outline"
                  className="w-full py-4 px-6 rounded-xl border-2 border-border"
                >
                  Continue with Email
                </Button>
                <Button
                  onClick={() => setShowAuthGate(false)}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
