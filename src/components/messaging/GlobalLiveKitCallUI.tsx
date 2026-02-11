import React, { forwardRef, useRef, useEffect, useState } from 'react';
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
  Camera,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useOptionalLiveKitContext } from '@/contexts/LiveKitContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Component to render a single remote participant's video/audio
const RemoteParticipantView: React.FC<{
  participant: { id: string; name: string; avatarUrl?: string; isVideoOn: boolean; isMuted: boolean };
  attachVideoToElement?: (id: string, el: HTMLVideoElement | null, type: 'camera' | 'screen') => void;
  attachRemoteAudio?: (id: string, el: HTMLAudioElement | null) => void;
  isLarge?: boolean;
}> = ({ participant, attachVideoToElement, attachRemoteAudio, isLarge }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.isVideoOn && attachVideoToElement) {
      attachVideoToElement(participant.id, videoRef.current, 'camera');
    }
  }, [participant.id, participant.isVideoOn, attachVideoToElement]);

  useEffect(() => {
    if (audioRef.current && attachRemoteAudio) {
      attachRemoteAudio(participant.id, audioRef.current);
    }
  }, [participant.id, attachRemoteAudio]);

  return (
    <div className={cn(
      "relative bg-muted rounded-lg overflow-hidden flex items-center justify-center",
      isLarge ? "aspect-[4/3]" : "aspect-square"
    )}>
      {participant.isVideoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain bg-black"
        />
      ) : (
        <Avatar className={cn(isLarge ? "h-16 w-16" : "h-12 w-12")}>
          <AvatarImage src={participant.avatarUrl} />
          <AvatarFallback className="text-lg">
            {participant.name?.charAt(0) || <User className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
      )}
      {/* Name + mute indicator */}
      <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 flex items-center gap-1">
        {participant.isMuted ? (
          <MicOff className="h-3 w-3 text-destructive" />
        ) : (
          <Mic className="h-3 w-3 text-success" />
        )}
        <span className="text-[10px] text-white truncate">{participant.name}</span>
      </div>
      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  );
};

