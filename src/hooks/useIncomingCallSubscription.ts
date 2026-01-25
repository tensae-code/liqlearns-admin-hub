import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
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
  const { profile } = useProfile();

  useEffect(() => {
    // CRITICAL: Use profile.id (the invitee_id in the DB) not user.id (auth uid)
    if (!profile?.id) {
      console.log('[IncomingCallSubscription] Waiting for profile to load...');
      return;
    }

    const myProfileId = profile.id;
    console.log('[IncomingCallSubscription] Setting up subscription for profile:', myProfileId);

    // Also poll for pending invites on mount and periodically as fallback
    const checkPendingInvites = async () => {
      const { data: pendingInvites, error } = await supabase
        .from('livekit_session_invites')
        .select('*')
        .eq('invitee_id', myProfileId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[IncomingCallSubscription] Error checking pending invites:', error);
        return;
      }

      if (pendingInvites && pendingInvites.length > 0) {
        const invite = pendingInvites[0] as CallInvite;
        // Only notify if invite is recent (within last 30 seconds)
        const inviteAge = Date.now() - new Date(invite.created_at).getTime();
        if (inviteAge < 30000) {
          console.log('[IncomingCallSubscription] 📞 Found pending invite via polling:', invite);
          onIncomingCall(invite);
        }
      }
    };

    // Check immediately on mount
    checkPendingInvites();

    // Poll every 3 seconds as fallback
    const pollInterval = setInterval(checkPendingInvites, 3000);

    // Subscribe to ALL changes on the table, filter in callback
    // This is more reliable than server-side filters which can be buggy
    const channel = supabase
      .channel(`call-invites-global-${myProfileId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'livekit_session_invites',
        },
        (payload) => {
          console.log('[IncomingCallSubscription] 🔔 Realtime event:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const invite = payload.new as CallInvite;
            // Only handle if this invite is for ME
            if (invite.invitee_id === myProfileId && invite.status === 'pending') {
              console.log('[IncomingCallSubscription] ✅ NEW CALL FOR ME:', invite.inviter_name);
              onIncomingCall(invite);
            }
          } else if (payload.eventType === 'UPDATE') {
            const invite = payload.new as CallInvite;
            // Handle if I'm the invitee and it was cancelled or declined
            if (invite.invitee_id === myProfileId && (invite.status === 'cancelled' || invite.status === 'declined')) {
              onCallCancelled(invite.id);
            }
          } else if (payload.eventType === 'DELETE') {
            const oldInvite = payload.old as { id: string; invitee_id?: string };
            if (oldInvite.invitee_id === myProfileId) {
              onCallCancelled(oldInvite.id);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[IncomingCallSubscription] Subscription status:', status, err || '');
        if (status === 'SUBSCRIBED') {
          console.log('[IncomingCallSubscription] ✅ Successfully subscribed to incoming calls for profile:', myProfileId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[IncomingCallSubscription] ❌ Channel error - relying on polling');
        }
      });

    return () => {
      console.log('[IncomingCallSubscription] Cleaning up subscription');
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [profile?.id, onIncomingCall, onCallCancelled]);

  // Function to create a call invite
  const sendCallInvite = useCallback(async (
    inviteeId: string,
    sessionId: string | null, // Session ID is optional - may not exist yet
    roomName: string,
    callType: 'voice' | 'video',
    inviterName: string,
    inviterAvatar: string | null,
    contextType: string,
    contextId: string
  ) => {
    // CRITICAL: Use profile.id (not user.id) as inviter_id to match RLS policy
    if (!profile?.id) {
      console.error('[IncomingCallSubscription] Cannot send invite: profile not loaded');
      return null;
    }

    console.log('[IncomingCallSubscription] 📞 Creating call invite:', {
      inviter: profile.id,
      invitee: inviteeId,
      roomName,
      callType
    });

    try {
      const { data, error } = await supabase
        .from('livekit_session_invites')
        .insert({
          session_id: sessionId || undefined, // Optional - may not exist yet
          inviter_id: profile.id, // Use profile ID, not auth user ID
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
        console.error('[IncomingCallSubscription] ❌ Failed to create invite:', error);
        return null;
      }

      console.log('[IncomingCallSubscription] ✅ Created call invite:', data);
      return data;
    } catch (err) {
      console.error('[IncomingCallSubscription] Error creating invite:', err);
      return null;
    }
  }, [profile?.id]);

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
          status: accept ? 'accepted' : 'declined', // Use 'declined' to match DB constraint
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
