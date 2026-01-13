import QuickAccessButton from '@/components/quick-access/QuickAccessButton';
import FloatingStudyRoom from '@/components/study-rooms/FloatingStudyRoom';

/**
 * Global floating elements that persist across all routes
 * - QuickAccessButton: Quick action menu
 * - FloatingStudyRoom: Shows when user is in popout mode
 */
const GlobalFloatingElements = () => {
  return (
    <>
      {/* Floating Study Room - renders when in popout mode */}
      <FloatingStudyRoom />
      
      {/* Quick Access Button - always visible */}
      <QuickAccessButton />
    </>
  );
};

export default GlobalFloatingElements;
