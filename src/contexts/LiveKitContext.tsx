import React, { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import { useLiveKit, type LiveKitParticipant, type UseLiveKitReturn } from '@/hooks/useLiveKit';
import { useCallNotification } from '@/hooks/useCallNotification';
import { useIncomingCallSubscription } from '@/hooks/useIncomingCallSubscription';
import { useProfile } from '@/hooks/useProfile';
import { useCallLogging } from '@/hooks/useCallLogging';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getDMRoomName, 
  getGroupRoomName, 
  getStudyRoomName,
  type RoomContext,
  type ParticipantRole,
} from '@/lib/livekit';

// Call state for UI
export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'no-answer';

export interface CallPeer {
  id: string;
  name: string;
  avatar?: string;
}

interface CallState {
  status: CallStatus;
  isIncoming: boolean;
  callType: 'voice' | 'video';
  peer: CallPeer | null;
  roomContext: RoomContext | null;
  contextId: string | null;
  startTime: number | null;
}

interface IncomingCall {
  roomName: string;
  contextType: RoomContext;
  contextId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'voice' | 'video';
}

interface LiveKitContextType extends UseLiveKitReturn {
  // Call state management
  callState: CallState;
  callDuration: number;
  isMinimized: boolean;
  
  // High-level call actions
  startDMCall: (peerId: string, peerName: string, peerAvatar?: string, callType?: 'voice' | 'video') => Promise<void>;
  startGroupCall: (groupId: string, callType?: 'voice' | 'video') => Promise<void>;
  joinStudyRoom: (studyRoomId: string, role?: ParticipantRole) => Promise<void>;
  endCall: () => void;
  
  // Incoming call handling
  incomingCall: IncomingCall | null;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  
  // UI state
  toggleMinimize: () => void;
  
  // Hand raise (study rooms)
  raiseHand: () => void;
  lowerHand: () => void;
  isHandRaised: boolean;
  
  // Expose isVideoOn separately (alias for compatibility)
  isVideoOn: boolean;
}

const LiveKitContext = createContext<LiveKitContextType | null>(null);

export const useLiveKitContext = () => {
  const context = useContext(LiveKitContext);
  if (!context) {
    throw new Error('useLiveKitContext must be used within a LiveKitProvider');
  }
  return context;
};

// Optional hook that returns null if not in provider
export const useOptionalLiveKitContext = () => {
  return useContext(LiveKitContext);
};

