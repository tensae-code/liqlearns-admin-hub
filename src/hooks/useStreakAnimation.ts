import { useState, useEffect, useCallback, useRef } from 'react';

const STREAK_SHOWN_KEY = 'liqlearns-streak-shown-date';

export const useStreakAnimation = (streak: number, userId: string | undefined) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [isAutoClose, setIsAutoClose] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup all timers
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    if (!userId || streak <= 0) return;

    // Check if we've already shown the animation today for this user
    const today = new Date().toDateString();
    const lastShownKey = `${STREAK_SHOWN_KEY}-${userId}`;
    const lastShown = localStorage.getItem(lastShownKey);

    if (lastShown !== today) {
      // Show animation after a short delay to let the page load
      const showTimer = setTimeout(() => {
        setShowAnimation(true);
        setIsAutoClose(true);
        localStorage.setItem(lastShownKey, today);
        
        // Auto-close after 2 seconds as a greeting
        const closeTimer = setTimeout(() => {
          setShowAnimation(false);
          setIsAutoClose(false);
        }, 2000);
        
        timersRef.current.push(closeTimer);
      }, 500);

      timersRef.current.push(showTimer);
    }

    return () => {
      clearTimers();
    };
  }, [streak, userId, clearTimers]);

  const closeAnimation = useCallback(() => {
    clearTimers();
    setShowAnimation(false);
    setIsAutoClose(false);
  }, [clearTimers]);

  // Manual trigger (when clicking streak tracker) - doesn't auto-close
  const triggerAnimation = useCallback(() => {
    clearTimers();
    setShowAnimation(true);
    setIsAutoClose(false);
  }, [clearTimers]);

  return {
    showAnimation,
    closeAnimation,
    triggerAnimation,
    isAutoClose,
  };
};
