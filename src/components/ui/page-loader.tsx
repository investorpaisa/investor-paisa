import React from 'react';
import { motion } from 'framer-motion';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="text-2xl font-bold font-heading"
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Investor<span className="text-primary">Paisa</span>
        </motion.div>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                delay: i * 0.15,
                ease: "easeInOut" 
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
