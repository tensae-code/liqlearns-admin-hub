import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  GripVertical,
  Monitor,
  MonitorOff,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVideoChat } from '@/hooks/useVideoChat';
import type { StudyRoom, RoomParticipant } from '@/hooks/useStudyRooms';

interface FloatingStudyRoomProps {
  room: StudyRoom;
  participants: RoomParticipant[];
  currentUserId: string;
  isMicOn: boolean;
  onToggleMic: () => void;
  onLeaveRoom: () => void;
  onExpand: () => void;
}

const FloatingStudyRoom = ({
  room,
  participants,
  currentUserId,
  isMicOn,
  onToggleMic,
  onLeaveRoom,
  onExpand,
}: FloatingStudyRoomProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 360, y: window.innerHeight - 280 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  
  const {
    isVideoOn,
    isScreenSharing,
    localStream,
    toggleVideo,
    toggleMic: toggleLocalMic,
    toggleScreenShare,
  } = useVideoChat();

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

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

  const handleMicToggle = () => {
    onToggleMic();
    if (localStream) {
      toggleLocalMic();
    }
  };

  const currentParticipant = participants.find(p => p.user_id === currentUserId);

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed z-50 bottom-4 right-4"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full h-14 w-14 bg-accent hover:bg-accent/90 shadow-xl"
        >
          <div className="relative">
            <Users className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {participants.length}
            </span>
          </div>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{ left: position.x, top: position.y }}
      className="fixed z-50 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
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
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExpand}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Video Preview */}
      <div className="relative aspect-video bg-muted">
        {isVideoOn && localStream ? (
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
          <span className="text-xs">{currentParticipant?.study_title || 'Studying...'}</span>
        </div>

        {/* Participant count */}
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
          <span className="text-xs font-medium">{participants.length} in room</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 p-3 bg-background">
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
          variant={isVideoOn ? "default" : "outline"}
          size="icon"
          className={cn("rounded-full h-9 w-9", isVideoOn && "bg-accent")}
          onClick={toggleVideo}
        >
          {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>

        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="icon"
          className={cn("rounded-full h-9 w-9", isScreenSharing && "bg-accent")}
          onClick={toggleScreenShare}
        >
          {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-9 w-9"
          onClick={onLeaveRoom}
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default FloatingStudyRoom;
