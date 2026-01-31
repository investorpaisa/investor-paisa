import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface SessionContextType {
  sessionId: string;
  lastActivity: Date;
  updateActivity: () => void;
  isSessionValid: () => boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Debounce utility
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const isInitialized = useRef(false);

  const isSessionExpired = (activityTime: string | null): boolean => {
    if (!activityTime) return true;
    const lastTime = new Date(activityTime);
    const now = new Date();
    const diffHours = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
    return diffHours > 24; // Session expires after 24 hours
  };

  // Debounced activity update - only write to localStorage at most once per second
  const debouncedStorageUpdate = useCallback(
    debounce(() => {
      const now = new Date();
      localStorage.setItem('last_activity', now.toISOString());
    }, 1000),
    []
  );

  const updateActivity = useCallback(() => {
    const now = new Date();
    setLastActivity(now);
    debouncedStorageUpdate();
  }, [debouncedStorageUpdate]);

  const isSessionValid = useCallback((): boolean => {
    return !isSessionExpired(lastActivity.toISOString());
  }, [lastActivity]);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Get or create session ID
    let storedSessionId = localStorage.getItem('session_id');
    const storedActivity = localStorage.getItem('last_activity');
    
    if (!storedSessionId || isSessionExpired(storedActivity)) {
      storedSessionId = uuidv4();
      localStorage.setItem('session_id', storedSessionId);
      const now = new Date();
      setLastActivity(now);
      localStorage.setItem('last_activity', now.toISOString());
    } else {
      setLastActivity(new Date(storedActivity || new Date()));
    }
    
    setSessionId(storedSessionId);

    // Set up activity listeners with debounced handler
    // Only track significant user actions, not every mouse move
    const significantEvents = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => updateActivity();

    significantEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true, capture: false });
    });

    // Cleanup listeners
    return () => {
      significantEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, false);
      });
    };
  }, [updateActivity]);

  const value = {
    sessionId,
    lastActivity,
    updateActivity,
    isSessionValid
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
