import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const permissionGranted = useRef(false);

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

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: type || 'general',
      } as NotificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch {
      // Fallback: some browsers don't support new Notification()
    }
  };
};
