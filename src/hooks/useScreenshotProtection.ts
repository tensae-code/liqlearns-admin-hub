import { useEffect } from 'react';

interface ScreenshotProtectionOptions {
  enabled: boolean;
  showWatermark?: boolean;
  watermarkOpacity?: number;
  watermarkText?: string;
  preventScreenRecord?: boolean;
  blurOnCapture?: boolean;
}

export const useScreenshotProtection = (options: ScreenshotProtectionOptions) => {
  const {
    enabled,
    showWatermark = true,
    watermarkOpacity = 0.15,
    watermarkText = '',
    preventScreenRecord = true,
    blurOnCapture = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    // Prevent right-click context menu on protected content
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.protected-content')) {
        e.preventDefault();
      }
    };

    // Prevent keyboard shortcuts for screenshots
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        if (blurOnCapture) {
          blurScreen();
        }
      }
      
      // Mac screenshot shortcuts (Cmd + Shift + 3/4/5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        if (blurOnCapture) {
          blurScreen();
        }
      }
      
      // Windows Snipping Tool (Win + Shift + S)
      if (e.metaKey && e.shiftKey && e.key === 's') {
        e.preventDefault();
        if (blurOnCapture) {
          blurScreen();
        }
      }
      
      // Prevent Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
      }
    };

    // Blur screen temporarily on capture attempt
    const blurScreen = () => {
      document.body.classList.add('screenshot-blur');
      setTimeout(() => {
        document.body.classList.remove('screenshot-blur');
      }, 500);
    };

    // Detect visibility change (possible screen recording indicator)
    const handleVisibilityChange = () => {
      if (preventScreenRecord && document.hidden) {
        // Page is hidden, could be screen recording
      }
    };

    // Detect DevTools opening (indirect screenshot protection)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        document.body.classList.add('devtools-open');
      } else {
        document.body.classList.remove('devtools-open');
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', detectDevTools);

    // Initial check
    detectDevTools();

    // Add CSS for protection
    const style = document.createElement('style');
    style.id = 'screenshot-protection-styles';
    style.textContent = `
      .screenshot-blur .protected-content {
        filter: blur(20px) !important;
        transition: filter 0.1s ease;
      }
      
      .devtools-open .protected-content {
        filter: blur(5px);
      }
      
      .protected-content {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -webkit-touch-callout: none;
      }
      
      /* Watermark overlay */
      .watermark-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 9999;
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 100px,
          rgba(0, 0, 0, ${watermarkOpacity}) 100px,
          rgba(0, 0, 0, ${watermarkOpacity}) 100.5px
        );
      }
      
      .watermark-overlay::before {
        content: '${watermarkText}';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 2rem;
        color: rgba(0, 0, 0, ${watermarkOpacity});
        white-space: nowrap;
        pointer-events: none;
      }
      
      /* Prevent image dragging */
      .protected-content img {
        -webkit-user-drag: none;
        user-drag: none;
        pointer-events: none;
      }
      
      /* CSS to hide content in print */
      @media print {
        .protected-content {
          display: none !important;
        }
        body::before {
          content: 'This content is protected and cannot be printed.';
          display: block;
          padding: 2rem;
          text-align: center;
          font-size: 1.5rem;
        }
      }
    `;
    document.head.appendChild(style);

    // Add watermark if enabled
    let watermarkElement: HTMLDivElement | null = null;
    if (showWatermark && watermarkText) {
      watermarkElement = document.createElement('div');
      watermarkElement.className = 'watermark-overlay';
      watermarkElement.id = 'screenshot-watermark';
      document.body.appendChild(watermarkElement);
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', detectDevTools);
      
      const styleEl = document.getElementById('screenshot-protection-styles');
      if (styleEl) styleEl.remove();
      
      if (watermarkElement) watermarkElement.remove();
      
      document.body.classList.remove('screenshot-blur', 'devtools-open');
    };
  }, [enabled, showWatermark, watermarkOpacity, watermarkText, preventScreenRecord, blurOnCapture]);
};

export default useScreenshotProtection;
