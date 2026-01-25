import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallLogging } from '@/hooks/useCallLogging';
import { getIceServers } from '@/lib/webrtcConfig';

export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'no-answer';

interface CallPeer {
  id: string;
  name: string;
  avatar?: string;
}

interface CallState {
  status: CallStatus;
  isIncoming: boolean;
  callType: 'voice' | 'video';
  peer: CallPeer | null;
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
  iceServers: getIceServers(),
};

interface CallContextType {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOn: boolean;
  isMinimized: boolean;
  callDuration: number;
  startCall: (calleeId: string, calleeName: string, calleeAvatar: string | undefined, callType: 'voice' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleMinimize: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { logCall } = useCallLogging();
  
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    isIncoming: false,
    callType: 'voice',
    peer: null,
    startTime: null,
  });
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callStateRef = useRef<CallState>(callState);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  // Keep refs in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (callState.status === 'connected' && callState.startTime) {
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callState.startTime!) / 1000));
      }, 1000);
    } else if (callState.status !== 'connected') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState.status, callState.startTime]);

  // Cleanup resources
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRemoteStream(null);
    setCallDuration(0);
    setIsMinimized(false);
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
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
      setIsVideoOn(callType === 'video');
      return stream;
    } catch (error) {
      console.error('[Call] Error getting media stream:', error);
      return null;
    }
  }, []);

  // Send signaling message
  const sendSignal = useCallback((message: Omit<SignalingMessage, 'from'>) => {
    if (channelRef.current && user) {
      console.log(`[Call] Sending ${message.type} to ${message.to}`);
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: {
          ...message,
          from: user.id,
        },
      });
    }
  }, [user]);

  // Create peer connection
  const createPeerConnection = useCallback((targetId: string) => {
    console.log('[Call] Creating peer connection for:', targetId);
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[Call] Sending ICE candidate');
        sendSignal({
          type: 'ice-candidate',
          to: targetId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[Call] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[Call] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ 
          ...prev, 
          status: 'connected', 
          startTime: Date.now() 
        }));
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setCallState(prev => ({ ...prev, status: 'ended' }));
        setTimeout(() => {
          cleanup();
          setCallState({
            status: 'idle',
            isIncoming: false,
            callType: 'voice',
            peer: null,
            startTime: null,
          });
        }, 2000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[Call] ICE connection state:', pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [sendSignal, cleanup]);

  // Start outgoing call
  const startCall = useCallback(async (
    calleeId: string, 
    calleeName: string, 
    calleeAvatar: string | undefined,
    callType: 'voice' | 'video'
  ) => {
    if (!user) return;

    console.log(`[Call] Starting ${callType} call to ${calleeId}`);

    setCallState({
      status: 'ringing',
      isIncoming: false,
      callType,
      peer: { id: calleeId, name: calleeName, avatar: calleeAvatar },
      startTime: null,
    });

    const stream = await getMediaStream(callType);
    if (!stream) {
      setCallState(prev => ({ ...prev, status: 'ended' }));
      return;
    }

    const pc = createPeerConnection(calleeId);
    stream.getTracks().forEach(track => {
      console.log('[Call] Adding local track:', track.kind);
      pc.addTrack(track, stream);
    });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: 'call-offer',
        to: calleeId,
        callType,
        sdp: offer,
      });

      // Auto-end after 30 seconds of no answer
      ringTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current.status === 'ringing' && !callStateRef.current.isIncoming) {
          setCallState(prev => ({ ...prev, status: 'no-answer' }));
          cleanup();
          setTimeout(() => {
            setCallState({
              status: 'idle',
              isIncoming: false,
              callType: 'voice',
              peer: null,
              startTime: null,
            });
          }, 2000);
        }
      }, 30000);
    } catch (error) {
      console.error('[Call] Error creating offer:', error);
      cleanup();
      setCallState(prev => ({ ...prev, status: 'ended' }));
    }
  }, [user, getMediaStream, createPeerConnection, sendSignal, cleanup]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!user || !callState.peer || !pendingOfferRef.current) {
      console.error('[Call] Cannot accept: missing user, peer, or offer');
      return;
    }

    console.log('[Call] Accepting call from:', callState.peer.id);
    setCallState(prev => ({ ...prev, status: 'connecting' }));

    const stream = await getMediaStream(callState.callType);
    if (!stream) {
      cleanup();
      setCallState(prev => ({ ...prev, status: 'ended' }));
      return;
    }

    const pc = createPeerConnection(callState.peer.id);
    stream.getTracks().forEach(track => {
      console.log('[Call] Adding local track:', track.kind);
      pc.addTrack(track, stream);
    });

    try {
      // Set the remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      pendingOfferRef.current = null;

      // Apply any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[Call] Error adding pending ICE candidate:', e);
        }
      }
      pendingCandidatesRef.current = [];

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: 'call-answer',
        to: callState.peer.id,
        sdp: answer,
      });
    } catch (error) {
      console.error('[Call] Error accepting call:', error);
      cleanup();
      setCallState(prev => ({ ...prev, status: 'ended' }));
    }
  }, [user, callState.peer, callState.callType, getMediaStream, createPeerConnection, sendSignal, cleanup]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!user || !callState.peer) return;

    console.log('[Call] Rejecting call from:', callState.peer.id);

    sendSignal({
      type: 'call-reject',
      to: callState.peer.id,
    });

    cleanup();
    setCallState({
      status: 'idle',
      isIncoming: false,
      callType: 'voice',
      peer: null,
      startTime: null,
    });
  }, [user, callState.peer, sendSignal, cleanup]);

  // End call
  const endCall = useCallback(async () => {
    if (!user) return;

    console.log('[Call] Ending call');

    const currentState = callStateRef.current;
    const peerId = currentState.peer?.id;

    if (peerId) {
      sendSignal({
        type: 'call-end',
        to: peerId,
      });

      // Log the call if it was connected
      if (currentState.status === 'connected' && currentState.startTime) {
        const duration = Math.floor((Date.now() - currentState.startTime) / 1000);
        await logCall({
          callerId: currentState.isIncoming ? peerId : user.id,
          receiverId: currentState.isIncoming ? user.id : peerId,
          callType: currentState.callType,
          status: 'answered',
          durationSeconds: duration,
        });
      }
    }

    setCallState(prev => ({ ...prev, status: 'ended' }));
    cleanup();
    setTimeout(() => {
      setCallState({
        status: 'idle',
        isIncoming: false,
        callType: 'voice',
        peer: null,
        startTime: null,
      });
    }, 2000);
  }, [user, sendSignal, logCall, cleanup]);

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

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!user || message.to !== user.id) return;

    console.log(`[Call] Received ${message.type} from ${message.from}`);

    switch (message.type) {
      case 'call-offer': {
        // Incoming call - store the offer and show ringing UI
        pendingOfferRef.current = message.sdp!;
        
        // Fetch caller profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', message.from)
          .single();

        setCallState({
          status: 'ringing',
          isIncoming: true,
          callType: message.callType || 'voice',
          peer: {
            id: message.from,
            name: profile?.full_name || 'Unknown',
            avatar: profile?.avatar_url || undefined,
          },
          startTime: null,
        });
        break;
      }

      case 'call-answer': {
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
            console.error('[Call] Error setting remote description:', error);
          }
        }
        break;
      }

      case 'call-reject': {
        setCallState(prev => ({ ...prev, status: 'rejected' }));
        cleanup();
        setTimeout(() => {
          setCallState({
            status: 'idle',
            isIncoming: false,
            callType: 'voice',
            peer: null,
            startTime: null,
          });
        }, 2000);
        break;
      }

      case 'call-end': {
        setCallState(prev => ({ ...prev, status: 'ended' }));
        cleanup();
        setTimeout(() => {
          setCallState({
            status: 'idle',
            isIncoming: false,
            callType: 'voice',
            peer: null,
            startTime: null,
          });
        }, 2000);
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
  }, [user, cleanup]);

  // Initialize signaling channel
  useEffect(() => {
    if (!user) return;

    const channelName = 'calls-global';
    console.log('[Call] Joining signaling channel:', channelName);

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
        handleSignalingMessage(payload as SignalingMessage);
      })
      .subscribe((status) => {
        console.log('[Call] Channel subscription status:', status);
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

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStream,
        isMuted,
        isVideoOn,
        isMinimized,
        callDuration,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleMinimize,
        localVideoRef,
        remoteVideoRef,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
