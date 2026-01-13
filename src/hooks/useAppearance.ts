import { useState, useEffect } from 'react';

interface AppearanceSettings {
  darkMode: boolean;
  reduceAnimations: boolean;
  compactView: boolean;
  sidebarCollapsed: boolean;
}

const APPEARANCE_KEY = 'liqlearns-appearance';

export const useAppearance = () => {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    if (typeof window === 'undefined') {
      return { darkMode: false, reduceAnimations: false, compactView: false, sidebarCollapsed: false };
    }
    const saved = localStorage.getItem(APPEARANCE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { darkMode: false, reduceAnimations: false, compactView: false, sidebarCollapsed: false };
      }
    }
    return { darkMode: false, reduceAnimations: false, compactView: false, sidebarCollapsed: false };
  });

  useEffect(() => {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(settings));
    
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply reduce animations
    if (settings.reduceAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Apply compact view
    if (settings.compactView) {
      document.documentElement.classList.add('compact');
    } else {
      document.documentElement.classList.remove('compact');
    }
  }, [settings]);

  const toggleDarkMode = (value: boolean) => {
    setSettings(prev => ({ ...prev, darkMode: value }));
  };

  const toggleReduceAnimations = (value: boolean) => {
    setSettings(prev => ({ ...prev, reduceAnimations: value }));
  };

  const toggleCompactView = (value: boolean) => {
    setSettings(prev => ({ ...prev, compactView: value }));
  };

  const toggleSidebarCollapsed = (value: boolean) => {
    setSettings(prev => ({ ...prev, sidebarCollapsed: value }));
  };

  return {
    ...settings,
    toggleDarkMode,
    toggleReduceAnimations,
    toggleCompactView,
    toggleSidebarCollapsed,
  };
};
