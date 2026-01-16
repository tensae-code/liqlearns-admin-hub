import { useLocation } from 'react-router-dom';
import QuickAccessButton from '@/components/quick-access/QuickAccessButton';
import FloatingStudyRoom from '@/components/study-rooms/FloatingStudyRoom';
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext';
import useScreenshotProtection from '@/hooks/useScreenshotProtection';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Global floating elements that persist across authenticated routes only
 * - QuickAccessButton: Quick action menu (hidden on landing/auth pages)
 * - FloatingStudyRoom: Shows when user is in popout mode
 * - Screenshot Protection: Applied based on CEO settings
 */
const GlobalFloatingElements = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = usePlatformSettings();
  
  // Apply screenshot protection based on CEO settings
  useScreenshotProtection({
    enabled: settings.security.screenshotProtection && !!user,
    showWatermark: settings.security.watermarkEnabled,
    watermarkOpacity: settings.security.watermarkOpacity / 100,
    watermarkText: user?.email?.split('@')[0] || '',
    preventScreenRecord: true,
    blurOnCapture: true,
  });
  
  // Hide quick access on landing page and auth page
  const hiddenPaths = ['/', '/auth'];
  const shouldHideQuickAccess = hiddenPaths.includes(location.pathname);

  return (
    <>
      {/* Floating Study Room - renders when in popout mode */}
      <FloatingStudyRoom />
      
      {/* Quick Access Button - hidden on landing/auth pages */}
      {!shouldHideQuickAccess && <QuickAccessButton />}
    </>
  );
};

export default GlobalFloatingElements;