const GlobalLiveKitCallUI = forwardRef<HTMLDivElement>((_, ref) => {
  const context = useOptionalLiveKitContext();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  // Extract values from context (or use defaults for hooks that run before early return)
  const isVideoOn = context?.isVideoOn ?? false;
  const localParticipant = context?.localParticipant;
  const remoteParticipants = context?.remoteParticipants ?? [];
  const attachVideoToElement = context?.attachVideoToElement;
  const attachLocalVideoToElement = context?.attachLocalVideoToElement;
  const attachRemoteAudio = context?.attachRemoteAudio;

  // Attach local video
  useEffect(() => {
    if (localVideoRef.current && isVideoOn && attachLocalVideoToElement) {
      attachLocalVideoToElement(localVideoRef.current);
    }
  }, [isVideoOn, attachLocalVideoToElement, localParticipant]);

  // Enumerate cameras when video is on
  useEffect(() => {
    const enumerateCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('[GlobalLiveKitCallUI] Failed to enumerate cameras:', err);
      }
    };
    
    if (isVideoOn) {
      enumerateCameras();
    }
  }, [isVideoOn, selectedCameraId]);

  // Early return if no context available
  if (!context) {
    return null;
  }

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
    toggleMute,
    toggleVideo,
    switchCamera,
  } = context;

  const isGroupCall = callState.roomContext === 'group';
  const totalParticipants = remoteParticipants.length + 1; // +1 for self

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

  // Get peer info (for DM calls)
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

  // Auto-dismiss ended states
  if (callState.status === 'ended' || callState.status === 'rejected' || callState.status === 'no-answer') {
    return null;
  }

  const isCallActive = callState.status === 'connecting' || callState.status === 'connected';
  const isRinging = callState.status === 'ringing';

  // ============ INCOMING CALL POPUP ============
  if (incomingCall && callState.status === 'idle') {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDragEnd={(_, info) => {
          if (info.offset.y < -80 || info.velocity.y < -500) {
            rejectIncomingCall();
          }
        }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        
        <div className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <motion.div
                className="absolute inset-0 rounded-full bg-success/30"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <Avatar className="h-14 w-14 ring-2 ring-success/50">
                <AvatarImage src={incomingCall.callerAvatar} />
                <AvatarFallback className="text-lg bg-primary/10">
                  {incomingCall.callerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{incomingCall.callerName}</h3>
              <motion.p 
                className="text-sm text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Incoming {incomingCall.callType} call...
              </motion.p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={rejectIncomingCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
              
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-success hover:bg-success/90"
                onClick={acceptIncomingCall}
              >
                {incomingCall.callType === 'video' ? (
                  <Video className="h-5 w-5 text-success-foreground" />
                ) : (
                  <Phone className="h-5 w-5 text-success-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground pb-2 sm:hidden">
            Swipe up to dismiss
          </p>
        </div>
      </motion.div>
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
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-xl relative overflow-hidden bg-primary"
            onClick={toggleMinimize}
          >
            {isGroupCall ? (
              <div className="flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarImage src={peer?.avatar} />
                <AvatarFallback>{peer?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            )}
          </Button>
          
          {/* Duration badge */}
          <div className="absolute -top-1 -right-1 bg-success text-success-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
            {isGroupCall ? totalParticipants : formatDuration(callDuration)}
          </div>

          {/* Hover controls */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <div className="flex gap-1.5 bg-card border rounded-xl p-2 shadow-xl">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                onClick={endCall}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                className={cn("h-9 w-9 rounded-full", isMuted && "bg-destructive/10 text-destructive")}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              {callState.callType === 'video' && (
                <Button 
                  size="icon" 
                  variant="ghost"
                  className={cn("h-9 w-9 rounded-full", !isVideoOn && "bg-destructive/10 text-destructive")}
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost"
                className="h-9 w-9 rounded-full"
                onClick={toggleMinimize}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============ POPUP CALL WINDOW ============
  // Determine grid layout for group calls
  const getGridClass = () => {
    if (!isGroupCall || remoteParticipants.length <= 1) return '';
    if (remoteParticipants.length <= 3) return 'grid grid-cols-2 gap-1';
    return 'grid grid-cols-2 gap-1';
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "fixed bottom-20 md:bottom-4 z-50",
        isGroupCall && remoteParticipants.length > 1
          ? "right-1 left-1 md:left-auto md:right-4 md:w-[420px]"
          : "right-1 left-1 md:left-auto md:right-4 md:w-[360px]"
      )}
    >
      <div className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <div className="flex items-center gap-2 min-w-0">
            {isGroupCall ? (
              <>
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-sm truncate">Group Call</h4>
                  <p className="text-xs text-muted-foreground">
                    {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''} • {getStatusText()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={peer?.avatar} />
                  <AvatarFallback>{peer?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h4 className="font-medium text-sm truncate">{peer?.name || 'Unknown'}</h4>
                  <p className="text-xs text-muted-foreground">{getStatusText()}</p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-1 shrink-0">
            {isCallActive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={toggleMinimize}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-destructive hover:text-destructive-foreground"
              onClick={endCall}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video/Avatar area */}
        <div className="relative bg-muted">
          {isGroupCall && remoteParticipants.length > 0 ? (
            /* Group call grid: show all remote participants + local PiP */
            <div className="p-1">
              <div className={getGridClass()}>
                {remoteParticipants.map((rp) => (
                  <RemoteParticipantView
                    key={rp.id}
                    participant={rp}
                    attachVideoToElement={attachVideoToElement}
                    attachRemoteAudio={attachRemoteAudio}
                    isLarge={remoteParticipants.length === 1}
                  />
                ))}
                {/* Show self in grid too for group calls */}
                <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center aspect-square">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain bg-black"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-sm">You</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 flex items-center gap-1">
                    {isMuted ? (
                      <MicOff className="h-3 w-3 text-destructive" />
                    ) : (
                      <Mic className="h-3 w-3 text-success" />
                    )}
                    <span className="text-[10px] text-white">You</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DM call or group call with 0 remote: single view */
            <div className="aspect-[4/3]">
              {remoteParticipants[0]?.isVideoOn ? (
                <RemoteParticipantView
                  participant={remoteParticipants[0]}
                  attachVideoToElement={attachVideoToElement}
                  attachRemoteAudio={attachRemoteAudio}
                  isLarge
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={peer?.avatar} />
                      <AvatarFallback className="text-2xl">
                        {peer?.name?.charAt(0) || <User className="h-10 w-10" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isRinging && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary/50"
                          animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary/50"
                          animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                        />
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{getStatusText()}</p>
                </div>
              )}

              {/* Local video PiP for DM calls */}
              {isVideoOn && isCallActive && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-2 right-2 w-20 aspect-video bg-muted rounded-lg overflow-hidden shadow-lg border border-background"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain bg-black"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </motion.div>
              )}

              {/* Audio elements for DM remote participants */}
              {remoteParticipants.length > 0 && !isGroupCall && (
                <RemoteAudioOnly 
                  participant={remoteParticipants[0]} 
                  attachRemoteAudio={attachRemoteAudio} 
                />
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-3 flex items-center justify-center gap-2 md:gap-3 bg-muted/30">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="h-10 w-10 md:h-11 md:w-11 rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>

          {callState.callType === 'video' && (
            <>
              <Button
                variant={!isVideoOn ? 'destructive' : 'secondary'}
                size="icon"
                className="h-10 w-10 md:h-11 md:w-11 rounded-full"
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video className="h-4 w-4 md:h-5 md:w-5" /> : <VideoOff className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 md:h-11 md:w-11 rounded-full"
                    title="Switch camera"
                  >
                    <Camera className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="mb-2">
                  {cameras.length > 0 ? (
                    cameras.map((camera) => (
                      <DropdownMenuItem
                        key={camera.deviceId}
                        onClick={() => {
                          setSelectedCameraId(camera.deviceId);
                          switchCamera?.();
                        }}
                        className={cn(
                          "cursor-pointer",
                          selectedCameraId === camera.deviceId && "bg-accent"
                        )}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => switchCamera?.()}>
                        <Camera className="h-4 w-4 mr-2" />
                        Front Camera
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => switchCamera?.()}>
                        <Camera className="h-4 w-4 mr-2" />
                        Back Camera
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Button
            variant="destructive"
            size="icon"
            className="h-10 w-10 md:h-11 md:w-11 rounded-full"
            onClick={endCall}
          >
            <PhoneOff className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

// Hidden audio-only component for DM calls 
const RemoteAudioOnly: React.FC<{
  participant: { id: string };
  attachRemoteAudio?: (id: string, el: HTMLAudioElement | null) => void;
}> = ({ participant, attachRemoteAudio }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (audioRef.current && attachRemoteAudio) {
      attachRemoteAudio(participant.id, audioRef.current);
    }
  }, [participant.id, attachRemoteAudio]);

  return <audio ref={audioRef} autoPlay className="hidden" />;
};

GlobalLiveKitCallUI.displayName = 'GlobalLiveKitCallUI';

export default GlobalLiveKitCallUI;
