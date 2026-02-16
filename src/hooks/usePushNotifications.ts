import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const permissionGranted = useRef(false);
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('Notification' in window)) return;

    // Request permission on mount if not already decided
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        permissionGranted.current = perm === 'granted';
      });
    } else {
      permissionGranted.current = Notification.permission === 'granted';
    }

    // Get the active service worker registration for mobile notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        swRegistration.current = reg;
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let profileId: string | null = null;

    const setup = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      profileId = profile.id;
    };

    setup();

    // Listen for new notifications and show browser notification
    const channel = supabase
      .channel(`push-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const notif = payload.new as any;
          // Only show for this user's notifications
          if (profileId && notif.user_id === profileId) {
            showBrowserNotification(notif.title, notif.message, notif.type);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const showBrowserNotification = (title: string, body: string, type?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // Don't show if the page is focused (user can see in-app notifications)
    if (document.hasFocus()) return;

    const notificationOptions = {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: type || 'general',
      renotify: true,
      requireInteraction: false,
    } as NotificationOptions & { renotify?: boolean };

    // Use Service Worker showNotification for PWA/mobile support
    if (swRegistration.current) {
      swRegistration.current.showNotification(title, notificationOptions).catch(() => {
        // Fallback to regular Notification if SW method fails
        fallbackNotification(title, notificationOptions);
      });
    } else {
      fallbackNotification(title, notificationOptions);
    }
  };

  const fallbackNotification = (title: string, options: NotificationOptions) => {
    try {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      setTimeout(() => notification.close(), 5000);
    } catch {
      // Some browsers don't support new Notification()
    }
  };
};
