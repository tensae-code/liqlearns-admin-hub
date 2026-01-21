import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCallWebRTC } from '@/hooks/useCallWebRTC';

interface CallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callType: 'voice' | 'video';
  callee: {
    id: string;
    name: string;
    avatar?: string;
  };
  isIncoming?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

const CallModal = ({
  open,
  onOpenChange,
  callType,
  callee,
  isIncoming = false,
  onAccept,
  onDecline,
}: CallModalProps) => {
  const {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoOn,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    resetCall,
  } = useCallWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callDurationRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start outgoing call when modal opens
  useEffect(() => {
    if (open && !isIncoming && callState.status === 'idle') {
      startCall(callee.id, callType);
    }
  }, [open, isIncoming, callee.id, callType, callState.status, startCall]);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Timer for call duration
  useEffect(() => {
    if (callState.status === 'connected' && callState.startTime) {
      timerRef.current = setInterval(() => {
        callDurationRef.current = Math.floor((Date.now() - callState.startTime!) / 1000);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState.status, callState.startTime]);

  // Handle modal close
  useEffect(() => {
    if (!open) {
      resetCall();
      callDurationRef.current = 0;
    }
  }, [open, resetCall]);

  // Auto-close on call end
  useEffect(() => {
    if (callState.status === 'ended' || callState.status === 'rejected' || callState.status === 'no-answer') {
      const timeout = setTimeout(() => {
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [callState.status, onOpenChange]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    acceptCall();
    onAccept?.();
  };

  const handleDecline = () => {
    rejectCall();
    onDecline?.();
  };

  const handleEndCall = () => {
    endCall();
  };

  const getStatusText = () => {
    switch (callState.status) {
      case 'idle':
      case 'ringing':
        return isIncoming ? 'Incoming call...' : 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDurationRef.current);
      case 'ended':
        return 'Call ended';
      case 'rejected':
        return 'Call declined';
      case 'no-answer':
        return 'No answer';
      default:
        return '';
    }
  };

  const showIncomingControls = isIncoming && callState.status === 'ringing';
  const showInCallControls = ['connecting', 'connected', 'ringing'].includes(callState.status) && !showIncomingControls;
  const isCallActive = callState.status === 'connected';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 overflow-hidden max-w-md">
        <VisuallyHidden>
          <DialogTitle>{isIncoming ? 'Incoming Call' : 'Outgoing Call'}</DialogTitle>
        </VisuallyHidden>
        <motion.div
          layout
          className="relative bg-gradient-to-b from-background via-background to-muted p-6"
        >
          {/* Video display area */}
          {callType === 'video' && isCallActive && (
            <div className="relative aspect-video bg-muted rounded-xl overflow-hidden mb-4">
              {/* Remote video */}
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
                    <AvatarImage src={callee.avatar} />
                    <AvatarFallback className="text-3xl bg-gradient-accent text-accent-foreground">
                      {callee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              
              {/* Local video (small preview) */}
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

          {/* Callee info */}
          <div className="flex flex-col items-center text-center gap-4">
            {!isCallActive && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <Avatar className="h-24 w-24">
                  <AvatarImage src={callee.avatar} />
                  <AvatarFallback className="text-3xl bg-gradient-accent text-accent-foreground">
                    {callee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Ringing animation */}
                {callState.status === 'ringing' && (
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
                {callee.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8">
            {/* Incoming call controls */}
            {showIncomingControls && (
              <div className="flex justify-center gap-8">
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
                  onClick={handleDecline}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-success hover:bg-success/90"
                  onClick={handleAccept}
                >
                  {callType === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                </Button>
              </div>
            )}

            {/* In-call controls */}
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

                {callType === 'video' && (
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
                  onClick={handleEndCall}
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

export default CallModal;
