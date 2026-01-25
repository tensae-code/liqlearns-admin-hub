import { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  GripVertical,
  Users,
  Clock,
  Pin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptionalLiveKitContext } from '@/contexts/LiveKitContext';
import { useOptionalStudyRoomContext } from '@/contexts/StudyRoomContext';

const FloatingStudyRoom = forwardRef<HTMLDivElement>((_, ref) => {
  const context = useOptionalStudyRoomContext();
  const livekit = useOptionalLiveKitContext();
  
  // All hooks must be called before any conditional returns
  const [showPinnedList, setShowPinnedList] = useState(true);
  const [position, setPosition] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 360 : 0, y: typeof window !== 'undefined' ? window.innerHeight - 500 : 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Get context values safely
  const room = context?.activeRoom;
  const participants = context?.activeParticipants || [];
  const pinnedUsers = context?.pinnedUsers || [];
  const isMicOn = context?.isMicOn ?? false;
  const setIsMicOn = context?.setIsMicOn;
  const isMinimized = context?.isMinimized ?? false;
  const setIsMinimized = context?.setIsMinimized;
  const leaveActiveRoom = context?.leaveActiveRoom;
  const setIsPopout = context?.setIsPopout;
  const sessionStartTime = context?.sessionStartTime;

  // Calculate elapsed time
  useEffect(() => {
    if (!sessionStartTime) {
      setElapsedSeconds(0);
      return;
    }
    
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Attach local video when available
  useEffect(() => {
    if (localVideoRef.current && livekit?.isVideoOn && livekit?.attachLocalVideoToElement) {
      livekit.attachLocalVideoToElement(localVideoRef.current);
    }
  }, [livekit?.isVideoOn, livekit?.attachLocalVideoToElement]);

  // Handle drag events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 340, dragRef.current.startPosX + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 240, dragRef.current.startPosY + deltaY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // If no context or no active room, don't render
  if (!context || !room || !context.isPopout) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isStreakEligible = elapsedSeconds >= 1800; // 30 minutes

  // Get pinned participants
  const pinnedParticipants = participants.filter(p => pinnedUsers.includes(p.user_id));

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  const handleMicToggle = () => {
    setIsMicOn?.(!isMicOn);
    livekit?.toggleMute();
  };

  const handleVideoToggle = () => {
    livekit?.toggleVideo();
  };

  const handleLeave = async () => {
    livekit?.endCall();
    await leaveActiveRoom?.();
  };

  const handleExpand = () => {
    setIsPopout?.(false);
    setIsMinimized?.(false);
  };

  const currentParticipant = participants.find(p => p.user_id === room?.host_id);

  // Minimized state - position above quick access button (bottom-right, but higher)
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed z-[60] bottom-24 right-6"
      >
        <Button
          onClick={() => setIsMinimized?.(false)}
          className="rounded-full h-14 w-14 bg-gradient-to-br from-accent to-primary shadow-xl relative"
        >
          <div className="relative">
            <Users className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {participants.length}
            </span>
          </div>
        </Button>
        
        {/* Timer badge */}
        <div className={cn(
          "absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-[10px] font-medium text-white",
          isStreakEligible ? "bg-success" : "bg-accent"
        )}>
          {formatTime(elapsedSeconds)}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{ left: position.x, top: position.y }}
      className="fixed z-[60] w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header - Draggable */}
      <div
        className="flex items-center justify-between p-3 bg-muted/50 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-medium text-sm truncate max-w-32">{room.name}</span>
          <Badge variant="secondary" className="text-xs">
            {participants.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExpand}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized?.(true)}>
            <Minimize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Video Preview */}
      <div className="relative aspect-video bg-muted">
        {livekit.isVideoOn ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar className="w-16 h-16">
              <AvatarImage src={currentParticipant?.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-accent text-accent-foreground">
                {currentParticipant?.profile?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Mic indicator */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
          {isMicOn ? (
            <Mic className="w-3 h-3 text-success" />
          ) : (
            <MicOff className="w-3 h-3 text-muted-foreground" />
          )}
        </div>

        {/* Study Timer */}
        <div className={cn(
          "absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full",
          isStreakEligible ? "bg-success/90" : "bg-accent/90"
        )}>
          <Clock className="w-3 h-3 text-white" />
          <span className="text-xs font-medium text-white">{formatTime(elapsedSeconds)}</span>
        </div>

        {/* Participant count */}
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
          <span className="text-xs font-medium">{participants.length} in room</span>
        </div>
      </div>

      {/* Pinned Users Section */}
      {pinnedParticipants.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowPinnedList(!showPinnedList)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Pin className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-medium">Pinned ({pinnedParticipants.length})</span>
            </div>
            {showPinnedList ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          <AnimatePresence>
            {showPinnedList && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <ScrollArea className="max-h-32">
                  <div className="px-3 pb-2 space-y-1">
                    {pinnedParticipants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 p-1.5 rounded-md bg-gold/10"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={p.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-accent text-accent-foreground">
                            {p.profile?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {p.profile?.full_name}
                          </p>
                          {p.study_title && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              📚 {p.study_title}
                            </p>
                          )}
                        </div>
                        {p.is_mic_on ? (
                          <Mic className="w-3 h-3 text-success shrink-0" />
                        ) : (
                          <MicOff className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 p-3 bg-background border-t border-border">
        <Button
          variant={isMicOn ? "default" : "outline"}
          size="icon"
          className={cn("rounded-full h-9 w-9", isMicOn && "bg-accent")}
          onClick={handleMicToggle}
          disabled={room.is_always_muted}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>

        <Button
          variant={livekit.isVideoOn ? "default" : "outline"}
          size="icon"
          className={cn("rounded-full h-9 w-9", livekit.isVideoOn && "bg-accent")}
          onClick={handleVideoToggle}
        >
          {livekit.isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-9 w-9"
          onClick={handleLeave}
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
});

FloatingStudyRoom.displayName = 'FloatingStudyRoom';

export default FloatingStudyRoom;
