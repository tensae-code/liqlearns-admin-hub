import React, { forwardRef, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Maximize2,
  Minimize2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
        return callState.isIncoming ? 'Incoming call...' : 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      case 'rejected':
        return 'Call rejected';
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

  // Handle incoming call
  if (incomingCall && callState.status === 'idle') {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={incomingCall.callerAvatar} />
                <AvatarFallback className="text-2xl">
                  {incomingCall.callerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold">{incomingCall.callerName}</h3>
              <p className="text-sm text-muted-foreground">
                Incoming {incomingCall.callType} call...
              </p>
            </div>

            <div className="flex gap-4 mt-4">
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={rejectIncomingCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full h-14 w-14 bg-emerald-500 hover:bg-emerald-600"
                onClick={acceptIncomingCall}
              >
                {incomingCall.callType === 'video' ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <Phone className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const showIncomingControls = callState.status === 'ringing' && callState.isIncoming;
  const showInCallControls = callState.status === 'connecting' || callState.status === 'connected';
  const isCallActive = callState.status === 'connecting' || callState.status === 'connected';

  // Minimized floating button
  if (isMinimized && isCallActive) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <div className="relative group">
          <Button
            size="lg"
            className="rounded-full h-16 w-16 shadow-lg relative overflow-hidden"
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
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            {formatDuration(callDuration)}
          </div>

          {/* Hover controls */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-2 bg-background border rounded-lg p-2 shadow-lg">
              <Button size="icon" variant="ghost" onClick={endCall}>
                <PhoneOff className="h-4 w-4 text-destructive" />
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleMute}>
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              {callState.callType === 'video' && (
                <Button size="icon" variant="ghost" onClick={toggleVideo}>
                  {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={toggleMinimize}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full dialog
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header with minimize */}
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {isCallActive && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-background/50 backdrop-blur-sm"
              onClick={toggleMinimize}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Video area */}
        <div className="relative aspect-video bg-muted">
          {/* Remote video */}
          {remoteParticipants[0]?.isVideoOn ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar className="h-32 w-32">
                <AvatarImage src={peer?.avatar} />
                <AvatarFallback className="text-4xl">
                  {peer?.name?.charAt(0) || <User className="h-16 w-16" />}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Local video preview */}
          {isVideoOn && (
            <div className="absolute bottom-4 right-4 w-32 aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            </div>
          )}

          {/* Status overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="text-center text-white">
              <h3 className="font-semibold text-lg">{peer?.name || 'Connecting...'}</h3>
              <p className="text-sm opacity-80">{getStatusText()}</p>
            </div>
          </div>

          {/* Ringing animation */}
          {callState.status === 'ringing' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute w-40 h-40 rounded-full border-4 border-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex justify-center gap-4">
          {showIncomingControls && (
            <>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={() => {
                  endCall();
                }}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full h-14 w-14 bg-emerald-500 hover:bg-emerald-600"
                onClick={acceptIncomingCall}
              >
                <Phone className="h-6 w-6" />
              </Button>
            </>
          )}

          {showInCallControls && (
            <>
              <Button
                variant={isMuted ? 'destructive' : 'secondary'}
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              {callState.callType === 'video' && (
                <Button
                  variant={!isVideoOn ? 'destructive' : 'secondary'}
                  size="lg"
                  className="rounded-full h-14 w-14"
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>
              )}

              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={endCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </>
          )}

          {(callState.status === 'ended' || callState.status === 'rejected' || callState.status === 'no-answer') && (
            <Button
              variant="secondary"
              size="lg"
              onClick={endCall}
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

GlobalLiveKitCallUI.displayName = 'GlobalLiveKitCallUI';

export default GlobalLiveKitCallUI;