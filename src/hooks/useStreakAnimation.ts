import { useState, useEffect, useCallback } from 'react';

const STREAK_SHOWN_KEY = 'liqlearns-streak-shown-date';

export const useStreakAnimation = (streak: number, userId: string | undefined) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [isAutoClose, setIsAutoClose] = useState(false);

  useEffect(() => {
    if (!userId || streak <= 0) return;

    // Check if we've already shown the animation today for this user
    const today = new Date().toDateString();
    const lastShownKey = `${STREAK_SHOWN_KEY}-${userId}`;
    const lastShown = localStorage.getItem(lastShownKey);

    if (lastShown !== today) {
      // Show animation after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowAnimation(true);
        setIsAutoClose(true);
        localStorage.setItem(lastShownKey, today);
        
        // Auto-close after 2 seconds as a greeting
        setTimeout(() => {
          setShowAnimation(false);
          setIsAutoClose(false);
        }, 2000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [streak, userId]);

  const closeAnimation = useCallback(() => {
    setShowAnimation(false);
    setIsAutoClose(false);
  }, []);

  // Manual trigger (when clicking streak tracker) - doesn't auto-close
  const triggerAnimation = useCallback(() => {
    setShowAnimation(true);
    setIsAutoClose(false);
  }, []);

  return {
    showAnimation,
    closeAnimation,
    triggerAnimation,
    isAutoClose,
  };
};
