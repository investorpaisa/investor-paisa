import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { AskBottomSheet } from './AskBottomSheet';
import { PiChatPanel } from './PiChatPanel';

export const PiCopilot: React.FC = () => {
  const { 
    isAskSheetOpen, 
    askSheetState,
    openAskSheet, 
    closeAskSheet 
  } = useUIStore();

  const [showChat, setShowChat] = React.useState(false);

  const handleOrbClick = () => {
    if (isAskSheetOpen) {
      closeAskSheet();
      setShowChat(false);
    } else {
      openAskSheet();
    }
  };

  const handleAskPaisaBot = () => {
    setShowChat(true);
  };

  const handleBackToAsk = () => {
    setShowChat(false);
  };

  return (
    <>
      {/* Floating Orb */}
      <motion.button
        onClick={handleOrbClick}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg flex items-center justify-center cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: isAskSheetOpen 
            ? '0 0 20px rgba(var(--primary-rgb), 0.5)' 
            : '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {isAskSheetOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bot className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isAskSheetOpen && (
          showChat ? (
            <PiChatPanel onBack={handleBackToAsk} onClose={closeAskSheet} />
          ) : (
            <AskBottomSheet 
              onAskPaisaBot={handleAskPaisaBot}
              onClose={closeAskSheet}
            />
          )
        )}
      </AnimatePresence>
    </>
  );
};
