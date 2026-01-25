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
      console.log('[IncomingCallSubscription] ⏳ Waiting for profile to load...');
      return;
    }

    const myProfileId = profile.id;
    console.log('[IncomingCallSubscription] 🔔 ACTIVE for profile:', myProfileId);

    // Track already-notified invites to prevent duplicates
    const notifiedInvites = new Set<string>();

    // Poll for pending invites - more reliable than realtime alone
    const checkPendingInvites = async () => {
      try {
        const { data: pendingInvites, error } = await supabase
          .from('livekit_session_invites')
          .select('*')
          .eq('invitee_id', myProfileId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('[IncomingCallSubscription] Poll error:', error);
          return;
        }

        if (pendingInvites && pendingInvites.length > 0) {
          for (const invite of pendingInvites) {
            const typedInvite = invite as CallInvite;
            // Only notify if invite is recent (within last 60 seconds) and not already notified
            const inviteAge = Date.now() - new Date(typedInvite.created_at).getTime();
            if (inviteAge < 60000 && !notifiedInvites.has(typedInvite.id)) {
              console.log('[IncomingCallSubscription] 📞 INCOMING CALL via poll:', typedInvite.inviter_name);
              notifiedInvites.add(typedInvite.id);
              onIncomingCall(typedInvite);
              break; // Only handle one at a time
            }
          }
        }
      } catch (err) {
        console.error('[IncomingCallSubscription] Poll exception:', err);
      }
    };

    // Check immediately on mount
    checkPendingInvites();

    // Poll every 2 seconds for faster response
    const pollInterval = setInterval(checkPendingInvites, 2000);

    // Subscribe to ALL changes on the table, filter in callback
    const channel = supabase
      .channel(`call-invites-${myProfileId}-${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'livekit_session_invites',
        },
        (payload) => {
          console.log('[IncomingCallSubscription] 📡 Realtime:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const invite = payload.new as CallInvite;
            // Only handle if this invite is for ME and pending
            if (invite.invitee_id === myProfileId && invite.status === 'pending') {
              if (!notifiedInvites.has(invite.id)) {
                console.log('[IncomingCallSubscription] 📞 INCOMING CALL via realtime:', invite.inviter_name);
                notifiedInvites.add(invite.id);
                onIncomingCall(invite);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const invite = payload.new as CallInvite;
            // Handle cancellation/decline
            if (invite.invitee_id === myProfileId && 
                (invite.status === 'cancelled' || invite.status === 'declined')) {
              console.log('[IncomingCallSubscription] 📞 Call cancelled/declined');
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
        if (status === 'SUBSCRIBED') {
          console.log('[IncomingCallSubscription] ✅ Realtime ACTIVE for:', myProfileId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[IncomingCallSubscription] ❌ Realtime error - using polling only');
        }
      });

    return () => {
      console.log('[IncomingCallSubscription] 🔌 Cleanup');
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
