import { useState, useEffect, useCallback } from 'react';

const STREAK_SHOWN_KEY = 'liqlearns-streak-shown-date';

export const useStreakAnimation = (streak: number, userId: string | undefined) => {
  const [showAnimation, setShowAnimation] = useState(false);

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
        localStorage.setItem(lastShownKey, today);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [streak, userId]);

  const closeAnimation = useCallback(() => {
    setShowAnimation(false);
  }, []);

  const triggerAnimation = useCallback(() => {
    setShowAnimation(true);
  }, []);

  return {
    showAnimation,
    closeAnimation,
    triggerAnimation,
  };
};
