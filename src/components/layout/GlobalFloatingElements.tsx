import FloatingStudyRoom from '@/components/study-rooms/FloatingStudyRoom';

/**
 * Global floating elements that persist across all routes
 * - FloatingStudyRoom: Shows when user is in popout mode
 */
const GlobalFloatingElements = () => {
  return (
    <>
      {/* Floating Study Room - renders when in popout mode */}
      <FloatingStudyRoom />
    </>
  );
};

export default GlobalFloatingElements;