export const LiveKitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const livekit = useLiveKit();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { playRingtone, stopRingtone, playRingback, stopRingback, playCallEnd } = useCallNotification();
  const { logCall } = useCallLogging();
  
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    isIncoming: false,
    callType: 'voice',
    peer: null,
    roomContext: null,
    contextId: null,
    startTime: null,
  });
  
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [currentInviteId, setCurrentInviteId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track processed invite IDs to prevent duplicate notifications
  const processedInvitesRef = useRef<Set<string>>(new Set());

  // Incoming call subscription - handles real-time call invites from other users
  const handleIncomingCall = useCallback((invite: {
    id: string;
    call_type: string;
    room_name: string;
    inviter_id: string;
    inviter_name: string;
    inviter_avatar: string | null;
    context_type: string;
    context_id: string;
  }) => {
    console.log('[LiveKitProvider] Incoming call received:', invite);
    
    // Deduplicate - don't process same invite twice
    if (processedInvitesRef.current.has(invite.id)) {
      console.log('[LiveKitProvider] Ignoring duplicate invite:', invite.id);
      return;
    }
    
    // Don't show incoming call if we're already in a call
    if (callState.status !== 'idle') {
      console.log('[LiveKitProvider] Ignoring incoming call - already in call');
      return;
    }
    
    // Mark as processed
    processedInvitesRef.current.add(invite.id);
    
    // Clean up old entries after 60 seconds
    setTimeout(() => {
      processedInvitesRef.current.delete(invite.id);
    }, 60000);
    
    setCurrentInviteId(invite.id);
    setIncomingCall({
      roomName: invite.room_name,
      contextType: invite.context_type as RoomContext,
      contextId: invite.context_id,
      callerId: invite.inviter_id,
      callerName: invite.inviter_name,
      callerAvatar: invite.inviter_avatar || undefined,
      callType: invite.call_type as 'voice' | 'video',
    });
  }, [callState.status]);

  const handleCallCancelled = useCallback((inviteId: string) => {
    console.log('[LiveKitProvider] Call cancelled:', inviteId);
    // Stop all ringing sounds immediately
    stopRingtone();
    stopRingback();
    
    if (currentInviteId === inviteId) {
      setIncomingCall(null);
      setCurrentInviteId(null);
      // Also reset call state if we were waiting
      if (callState.status === 'idle' || callState.status === 'ringing') {
        setCallState({
          status: 'idle',
          isIncoming: false,
          callType: 'voice',
          peer: null,
          roomContext: null,
          contextId: null,
          startTime: null,
        });
      }
    }
  }, [currentInviteId, callState.status, stopRingtone, stopRingback]);

  // Handle when the receiver accepts (for caller to know)
  const handleCallAccepted = useCallback((inviteId: string) => {
    console.log('[LiveKitProvider] Call accepted by receiver:', inviteId);
    // The connection state change will handle the transition to 'connected'
    // This is just for logging/awareness
  }, []);

  const { sendCallInvite, cancelCallInvite, respondToInvite } = useIncomingCallSubscription({
    onIncomingCall: handleIncomingCall,
    onCallCancelled: handleCallCancelled,
    onCallAccepted: handleCallAccepted,
  });

  // Play/stop ringtone based on incoming call state
  useEffect(() => {
    if (incomingCall && callState.status === 'idle') {
      playRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [incomingCall, callState.status, playRingtone, stopRingtone]);

  // Play/stop ringback when making outgoing call
  useEffect(() => {
    if (callState.status === 'ringing' && !callState.isIncoming) {
      playRingback();
    } else {
      stopRingback();
    }
    return () => stopRingback();
  }, [callState.status, callState.isIncoming, playRingback, stopRingback]);

  // Play call end sound
  useEffect(() => {
    if (callState.status === 'ended') {
      playCallEnd();
    }
  }, [callState.status, playCallEnd]);

  // Duration timer
  React.useEffect(() => {
    if (callState.status === 'connected' && callState.startTime) {
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callState.startTime!) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (callState.status === 'idle') {
        setCallDuration(0);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState.status, callState.startTime]);

  // Sync connection state to call state
  // For outgoing calls: transition from 'ringing' to 'connected' when remote participant joins
  // For incoming calls: transition from 'connecting' to 'connected' when we connect
  React.useEffect(() => {
    // Handle outgoing call: transition when remote participant joins
    if (callState.status === 'ringing' && !callState.isIncoming && livekit.remoteParticipants.length > 0) {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      console.log('[LiveKitContext] Remote participant joined - starting call');
      setCallState(prev => ({
        ...prev,
        status: 'connected',
        startTime: Date.now(),
      }));
    }
    // Handle incoming call / direct connection: transition when we connect
    else if (livekit.isConnected && callState.status === 'connecting') {
      console.log('[LiveKitContext] Connected - starting call');
      setCallState(prev => ({
        ...prev,
        status: 'connected',
        startTime: Date.now(),
      }));
    } 
    // Handle remote participant leaving during active DM call - end for both sides
    else if (
      callState.status === 'connected' && 
      callState.roomContext === 'dm' && 
      livekit.isConnected && 
      livekit.remoteParticipants.length === 0
    ) {
      console.log('[LiveKitContext] Remote participant left DM call - ending call');
      // Stop all sounds immediately
      stopRingtone();
      stopRingback();
      // Disconnect and clean up
      livekit.disconnect();
      setCallState(prev => ({ ...prev, status: 'ended' }));
      setTimeout(() => {
        setCallState({
          status: 'idle',
          isIncoming: false,
          callType: 'voice',
          peer: null,
          roomContext: null,
          contextId: null,
          startTime: null,
        });
      }, 500);
    }
    // Handle disconnect from LiveKit side
    else if (livekit.connectionState === ConnectionState.Disconnected && callState.status === 'connected') {
      console.log('[LiveKitContext] Disconnected from LiveKit');
      stopRingtone();
      stopRingback();
      setCallState(prev => ({ ...prev, status: 'ended' }));
      setTimeout(() => {
        setCallState({
          status: 'idle',
          isIncoming: false,
          callType: 'voice',
          peer: null,
          roomContext: null,
          contextId: null,
          startTime: null,
        });
      }, 500);
    }
  }, [livekit.isConnected, livekit.connectionState, livekit.remoteParticipants.length, callState.status, callState.isIncoming, callState.roomContext, stopRingtone, stopRingback, livekit]);

  // Start DM call
  const startDMCall = useCallback(async (
    peerId: string,
    peerName: string,
    peerAvatar?: string,
    callType: 'voice' | 'video' = 'voice'
  ) => {
    if (!profile?.id || !user?.id) {
      console.error('Cannot start call: profile not loaded');
      return;
    }
    
    // Use profile.id (our user's profile ID) for room naming
    const roomName = getDMRoomName(profile.id, peerId);
    
    setCallState({
      status: 'ringing',
      isIncoming: false,
      callType,
      peer: { id: peerId, name: peerName, avatar: peerAvatar },
      roomContext: 'dm',
      contextId: peerId,
      startTime: null,
    });

    // Send call invite to the other user via real-time
    // Note: session_id is null since session is created when connecting to LiveKit
    const invite = await sendCallInvite(
      peerId, // invitee is the peer
      null, // No session ID yet - created when connection is established
      roomName,
      callType,
      profile.full_name || 'Unknown',
      profile.avatar_url || null,
      'dm',
      peerId
    );
    
    if (invite) {
      setCurrentInviteId(invite.id);
    }

    // Auto-timeout after 30s
    ringTimeoutRef.current = setTimeout(async () => {
      setCallState(prev => {
        if (prev.status === 'ringing') {
          livekit.disconnect();
          // Cancel the invite
          if (invite?.id) {
            cancelCallInvite(invite.id);
          }
          return { ...prev, status: 'no-answer' };
        }
        return prev;
      });
    }, 30000);

    // Connect to room (call will show as ringing until remote participant joins)
    const success = await livekit.connect(roomName, 'dm', peerId, 'speaker');
    
    if (!success) {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (invite?.id) {
        cancelCallInvite(invite.id);
      }
      setCallState(prev => ({ ...prev, status: 'ended' }));
    }
    
    // Enable media based on call type
    if (success && callType === 'video') {
      await livekit.toggleVideo();
    }
  }, [livekit, profile?.id, profile?.full_name, profile?.avatar_url, user?.id, sendCallInvite, cancelCallInvite]);

  // Start group call
  const startGroupCall = useCallback(async (
    groupId: string,
    callType: 'voice' | 'video' = 'voice'
  ) => {
    const roomName = getGroupRoomName(groupId);
    
    setCallState({
      status: 'connecting',
      isIncoming: false,
      callType,
      peer: null,
      roomContext: 'group',
      contextId: groupId,
      startTime: null,
    });

    const success = await livekit.connect(roomName, 'group', groupId, 'speaker');
    
    if (success && callType === 'video') {
      await livekit.toggleVideo();
    }
  }, [livekit]);

  // Join study room
  const joinStudyRoom = useCallback(async (
    studyRoomId: string,
    role: ParticipantRole = 'listener'
  ) => {
    const roomName = getStudyRoomName(studyRoomId);
    
    setCallState({
      status: 'connecting',
      isIncoming: false,
      callType: 'video', // Study rooms support video
      peer: null,
      roomContext: 'study_room',
      contextId: studyRoomId,
      startTime: null,
    });

    await livekit.connect(roomName, 'study_room', studyRoomId, role);
  }, [livekit]);

  // End call with logging
  const endCall = useCallback(async () => {
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    
    // Stop all sounds IMMEDIATELY
    stopRingtone();
    stopRingback();
    
    // Cancel any pending invite (for outgoing calls)
    if (currentInviteId) {
      if (callState.status === 'ringing' && !callState.isIncoming) {
        // Caller ending before receiver picks up
        cancelCallInvite(currentInviteId);
      } else if (callState.status === 'connected' && callState.isIncoming) {
        // Receiver ending during connected call - mark as cancelled so caller knows
        cancelCallInvite(currentInviteId);
      }
    }
    
    // Log the call if it was a DM call (peer.id is the auth user_id of the other person)
    if (callState.roomContext === 'dm' && callState.peer?.id && user?.id) {
      const wasAnswered = callState.status === 'connected';
      const durationSecs = wasAnswered && callState.startTime 
        ? Math.floor((Date.now() - callState.startTime) / 1000)
        : 0;
      
      // Log the call - callerId/receiverId are auth user_ids
      await logCall({
        callerId: callState.isIncoming ? callState.peer.id : user.id,
        receiverId: callState.isIncoming ? user.id : callState.peer.id,
        callType: callState.callType,
        status: wasAnswered ? 'ended' : (callState.isIncoming ? 'rejected' : 'missed'),
        durationSeconds: durationSecs,
      });
    }
    
    livekit.disconnect();
    
    // Clear incoming call state if any
    setIncomingCall(null);
    
    // Set to ended briefly, then reset to idle
    setCallState(prev => ({ ...prev, status: 'ended' }));
    setIsHandRaised(false);
    setCurrentInviteId(null);
    
    // Reset after a brief moment (allows call end sound to play)
    setTimeout(() => {
      setCallState({
        status: 'idle',
        isIncoming: false,
        callType: 'voice',
        peer: null,
        roomContext: null,
        contextId: null,
        startTime: null,
      });
    }, 500);
  }, [livekit, callState, user, logCall, currentInviteId, cancelCallInvite, stopRingtone, stopRingback]);

  // Accept incoming call
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall) return;

    // Respond to the invite
    if (currentInviteId) {
      respondToInvite(currentInviteId, true);
    }

    setCallState({
      status: 'connecting',
      isIncoming: true,
      callType: incomingCall.callType,
      peer: {
        id: incomingCall.callerId,
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      },
      roomContext: incomingCall.contextType,
      contextId: incomingCall.contextId,
      startTime: null,
    });

    const success = await livekit.connect(
      incomingCall.roomName,
      incomingCall.contextType,
      incomingCall.contextId,
      'speaker'
    );

    if (success && incomingCall.callType === 'video') {
      await livekit.toggleVideo();
    }

    setIncomingCall(null);
    setCurrentInviteId(null);
  }, [incomingCall, livekit, currentInviteId, respondToInvite]);

  // Reject incoming call
  const rejectIncomingCall = useCallback(() => {
    // Respond to the invite as rejected
    if (currentInviteId) {
      respondToInvite(currentInviteId, false);
    }
    
    setIncomingCall(null);
    setCurrentInviteId(null);
    setCallState({
      status: 'idle',
      isIncoming: false,
      callType: 'voice',
      peer: null,
      roomContext: null,
      contextId: null,
      startTime: null,
    });
  }, [currentInviteId, respondToInvite]);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Hand raise (study rooms)
  const raiseHand = useCallback(() => {
    setIsHandRaised(true);
    // In full implementation, update participant metadata
  }, []);

  const lowerHand = useCallback(() => {
    setIsHandRaised(false);
  }, []);

  return (
    <LiveKitContext.Provider
      value={{
        ...livekit,
        callState,
        callDuration,
        isMinimized,
        startDMCall,
        startGroupCall,
        joinStudyRoom,
        endCall,
        incomingCall,
        acceptIncomingCall,
        rejectIncomingCall,
        toggleMinimize,
        raiseHand,
        lowerHand,
        isHandRaised,
        // Alias isVideoOn from livekit hook for easier access
        isVideoOn: livekit.isVideoOn,
      }}
    >
      {children}
    </LiveKitContext.Provider>
  );
};