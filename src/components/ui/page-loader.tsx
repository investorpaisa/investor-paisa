import React from 'react';
import { motion } from 'framer-motion';
import logoIcon from '@/assets/logo-icon.png';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <motion.img
          src={logoIcon}
          alt="Loading"
          className="h-16 w-16 rounded-2xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="space-y-2 text-center">
          <p className="text-sm text-primary font-medium">Loading</p>
          <p className="text-xs text-muted-foreground">Please wait while we prepare your experience</p>
        </div>
      </div>
    </div>
  );
};
