import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MessagingSettings {
  font_size: number;
  show_status: boolean;
  show_activity: boolean;
  show_avatar: boolean;
  show_name: boolean;
  accept_non_friends: boolean;
  messages_before_accept: number;
}

const DEFAULT_SETTINGS: MessagingSettings = {
  font_size: 14,
  show_status: true,
  show_activity: true,
  show_avatar: true,
  show_name: true,
  accept_non_friends: true,
  messages_before_accept: 3,
};

export const useMessagingSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MessagingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('user_messaging_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          font_size: data.font_size,
          show_status: data.show_status,
          show_activity: data.show_activity,
          show_avatar: data.show_avatar,
          show_name: (data as any).show_name ?? true,
          accept_non_friends: data.accept_non_friends,
          messages_before_accept: data.messages_before_accept,
        });
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<MessagingSettings>) => {
    if (!user) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    const { error } = await supabase
      .from('user_messaging_settings')
      .upsert({
        user_id: user.id,
        ...newSettings,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving messaging settings:', error);
    }
  }, [user, settings]);

  return { settings, updateSettings, loading };
};
