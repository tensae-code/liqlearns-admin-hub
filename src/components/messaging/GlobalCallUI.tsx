import { useEffect } from 'react';
import { useCall } from '@/contexts/CallContext';
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
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const GlobalCallUI = () => {
  const {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoOn,
    isMinimized,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleMinimize,
    localVideoRef,
    remoteVideoRef,
  } = useCall();

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        return 'Call declined';
      case 'no-answer':
        return 'No answer';
      default:
        return '';
    }
  };

  if (callState.status === 'idle' || !callState.peer) return null;

  const showIncomingControls = callState.isIncoming && callState.status === 'ringing';
  const showInCallControls = ['connecting', 'connected', 'ringing'].includes(callState.status) && !showIncomingControls;
  const isCallActive = callState.status === 'connected';

  // Minimized floating button
  if (isMinimized && isCallActive) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-24 right-4 z-[9999] group"
      >
        {/* Main floating button */}
        <div className="relative">
          <motion.button
            onClick={toggleMinimize}
            className="w-16 h-16 rounded-full bg-primary shadow-lg flex items-center justify-center relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Video preview in button */}
            {callState.callType === 'video' && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <Avatar className="w-12 h-12">
                <AvatarImage src={callState.peer.avatar} />
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                  {callState.peer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            
            {/* Duration badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-background/90 text-foreground text-xs px-2 py-0.5 rounded-full">
              {formatDuration(callDuration)}
            </div>
          </motion.button>

          {/* Hover controls */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -left-2 -right-2 -bottom-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
            >
              {/* End call button - top */}
              <motion.button
                onClick={endCall}
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <PhoneOff className="w-4 h-4" />
              </motion.button>

              {/* Mute button - left */}
              <motion.button
                onClick={toggleMute}
                className={`absolute top-1/2 -translate-y-1/2 -left-12 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  isMuted ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </motion.button>

              {/* Video button - right (only for video calls) */}
              {callState.callType === 'video' && (
                <motion.button
                  onClick={toggleVideo}
                  className={`absolute top-1/2 -translate-y-1/2 -right-12 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                    !isVideoOn ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </motion.button>
              )}

              {/* Expand button - bottom */}
              <motion.button
                onClick={toggleMinimize}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Maximize2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Full call dialog
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="p-0 border-0 overflow-hidden max-w-md">
        <VisuallyHidden>
          <DialogTitle>{callState.isIncoming ? 'Incoming Call' : 'Outgoing Call'}</DialogTitle>
        </VisuallyHidden>
        <motion.div
          layout
          className="relative bg-gradient-to-b from-background via-background to-muted p-6"
        >
          {/* Minimize button */}
          {isCallActive && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={toggleMinimize}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}

          {/* Video display area */}
          {callState.callType === 'video' && isCallActive && (
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
                    <AvatarImage src={callState.peer.avatar} />
                    <AvatarFallback className="text-3xl bg-gradient-accent text-accent-foreground">
                      {callState.peer.name.charAt(0)}
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
                  <AvatarImage src={callState.peer.avatar} />
                  <AvatarFallback className="text-3xl bg-gradient-accent text-accent-foreground">
                    {callState.peer.name.charAt(0)}
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
                {callState.peer.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {callState.callType === 'video' ? 'Video call' : 'Voice call'} • {getStatusText()}
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
                  onClick={rejectCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-success hover:bg-success/90"
                  onClick={acceptCall}
                >
                  {callState.callType === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
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

                {callState.callType === 'video' && (
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

export default GlobalCallUI;
