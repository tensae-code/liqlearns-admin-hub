import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg);
        
        // Check for updates every 60 seconds
        const interval = setInterval(() => {
          reg.update();
        }, 60000);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - auto reload
                setUpdateAvailable(true);
                window.location.reload();
              }
            });
          }
        });

        return () => clearInterval(interval);
      }).catch((error) => {
        console.log('SW registration failed:', error);
      });

      // Listen for controller change (new SW activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const skipWaiting = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return { updateAvailable, skipWaiting };
};
