import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Settings,
  Hand,
  Crown,
  Shield,
  X,
  Maximize2,
  Minimize2,
  Camera,
  Volume2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { GroupMember } from './GroupInfoSheet';
import { useMediaDevices } from '@/hooks/useMediaDevices';

interface ClubRoomViewProps {
  channelName: string;
  groupName: string;
  participants: GroupMember[];
  currentUserId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  onLeave: () => void;
  onClose: () => void;
  activeParticipantIds?: string[]; // Only show participants who are actually in the room
}

const ClubRoomView = ({
  channelName,
  groupName,
  participants,
  currentUserId,
  currentUserRole,
  onLeave,
  onClose,
  activeParticipantIds = [],
}: ClubRoomViewProps) => {
  // Only show participants who are actually in the room (or just current user if empty)
  const activeParticipants = activeParticipantIds.length > 0
    ? participants.filter(p => activeParticipantIds.includes(p.id) || p.id === currentUserId)
    : []; // Start with no participants - they join when they actually connect
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const {
    cameras,
    microphones,
    speakers,
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
    getMediaConstraints,
  } = useMediaDevices();

  // Request media permissions with selected device
  const toggleMic = async () => {
    try {
      if (!isMicOn) {
        const constraints = selectedMicrophone 
          ? { audio: { deviceId: { exact: selectedMicrophone } } }
          : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(prev => {
          if (prev) {
            stream.getAudioTracks().forEach(track => prev.addTrack(track));
            return prev;
          }
          return stream;
        });
      } else if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
      }
      setIsMicOn(!isMicOn);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const toggleVideo = async () => {
    try {
      if (!isVideoOn) {
        const constraints = selectedCamera
          ? { video: { deviceId: { exact: selectedCamera } } }
          : { video: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setLocalStream(prev => {
          if (prev) {
            stream.getVideoTracks().forEach(track => prev.addTrack(track));
            return prev;
          }
          return stream;
        });
      } else if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
      setIsVideoOn(!isVideoOn);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Switch camera while streaming
  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (isVideoOn && localStream) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
        localStream.getVideoTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
        newStream.getVideoTracks().forEach(track => {
          localStream.addTrack(track);
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (error) {
        console.error('Error switching camera:', error);
      }
    }
  };

  // Switch microphone while streaming
  const handleMicChange = async (deviceId: string) => {
    setSelectedMicrophone(deviceId);
    if (isMicOn && localStream) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
        localStream.getAudioTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
        newStream.getAudioTracks().forEach(track => {
          localStream.addTrack(track);
        });
      } catch (error) {
        console.error('Error switching microphone:', error);
      }
    }
  };

  const handleLeave = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    onLeave();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  // Use activeParticipants count for grid (plus current user)
  const participantCount = activeParticipants.length + 1;
  const gridCols = participantCount <= 2
    ? 'grid-cols-1 md:grid-cols-2'
    : participantCount <= 4
    ? 'grid-cols-2'
    : participantCount <= 9
    ? 'grid-cols-2 md:grid-cols-3'
    : 'grid-cols-3 md:grid-cols-4';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col bg-background rounded-xl border border-border overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50" : "h-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-success/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <div>
            <h3 className="font-semibold text-foreground">🎙️ {channelName}</h3>
            <p className="text-xs text-muted-foreground">{groupName} • Club Room</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {participantCount}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className={cn("grid gap-3", gridCols)}>
          {/* Current user first */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-xl border-2 border-accent bg-card overflow-hidden aspect-video"
          >
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Avatar className="w-16 h-16 border-4 border-background shadow-lg">
                  <AvatarFallback className="text-xl font-bold bg-accent text-accent-foreground">
                    You
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMicOn ? (
                    <Mic className="w-4 h-4 text-success" />
                  ) : (
                    <MicOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">You</span>
                </div>
                {currentUserRole === 'owner' && (
                  <Crown className="w-4 h-4 text-gold" />
                )}
                {currentUserRole === 'admin' && (
                  <Shield className="w-4 h-4 text-accent" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Other active participants only */}
          {activeParticipants
            .filter(p => p.id !== currentUserId)
            .map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index + 1) * 0.05 }}
                className="relative rounded-xl border border-border bg-card overflow-hidden aspect-video"
              >
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <Avatar className="w-16 h-16 border-4 border-background shadow-lg">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                      {participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MicOff className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">{participant.name}</span>
                    </div>
                    {participant.role === 'owner' && (
                      <Crown className="w-4 h-4 text-gold" />
                    )}
                    {participant.role === 'admin' && (
                      <Shield className="w-4 h-4 text-accent" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

          {/* Empty state - show when only current user */}
          {activeParticipants.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                You're the first one here! Waiting for others to join...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center justify-center gap-3">
          {/* Mic */}
          <Button
            variant={isMicOn ? "default" : "outline"}
            size="lg"
            className={cn(
              "rounded-full w-14 h-14",
              isMicOn && "bg-success hover:bg-success/90"
            )}
            onClick={toggleMic}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* Video */}
          <Button
            variant={isVideoOn ? "default" : "outline"}
            size="lg"
            className={cn(
              "rounded-full w-14 h-14",
              isVideoOn && "bg-accent hover:bg-accent/90"
            )}
            onClick={toggleVideo}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          {/* Raise Hand */}
          <Button
            variant={isHandRaised ? "default" : "outline"}
            size="lg"
            className={cn(
              "rounded-full w-14 h-14",
              isHandRaised && "bg-gold hover:bg-gold/90"
            )}
            onClick={() => setIsHandRaised(!isHandRaised)}
          >
            <Hand className="w-6 h-6" />
          </Button>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64 bg-popover z-50">
              {/* Camera Selection */}
              <DropdownMenuLabel className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera
              </DropdownMenuLabel>
              {cameras.map((camera) => (
                <DropdownMenuItem
                  key={camera.deviceId}
                  onClick={() => handleCameraChange(camera.deviceId)}
                  className={cn(selectedCamera === camera.deviceId && "bg-accent")}
                >
                  {camera.label}
                </DropdownMenuItem>
              ))}
              {cameras.length === 0 && (
                <DropdownMenuItem disabled>No cameras found</DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Microphone Selection */}
              <DropdownMenuLabel className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Microphone
              </DropdownMenuLabel>
              {microphones.map((mic) => (
                <DropdownMenuItem
                  key={mic.deviceId}
                  onClick={() => handleMicChange(mic.deviceId)}
                  className={cn(selectedMicrophone === mic.deviceId && "bg-accent")}
                >
                  {mic.label}
                </DropdownMenuItem>
              ))}
              {microphones.length === 0 && (
                <DropdownMenuItem disabled>No microphones found</DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Speaker Selection */}
              <DropdownMenuLabel className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Speaker
              </DropdownMenuLabel>
              {speakers.map((speaker) => (
                <DropdownMenuItem
                  key={speaker.deviceId}
                  onClick={() => setSelectedSpeaker(speaker.deviceId)}
                  className={cn(selectedSpeaker === speaker.deviceId && "bg-accent")}
                >
                  {speaker.label}
                </DropdownMenuItem>
              ))}
              {speakers.length === 0 && (
                <DropdownMenuItem disabled>No speakers found</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Leave */}
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={handleLeave}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ClubRoomView;
