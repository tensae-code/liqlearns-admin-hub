import { useLocation } from 'react-router-dom';
import QuickAccessButton from '@/components/quick-access/QuickAccessButton';
import FloatingStudyRoom from '@/components/study-rooms/FloatingStudyRoom';

/**
 * Global floating elements that persist across authenticated routes only
 * - QuickAccessButton: Quick action menu (hidden on landing/auth pages)
 * - FloatingStudyRoom: Shows when user is in popout mode
 */
const GlobalFloatingElements = () => {
  const location = useLocation();
  
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
