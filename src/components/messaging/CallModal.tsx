import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
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
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Simulate call connection - Wait for answer (realistic timing)
  useEffect(() => {
    if (open && !isIncoming) {
      // Stay in ringing state longer - simulating waiting for the other person to pick up
      // Random time between 5-12 seconds to feel realistic
      const ringDuration = Math.floor(Math.random() * 7000) + 5000;
      
      const ringTimer = setTimeout(() => {
        setCallStatus('connecting');
      }, ringDuration);

      const connectTimer = setTimeout(() => {
        setCallStatus('connected');
      }, ringDuration + 2000);

      return () => {
        clearTimeout(ringTimer);
        clearTimeout(connectTimer);
      };
    }
  }, [open, isIncoming]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCallStatus('ringing');
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOn(callType === 'video');
    }
  }, [open, callType]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onOpenChange(false);
    }, 1000);
  };

  const handleAccept = () => {
    setCallStatus('connecting');
    setTimeout(() => {
      setCallStatus('connected');
    }, 1500);
    onAccept?.();
  };

  const handleDecline = () => {
    onDecline?.();
    onOpenChange(false);
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'ringing':
        return isIncoming ? 'Incoming call...' : 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 border-0 overflow-hidden",
          isMinimized ? "max-w-[200px]" : "max-w-md"
        )}
      >
        <motion.div
          layout
          className={cn(
            "relative bg-gradient-to-b from-background via-background to-muted",
            isMinimized ? "p-3" : "p-6"
          )}
        >
          {/* Minimize button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>

          {/* Video display area */}
          {callType === 'video' && callStatus === 'connected' && !isMinimized && (
            <div className="relative aspect-video bg-muted rounded-xl overflow-hidden mb-4">
              {/* Remote video (placeholder) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={callee.avatar} />
                  <AvatarFallback className="text-3xl bg-gradient-accent text-accent-foreground">
                    {callee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Local video (small preview) */}
              {isVideoOn && (
                <div className="absolute bottom-3 right-3 w-24 h-32 bg-muted-foreground/20 rounded-lg overflow-hidden border-2 border-background">
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    You
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Callee info */}
          <div className={cn(
            "flex flex-col items-center text-center",
            isMinimized ? "flex-row gap-3" : "gap-4"
          )}>
            {!isMinimized && (
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

            {isMinimized ? (
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={callee.avatar} />
                <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                  {callee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : null}

            <div className={isMinimized ? "flex-1 text-left" : ""}>
              <h3 className={cn(
                "font-semibold text-foreground",
                isMinimized ? "text-sm" : "text-xl"
              )}>
                {callee.name}
              </h3>
              <p className={cn(
                "text-muted-foreground",
                isMinimized ? "text-xs" : "text-sm"
              )}>
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* Controls */}
          {!isMinimized && (
            <div className="mt-8">
              {/* Incoming call controls */}
              {isIncoming && callStatus === 'ringing' && (
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
              {(callStatus === 'connecting' || callStatus === 'connected' || (!isIncoming && callStatus === 'ringing')) && (
                <div className="flex justify-center gap-4">
                  <Button
                    variant={isMuted ? "destructive" : "secondary"}
                    size="lg"
                    className="h-14 w-14 rounded-full"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>

                  {callType === 'video' && (
                    <Button
                      variant={!isVideoOn ? "destructive" : "secondary"}
                      size="lg"
                      className="h-14 w-14 rounded-full"
                      onClick={() => setIsVideoOn(!isVideoOn)}
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

                  <Button
                    variant={!isSpeakerOn ? "destructive" : "secondary"}
                    size="lg"
                    className="h-14 w-14 rounded-full"
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  >
                    {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Minimized end call button */}
          {isMinimized && callStatus !== 'ended' && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full shrink-0"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;
