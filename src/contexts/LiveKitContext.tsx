import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { ConnectionState } from 'livekit-client';
import { useLiveKit, type LiveKitParticipant, type UseLiveKitReturn } from '@/hooks/useLiveKit';
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  React.useEffect(() => {
    if (livekit.isConnected && callState.status === 'connecting') {
      setCallState(prev => ({
        ...prev,
        status: 'connected',
        startTime: Date.now(),
      }));
    } else if (livekit.connectionState === ConnectionState.Disconnected && callState.status === 'connected') {
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
      }, 2000);
    }
  }, [livekit.isConnected, livekit.connectionState, callState.status]);

  // Start DM call
  const startDMCall = useCallback(async (
    peerId: string,
    peerName: string,
    peerAvatar?: string,
    callType: 'voice' | 'video' = 'voice'
  ) => {
    const roomName = getDMRoomName(livekit.localParticipant?.id || '', peerId);
    
    setCallState({
      status: 'ringing',
      isIncoming: false,
      callType,
      peer: { id: peerId, name: peerName, avatar: peerAvatar },
      roomContext: 'dm',
      contextId: peerId,
      startTime: null,
    });

    // Auto-timeout after 30s
    ringTimeoutRef.current = setTimeout(() => {
      if (callState.status === 'ringing') {
        setCallState(prev => ({ ...prev, status: 'no-answer' }));
        livekit.disconnect();
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
        }, 2000);
      }
    }, 30000);

    setCallState(prev => ({ ...prev, status: 'connecting' }));
    
    const success = await livekit.connect(roomName, 'dm', peerId, 'speaker');
    
    if (!success) {
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      setCallState(prev => ({ ...prev, status: 'ended' }));
    }
    
    // Enable media based on call type
    if (success) {
      if (callType === 'video') {
        await livekit.toggleVideo();
      }
    }
  }, [livekit, callState.status]);

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

  // End call
  const endCall = useCallback(() => {
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    
    livekit.disconnect();
    
    setCallState(prev => ({ ...prev, status: 'ended' }));
    setIsHandRaised(false);
    
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
    }, 2000);
  }, [livekit]);

  // Accept incoming call
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall) return;

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
  }, [incomingCall, livekit]);

  // Reject incoming call
  const rejectIncomingCall = useCallback(() => {
    setIncomingCall(null);
    setCallState({
      status: 'idle',
      isIncoming: false,
      callType: 'voice',
      peer: null,
      roomContext: null,
      contextId: null,
      startTime: null,
    });
  }, []);

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