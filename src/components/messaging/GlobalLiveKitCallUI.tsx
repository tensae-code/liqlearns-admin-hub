import React, { forwardRef, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Maximize2,
  Minimize2,
  X,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useLiveKitContext } from '@/contexts/LiveKitContext';
import { cn } from '@/lib/utils';

const GlobalLiveKitCallUI = forwardRef<HTMLDivElement>((_, ref) => {
  const {
    callState,
    callDuration,
    isMinimized,
    toggleMinimize,
    endCall,
    acceptIncomingCall,
    rejectIncomingCall,
    incomingCall,
    isMuted,
    isVideoOn,
    toggleMute,
    toggleVideo,
    localParticipant,
    remoteParticipants,
    attachVideoToElement,
    attachLocalVideoToElement,
  } = useLiveKitContext();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local video
  useEffect(() => {
    if (localVideoRef.current && isVideoOn) {
      attachLocalVideoToElement(localVideoRef.current);
    }
  }, [isVideoOn, attachLocalVideoToElement, localParticipant]);

  // Attach remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteParticipants.length > 0) {
      const firstRemote = remoteParticipants[0];
      if (firstRemote.isVideoOn) {
        attachVideoToElement(firstRemote.id, remoteVideoRef.current, 'camera');
      }
    }
  }, [remoteParticipants, attachVideoToElement]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text
  const getStatusText = () => {
    switch (callState.status) {
      case 'ringing':
        return callState.isIncoming ? 'Incoming call...' : 'Calling...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
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

  // Get peer info
  const peer = callState.peer || (remoteParticipants[0] ? {
    id: remoteParticipants[0].id,
    name: remoteParticipants[0].name,
    avatar: remoteParticipants[0].avatarUrl,
  } : null);

  // Don't render if idle and no incoming call
  if (callState.status === 'idle' && !incomingCall) {
    return null;
  }

  // Don't render popup for study rooms - they have embedded controls
  if (callState.roomContext === 'study_room') {
    return null;
  }

  // Auto-dismiss ended states after brief display
  if (callState.status === 'ended' || callState.status === 'rejected' || callState.status === 'no-answer') {
    return null;
  }

  const isCallActive = callState.status === 'connecting' || callState.status === 'connected';
  const isRinging = callState.status === 'ringing';

  // ============ INCOMING CALL SCREEN ============
  if (incomingCall && callState.status === 'idle') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-card border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-muted/50"
              onClick={rejectIncomingCall}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-8 flex flex-col items-center gap-6">
            {/* Avatar with pulse animation */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <Avatar className="h-28 w-28 ring-4 ring-primary/30">
                <AvatarImage src={incomingCall.callerAvatar} />
                <AvatarFallback className="text-3xl bg-primary/10">
                  {incomingCall.callerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Call type indicator */}
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-2">
                {incomingCall.callType === 'video' ? (
                  <Video className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Phone className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
            </div>

            {/* Caller info */}
            <div className="text-center">
              <h2 className="text-xl font-semibold">{incomingCall.callerName}</h2>
              <motion.p 
                className="text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Incoming {incomingCall.callType} call...
              </motion.p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-8 mt-4">
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-16 w-16 rounded-full shadow-lg"
                  onClick={rejectIncomingCall}
                >
                  <PhoneOff className="h-7 w-7" />
                </Button>
                <span className="text-sm text-muted-foreground">Decline</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-success hover:bg-success/90 shadow-lg"
                  onClick={acceptIncomingCall}
                >
                  {incomingCall.callType === 'video' ? (
                    <Video className="h-7 w-7 text-success-foreground" />
                  ) : (
                    <Phone className="h-7 w-7 text-success-foreground" />
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">Accept</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============ MINIMIZED FLOATING BUTTON ============
  if (isMinimized && isCallActive) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <div className="relative group">
          {/* Main floating button */}
          <Button
            size="lg"
            className="rounded-full h-16 w-16 shadow-xl relative overflow-hidden bg-primary"
            onClick={toggleMinimize}
          >
            {remoteParticipants[0]?.isVideoOn ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Avatar className="h-12 w-12">
                <AvatarImage src={peer?.avatar} />
                <AvatarFallback>{peer?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            )}
          </Button>
          
          {/* Duration badge */}
          <div className="absolute -top-2 -right-2 bg-success text-success-foreground text-xs px-2 py-1 rounded-full font-medium">
            {formatDuration(callDuration)}
          </div>

          {/* Hover controls */}
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <div className="flex gap-2 bg-card border rounded-xl p-3 shadow-xl">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                onClick={endCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                className={cn("h-10 w-10 rounded-full", isMuted && "bg-destructive/10 text-destructive")}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              {callState.callType === 'video' && (
                <Button 
                  size="icon" 
                  variant="ghost"
                  className={cn("h-10 w-10 rounded-full", !isVideoOn && "bg-destructive/10 text-destructive")}
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost"
                className="h-10 w-10 rounded-full"
                onClick={toggleMinimize}
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============ FULL CALL SCREEN ============
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between p-4 bg-card border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={peer?.avatar} />
            <AvatarFallback>{peer?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{peer?.name || 'Unknown'}</h3>
            <p className="text-sm text-muted-foreground">{getStatusText()}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isCallActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={toggleMinimize}
            >
              <Minimize2 className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-destructive hover:text-destructive-foreground"
            onClick={endCall}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-muted overflow-hidden">
        {/* Remote video / avatar */}
        {remoteParticipants[0]?.isVideoOn ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Avatar className="h-32 w-32 ring-4 ring-muted">
              <AvatarImage src={peer?.avatar} />
              <AvatarFallback className="text-4xl">
                {peer?.name?.charAt(0) || <User className="h-16 w-16" />}
              </AvatarFallback>
            </Avatar>
            
            {/* Ringing animation */}
            {isRinging && (
              <>
                <motion.div
                  className="absolute w-36 h-36 rounded-full border-2 border-primary/50"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute w-36 h-36 rounded-full border-2 border-primary/50"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
            
            <p className="text-lg text-muted-foreground">{getStatusText()}</p>
          </div>
        )}

        {/* Local video preview (PiP) */}
        {isVideoOn && isCallActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 right-4 w-28 sm:w-36 aspect-video bg-muted rounded-xl overflow-hidden shadow-xl border-2 border-background"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </motion.div>
        )}
      </div>

      {/* Bottom control bar */}
      <div className="p-6 bg-card border-t">
        <div className="flex items-center justify-center gap-4">
          {/* Mute button */}
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="lg"
            className="h-14 w-14 rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* Video toggle (only for video calls) */}
          {callState.callType === 'video' && (
            <Button
              variant={!isVideoOn ? 'destructive' : 'secondary'}
              size="lg"
              className="h-14 w-14 rounded-full"
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
          )}

          {/* END CALL BUTTON - Always visible and prominent */}
          <Button
            variant="destructive"
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={endCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
});

GlobalLiveKitCallUI.displayName = 'GlobalLiveKitCallUI';

export default GlobalLiveKitCallUI;
