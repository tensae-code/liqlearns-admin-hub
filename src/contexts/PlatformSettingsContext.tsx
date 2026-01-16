import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SecuritySettings {
  screenshotProtection: boolean;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  maxDevices: number;
  sessionTimeout: number;
}

interface ContentSettings {
  aiModeration: boolean;
  profanityFilter: boolean;
  imageModeration: boolean;
  minDMAge: number;
}

interface EngagementSettings {
  dailyBonusEnabled: boolean;
  dailyBonusAmount: number;
  streakBonusEnabled: boolean;
  streakBonusAmount: number;
  referralEnabled: boolean;
  referralReward: number;
}

interface PlatformSettings {
  security: SecuritySettings;
  content: ContentSettings;
  engagement: EngagementSettings;
}

interface PlatformSettingsContextType {
  settings: PlatformSettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  updateContentSettings: (settings: Partial<ContentSettings>) => void;
  updateEngagementSettings: (settings: Partial<EngagementSettings>) => void;
  saveSettings: () => void;
}

const defaultSettings: PlatformSettings = {
  security: {
    screenshotProtection: true,
    watermarkEnabled: false,
    watermarkOpacity: 15,
    maxDevices: 3,
    sessionTimeout: 60,
  },
  content: {
    aiModeration: true,
    profanityFilter: true,
    imageModeration: true,
    minDMAge: 13,
  },
  engagement: {
    dailyBonusEnabled: true,
    dailyBonusAmount: 10,
    streakBonusEnabled: true,
    streakBonusAmount: 5,
    referralEnabled: true,
    referralReward: 50,
  },
};

const PlatformSettingsContext = createContext<PlatformSettingsContextType | undefined>(undefined);

export const usePlatformSettings = () => {
  const context = useContext(PlatformSettingsContext);
  if (!context) {
    throw new Error('usePlatformSettings must be used within a PlatformSettingsProvider');
  }
  return context;
};

interface PlatformSettingsProviderProps {
  children: ReactNode;
}

export const PlatformSettingsProvider = ({ children }: PlatformSettingsProviderProps) => {
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('platformSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const updateSecuritySettings = (newSettings: Partial<SecuritySettings>) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, ...newSettings },
    }));
  };

  const updateContentSettings = (newSettings: Partial<ContentSettings>) => {
    setSettings(prev => ({
      ...prev,
      content: { ...prev.content, ...newSettings },
    }));
  };

  const updateEngagementSettings = (newSettings: Partial<EngagementSettings>) => {
    setSettings(prev => ({
      ...prev,
      engagement: { ...prev.engagement, ...newSettings },
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('platformSettings', JSON.stringify(settings));
  };

  // Auto-save when settings change
  useEffect(() => {
    localStorage.setItem('platformSettings', JSON.stringify(settings));
  }, [settings]);

  return (
    <PlatformSettingsContext.Provider
      value={{
        settings,
        updateSecuritySettings,
        updateContentSettings,
        updateEngagementSettings,
        saveSettings,
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export default PlatformSettingsContext;
