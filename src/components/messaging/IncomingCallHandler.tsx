import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface IncomingCall {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'voice' | 'video';
  sdp: RTCSessionDescriptionInit;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * Global handler for incoming calls.
 * Handles the full WebRTC flow for incoming calls independently.
 */
const IncomingCallHandler = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup resources
  const cleanup = () => {
    console.log('[IncomingCall] Cleaning up');
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
    setCallDuration(0);
  };

  // Close modal
  const closeModal = () => {
    cleanup();
    setIncomingCall(null);
    setCallStatus('idle');
  };

  // Accept the call
  const acceptCall = async () => {
    if (!user || !incomingCall) return;

    console.log('[IncomingCall] Accepting call from:', incomingCall.callerId);
    setCallStatus('connecting');

    try {
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video',
      });
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'call-signal',
            payload: {
              type: 'ice-candidate',
              from: user.id,
              to: incomingCall.callerId,
              candidate: event.candidate.toJSON(),
            },
          });
        }
      };

      // Handle remote track
      pc.ontrack = (event) => {
        console.log('[IncomingCall] Received remote track');
        setRemoteStream(event.streams[0]);
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log('[IncomingCall] Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
          // Start call duration timer
          timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setCallStatus('ended');
          setTimeout(closeModal, 2000);
        }
      };

      // Set remote description (the offer)
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.sdp));

      // Apply pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'call-signal',
          payload: {
            type: 'call-answer',
            from: user.id,
            to: incomingCall.callerId,
            sdp: answer,
          },
        });
      }
    } catch (error) {
      console.error('[IncomingCall] Error accepting call:', error);
      setCallStatus('ended');
      setTimeout(closeModal, 2000);
    }
  };

  // Reject the call
  const rejectCall = () => {
    if (!user || !incomingCall) return;

    console.log('[IncomingCall] Rejecting call from:', incomingCall.callerId);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: {
          type: 'call-reject',
          from: user.id,
          to: incomingCall.callerId,
        },
      });
    }

    closeModal();
  };

  // End the call
  const endCall = () => {
    if (!user || !incomingCall) return;

    console.log('[IncomingCall] Ending call');

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: {
          type: 'call-end',
          from: user.id,
          to: incomingCall.callerId,
        },
      });
    }

    setCallStatus('ended');
    setTimeout(closeModal, 2000);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(prev => !prev);
    }
  };

  // Update video elements
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

  // Listen for incoming calls - MUST use same channel as caller (calls-global)
  useEffect(() => {
    if (!user) return;

    const channelName = `calls-global`;
    console.log('[IncomingCallHandler] Listening on:', channelName);
    
    // Use the exact same channel name that callers broadcast to
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
        // Only handle messages directed at this user
        if (payload.to !== user.id) return;

        console.log('[IncomingCallHandler] Received:', payload.type, 'from:', payload.from);

        if (payload.type === 'call-offer' && callStatus === 'idle') {
          // Fetch caller profile using user_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', payload.from)
            .single();

          setIncomingCall({
            callerId: payload.from,
            callerName: profile?.full_name || 'Unknown',
            callerAvatar: profile?.avatar_url || undefined,
            callType: payload.callType || 'voice',
            sdp: payload.sdp,
          });
          setCallStatus('ringing');
        } else if (payload.type === 'ice-candidate') {
          const pc = peerConnectionRef.current;
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.warn('[IncomingCallHandler] Error adding ICE candidate:', e);
            }
          } else {
            pendingCandidatesRef.current.push(payload.candidate);
          }
        } else if (payload.type === 'call-end') {
          setCallStatus('ended');
          setTimeout(closeModal, 2000);
        }
      })
      .subscribe((status) => {
        console.log('[IncomingCallHandler] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, callStatus]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'ringing':
        return 'Incoming call...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  };

  if (!incomingCall || callStatus === 'idle') return null;

  const showRingingControls = callStatus === 'ringing';
  const showInCallControls = ['connecting', 'connected'].includes(callStatus);
  const isCallActive = callStatus === 'connected';

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="p-0 border-0 overflow-hidden max-w-md">
        <VisuallyHidden>
          <DialogTitle>Incoming Call</DialogTitle>
        </VisuallyHidden>
        <motion.div
          layout
          className="relative bg-gradient-to-b from-background via-background to-muted p-6"
        >
          {/* Video display area */}
          {incomingCall.callType === 'video' && isCallActive && (
            <div className="relative aspect-video bg-muted rounded-xl overflow-hidden mb-4">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={incomingCall.callerAvatar} />
                    <AvatarFallback className="text-3xl bg-gradient-accent text-accent-foreground">
                      {incomingCall.callerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              
              {localStream && isVideoOn && (
                <div className="absolute bottom-3 right-3 w-24 h-32 bg-muted-foreground/20 rounded-lg overflow-hidden border-2 border-background">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Caller info */}
          <div className="flex flex-col items-center text-center gap-4">
            {!isCallActive && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <Avatar className="h-24 w-24">
                  <AvatarImage src={incomingCall.callerAvatar} />
                  <AvatarFallback className="text-3xl bg-gradient-accent text-accent-foreground">
                    {incomingCall.callerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {callStatus === 'ringing' && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-accent"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-accent"
                      animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                  </>
                )}
              </motion.div>
            )}

            <div>
              <h3 className="font-semibold text-foreground text-xl">
                {incomingCall.callerName}
              </h3>
              <p className="text-muted-foreground text-sm">
                {incomingCall.callType === 'video' ? 'Video call' : 'Voice call'} • {getStatusText()}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8">
            {showRingingControls && (
              <div className="flex justify-center gap-8">
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
                  onClick={rejectCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-success hover:bg-success/90"
                  onClick={acceptCall}
                >
                  {incomingCall.callType === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                </Button>
              </div>
            )}

            {showInCallControls && (
              <div className="flex justify-center gap-4">
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="lg"
                  className="h-14 w-14 rounded-full"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {incomingCall.callType === 'video' && (
                  <Button
                    variant={!isVideoOn ? "destructive" : "secondary"}
                    size="lg"
                    className="h-14 w-14 rounded-full"
                    onClick={toggleVideo}
                  >
                    {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="lg"
                  className="h-14 w-14 rounded-full"
                  onClick={endCall}
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallHandler;
