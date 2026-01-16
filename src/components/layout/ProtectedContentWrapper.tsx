import { ReactNode } from 'react';
import useScreenshotProtection from '@/hooks/useScreenshotProtection';

interface ProtectedContentWrapperProps {
  children: ReactNode;
  enabled?: boolean;
  showWatermark?: boolean;
  watermarkOpacity?: number;
  watermarkText?: string;
  className?: string;
}

const ProtectedContentWrapper = ({
  children,
  enabled = true,
  showWatermark = false,
  watermarkOpacity = 0.1,
  watermarkText = '',
  className = '',
}: ProtectedContentWrapperProps) => {
  useScreenshotProtection({
    enabled,
    showWatermark,
    watermarkOpacity,
    watermarkText,
    preventScreenRecord: true,
    blurOnCapture: true,
  });

  return (
    <div className={`protected-content ${className}`}>
      {children}
    </div>
  );
};

export default ProtectedContentWrapper;
