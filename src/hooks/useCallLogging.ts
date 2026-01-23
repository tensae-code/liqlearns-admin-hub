import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export interface CallLog {
  callerId: string;
  receiverId: string;
  callType: 'voice' | 'video';
  status: 'missed' | 'answered' | 'rejected' | 'ended';
  durationSeconds?: number;
}

export const useCallLogging = () => {
  const { profile } = useProfile();

  const logCall = useCallback(async (log: CallLog) => {
    if (!profile) {
      console.error('[CallLogging] No profile available');
      return null;
    }

    try {
      // We need to find the profile.id for both caller and receiver
      // The callerId and receiverId are user_ids (auth.uid)
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', log.callerId)
        .single();

      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', log.receiverId)
        .single();

      if (!callerProfile || !receiverProfile) {
        console.error('[CallLogging] Could not find profiles for caller/receiver');
        return null;
      }

      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          caller_id: callerProfile.id,
          receiver_id: receiverProfile.id,
          call_type: log.callType,
          status: log.status,
          duration_seconds: log.durationSeconds || 0,
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[CallLogging] Error logging call:', error);
        return null;
      }

      console.log('[CallLogging] Call logged:', data.id);
      return data;
    } catch (error) {
      console.error('[CallLogging] Error:', error);
      return null;
    }
  }, [profile]);

  const fetchCallLogs = useCallback(async (partnerId: string) => {
    if (!profile) return [];

    try {
      // Get partner's profile id
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', partnerId)
        .single();

      if (!partnerProfile) return [];

      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .or(
          `and(caller_id.eq.${profile.id},receiver_id.eq.${partnerProfile.id}),and(caller_id.eq.${partnerProfile.id},receiver_id.eq.${profile.id})`
        )
        .order('started_at', { ascending: true });

      if (error) {
        console.error('[CallLogging] Error fetching call logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[CallLogging] Error:', error);
      return [];
    }
  }, [profile]);

  return { logCall, fetchCallLogs };
};
