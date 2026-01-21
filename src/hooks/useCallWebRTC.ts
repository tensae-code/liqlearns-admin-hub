import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  ],
};

export const useCallWebRTC = () => {
  const { user } = useAuth();
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

  // Get media stream
  const getMediaStream = useCallback(async (callType: 'voice' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('[Call] Error getting media stream:', error);
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    console.log('[Call] Creating peer connection');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current && user) {
        const targetId = callState.isIncoming ? callState.callerId : callState.calleeId;
        if (targetId) {
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
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [user, callState.isIncoming, callState.callerId, callState.calleeId]);

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

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (channelRef.current) {
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
    setTimeout(() => {
      if (callState.status === 'ringing') {
        setCallState(prev => ({ ...prev, status: 'no-answer' }));
        cleanup();
      }
    }, 30000);
  }, [user, getMediaStream, createPeerConnection]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!user || !callState.callerId) return;
    
    console.log('[Call] Accepting call');
    setCallState(prev => ({ ...prev, status: 'connecting' }));

    const stream = await getMediaStream(callState.callType);
    if (!stream) {
      rejectCall();
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) return;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Apply any pending ICE candidates
    for (const candidate of pendingCandidatesRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (channelRef.current) {
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
  }, [user, callState.callerId, callState.callType, getMediaStream]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!user || !callState.callerId) return;
    
    console.log('[Call] Rejecting call');
    
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
  }, [user, callState.callerId]);

  // End call
  const endCall = useCallback(() => {
    if (!user) return;
    
    console.log('[Call] Ending call');
    
    const targetId = callState.isIncoming ? callState.callerId : callState.calleeId;
    
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

    cleanup();
    setCallState(prev => ({ ...prev, status: 'ended' }));
  }, [user, callState.isIncoming, callState.callerId, callState.calleeId]);

  // Cleanup resources
  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
  }, [localStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  }, [localStream, isVideoOn]);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!user || message.to !== user.id) return;

    console.log(`[Call] Received ${message.type} from ${message.from}`);

    switch (message.type) {
      case 'call-offer': {
        // Incoming call
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp!));
        
        setCallState({
          status: 'ringing',
          isIncoming: true,
          callType: message.callType || 'voice',
          callerId: message.from,
          calleeId: user.id,
          startTime: null,
        });
        break;
      }

      case 'call-answer': {
        // Call was accepted
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp!));
          
          // Apply any pending ICE candidates
          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current = [];
          
          setCallState(prev => ({ ...prev, status: 'connecting' }));
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
          await pc.addIceCandidate(new RTCIceCandidate(message.candidate!));
        } else {
          // Queue candidate
          pendingCandidatesRef.current.push(message.candidate!);
        }
        break;
      }
    }
  }, [user, createPeerConnection, cleanup]);

  // Initialize signaling channel
  useEffect(() => {
    if (!user) return;

    const channelName = `calls:${user.id}`;
    console.log(`[Call] Joining signaling channel: ${channelName}`);
    
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
        handleSignalingMessage(payload as SignalingMessage);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, handleSignalingMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, []);

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
