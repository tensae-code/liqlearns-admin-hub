import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface CallInvite {
  id: string;
  session_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  call_type: string;
  room_name: string;
  inviter_name: string;
  inviter_avatar: string | null;
  context_type: string;
  context_id: string;
  created_at: string;
}

interface UseIncomingCallSubscriptionProps {
  onIncomingCall: (invite: CallInvite) => void;
  onCallCancelled: (inviteId: string) => void;
}

/**
 * Hook to subscribe to incoming call invites in real-time
 * Works across all pages to notify the user of incoming calls
 */
export const useIncomingCallSubscription = ({
  onIncomingCall,
  onCallCancelled,
}: UseIncomingCallSubscriptionProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('[IncomingCallSubscription] Setting up subscription for user:', user.id);

    // Subscribe to new call invites for this user
    const channel = supabase
      .channel(`call-invites-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'livekit_session_invites',
          filter: `invitee_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresInsertPayload<CallInvite>) => {
          console.log('[IncomingCallSubscription] New call invite:', payload.new);
          const invite = payload.new;
          if (invite.status === 'pending') {
            onIncomingCall(invite);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'livekit_session_invites',
          filter: `invitee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[IncomingCallSubscription] Call invite updated:', payload.new);
          const invite = payload.new as CallInvite;
          // If the invite was cancelled or rejected
          if (invite.status === 'cancelled' || invite.status === 'rejected') {
            onCallCancelled(invite.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'livekit_session_invites',
          filter: `invitee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[IncomingCallSubscription] Call invite deleted:', payload.old);
          const oldInvite = payload.old as { id: string };
          onCallCancelled(oldInvite.id);
        }
      )
      .subscribe((status) => {
        console.log('[IncomingCallSubscription] Subscription status:', status);
      });

    return () => {
      console.log('[IncomingCallSubscription] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, onIncomingCall, onCallCancelled]);

  // Function to create a call invite
  const sendCallInvite = useCallback(async (
    inviteeId: string,
    sessionId: string,
    roomName: string,
    callType: 'voice' | 'video',
    inviterName: string,
    inviterAvatar: string | null,
    contextType: string,
    contextId: string
  ) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('livekit_session_invites')
        .insert({
          session_id: sessionId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          status: 'pending',
          call_type: callType,
          room_name: roomName,
          inviter_name: inviterName,
          inviter_avatar: inviterAvatar,
          context_type: contextType,
          context_id: contextId,
        })
        .select()
        .single();

      if (error) {
        console.error('[IncomingCallSubscription] Failed to create invite:', error);
        return null;
      }

      console.log('[IncomingCallSubscription] Created call invite:', data);
      return data;
    } catch (err) {
      console.error('[IncomingCallSubscription] Error creating invite:', err);
      return null;
    }
  }, [user?.id]);

  // Function to cancel a call invite
  const cancelCallInvite = useCallback(async (inviteId: string) => {
    try {
      await supabase
        .from('livekit_session_invites')
        .update({ status: 'cancelled', responded_at: new Date().toISOString() })
        .eq('id', inviteId);
    } catch (err) {
      console.error('[IncomingCallSubscription] Error cancelling invite:', err);
    }
  }, []);

  // Function to respond to a call invite
  const respondToInvite = useCallback(async (inviteId: string, accept: boolean) => {
    try {
      await supabase
        .from('livekit_session_invites')
        .update({ 
          status: accept ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', inviteId);
    } catch (err) {
      console.error('[IncomingCallSubscription] Error responding to invite:', err);
    }
  }, []);

  return {
    sendCallInvite,
    cancelCallInvite,
    respondToInvite,
  };
};
