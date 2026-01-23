import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallLogging } from '@/hooks/useCallLogging';

export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'no-answer';

interface CallState {
  status: CallStatus;
  isIncoming: boolean;
  callType: 'voice' | 'video';
  callerId: string | null;
  calleeId: string | null;
  startTime: number | null;
}

interface SignalingMessage {
  type: 'call-offer' | 'call-answer' | 'call-reject' | 'call-end' | 'ice-candidate';
  from: string;
  to: string;
  callType?: 'voice' | 'video';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useCallWebRTC = () => {
  const { user } = useAuth();
  const { logCall } = useCallLogging();
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    isIncoming: false,
    callType: 'voice',
    callerId: null,
    calleeId: null,
    startTime: null,
  });
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callStateRef = useRef<CallState>(callState);

  // Keep refs in sync with state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Cleanup resources - defined first so it can be used by other callbacks
  const cleanup = useCallback(() => {
    console.log('[Call] Cleaning up resources');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
  }, []);

  // Get media stream
  const getMediaStream = useCallback(async (callType: 'voice' | 'video') => {
    try {
      console.log(`[Call] Getting media stream for ${callType} call`);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('[Call] Error getting media stream:', error);
      return null;
    }
  }, []);

  // Create peer connection - needs callState for ICE candidate routing
  const createPeerConnection = useCallback((targetId: string, isIncoming: boolean) => {
    console.log('[Call] Creating peer connection for target:', targetId);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current && user) {
        console.log('[Call] Sending ICE candidate to:', targetId);
        channelRef.current.send({
          type: 'broadcast',
          event: 'call-signal',
          payload: {
            type: 'ice-candidate',
            from: user.id,
            to: targetId,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[Call] Received remote track');
      const [stream] = event.streams;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      console.log('[Call] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, status: 'connected', startTime: Date.now() }));
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        cleanup();
        setCallState(prev => ({ ...prev, status: 'ended' }));
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [user, cleanup]);

  // Start outgoing call
  const startCall = useCallback(async (calleeId: string, callType: 'voice' | 'video') => {
    if (!user) return;
    
    console.log(`[Call] Starting ${callType} call to ${calleeId}`);
    
    setCallState({
      status: 'ringing',
      isIncoming: false,
      callType,
      callerId: user.id,
      calleeId,
      startTime: null,
    });

    const stream = await getMediaStream(callType);
    if (!stream) {
      setCallState(prev => ({ ...prev, status: 'ended' }));
      return;
    }

    const pc = createPeerConnection(calleeId, false);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (channelRef.current) {
        console.log('[Call] Sending offer to:', calleeId);
        channelRef.current.send({
          type: 'broadcast',
          event: 'call-signal',
          payload: {
            type: 'call-offer',
            from: user.id,
            to: calleeId,
            callType,
            sdp: offer,
          },
        });
      }

      // Auto-end after 30 seconds of no answer
      ringTimeoutRef.current = setTimeout(() => {
        setCallState(prev => {
          if (prev.status === 'ringing' && !prev.isIncoming) {
            cleanup();
            return { ...prev, status: 'no-answer' };
          }
          return prev;
        });
      }, 30000);
    } catch (error) {
      console.error('[Call] Error creating offer:', error);
      cleanup();
      setCallState(prev => ({ ...prev, status: 'ended' }));
    }
  }, [user, getMediaStream, createPeerConnection, cleanup]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!user || !callState.callerId) return;
    
    console.log('[Call] Accepting call from:', callState.callerId);
    setCallState(prev => ({ ...prev, status: 'connecting' }));

    const stream = await getMediaStream(callState.callType);
    if (!stream) {
      cleanup();
      setCallState(prev => ({ ...prev, status: 'ended' }));
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('[Call] No peer connection available');
      cleanup();
      return;
    }

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Apply any pending ICE candidates
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[Call] Error adding pending ICE candidate:', e);
      }
    }
    pendingCandidatesRef.current = [];

    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channelRef.current) {
        console.log('[Call] Sending answer to:', callState.callerId);
        channelRef.current.send({
          type: 'broadcast',
          event: 'call-signal',
          payload: {
            type: 'call-answer',
            from: user.id,
            to: callState.callerId,
            sdp: answer,
          },
        });
      }
    } catch (error) {
      console.error('[Call] Error creating answer:', error);
      cleanup();
      setCallState(prev => ({ ...prev, status: 'ended' }));
    }
  }, [user, callState.callerId, callState.callType, getMediaStream, cleanup]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!user || !callState.callerId) return;
    
    console.log('[Call] Rejecting call from:', callState.callerId);
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: {
          type: 'call-reject',
          from: user.id,
          to: callState.callerId,
        },
      });
    }

    cleanup();
    setCallState(prev => ({ ...prev, status: 'ended' }));
  }, [user, callState.callerId, cleanup]);

  // End call and log it
  const endCall = useCallback(async () => {
    if (!user) return;
    
    console.log('[Call] Ending call');
    
    const currentState = callStateRef.current;
    const targetId = currentState.isIncoming ? currentState.callerId : currentState.calleeId;
    
    if (channelRef.current && targetId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: {
          type: 'call-end',
          from: user.id,
          to: targetId,
        },
      });
    }

    // Calculate duration and log the call
    const duration = currentState.startTime 
      ? Math.floor((Date.now() - currentState.startTime) / 1000) 
      : 0;
    
    // Log the call
    if (targetId && currentState.status === 'connected') {
      await logCall({
        callerId: currentState.isIncoming ? targetId : user.id,
        receiverId: currentState.isIncoming ? user.id : targetId,
        callType: currentState.callType,
        status: duration > 0 ? 'answered' : 'ended',
        durationSeconds: duration,
      });
    }

    cleanup();
    setCallState(prev => ({ ...prev, status: 'ended' }));
  }, [user, cleanup, logCall]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(prev => !prev);
    }
  }, []);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!user || message.to !== user.id) return;

    console.log(`[Call] Received ${message.type} from ${message.from}`);

    switch (message.type) {
      case 'call-offer': {
        // Incoming call - create peer connection before setting remote description
        const pc = createPeerConnection(message.from, true);
        
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp!));
          
          setCallState({
            status: 'ringing',
            isIncoming: true,
            callType: message.callType || 'voice',
            callerId: message.from,
            calleeId: user.id,
            startTime: null,
          });
        } catch (error) {
          console.error('[Call] Error setting remote description for offer:', error);
        }
        break;
      }

      case 'call-answer': {
        // Call was accepted
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp!));
            
            // Apply any pending ICE candidates
            for (const candidate of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn('[Call] Error adding pending ICE candidate:', e);
              }
            }
            pendingCandidatesRef.current = [];
            
            setCallState(prev => ({ ...prev, status: 'connecting' }));
          } catch (error) {
            console.error('[Call] Error setting remote description for answer:', error);
          }
        }
        break;
      }

      case 'call-reject': {
        setCallState(prev => ({ ...prev, status: 'rejected' }));
        cleanup();
        break;
      }

      case 'call-end': {
        setCallState(prev => ({ ...prev, status: 'ended' }));
        cleanup();
        break;
      }

      case 'ice-candidate': {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(message.candidate!));
          } catch (e) {
            console.warn('[Call] Error adding ICE candidate:', e);
          }
        } else {
          // Queue candidate for later
          console.log('[Call] Queueing ICE candidate');
          pendingCandidatesRef.current.push(message.candidate!);
        }
        break;
      }
    }
  }, [user, createPeerConnection, cleanup]);

  // Initialize signaling channel - use global channel so all users receive calls
  useEffect(() => {
    if (!user) return;

    const channelName = `calls-global`;
    console.log(`[Call] Joining global signaling channel: ${channelName}`);
    
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
        handleSignalingMessage(payload as SignalingMessage);
      })
      .subscribe((status) => {
        console.log(`[Call] Channel subscription status: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, handleSignalingMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Reset call state
  const resetCall = useCallback(() => {
    cleanup();
    setCallState({
      status: 'idle',
      isIncoming: false,
      callType: 'voice',
      callerId: null,
      calleeId: null,
      startTime: null,
    });
  }, [cleanup]);

  return {
    callState,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isVideoOn,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    resetCall,
  };
};
