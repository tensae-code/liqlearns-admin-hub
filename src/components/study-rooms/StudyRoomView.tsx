import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Pin,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  MessageSquare,
  MoreVertical,
  Flag,
  UserPlus,
  Monitor,
  MonitorOff,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  Zap,
  Flame,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useVideoChat } from '@/hooks/useVideoChat';
import { useStudyRoomPresence } from '@/hooks/useStudyRoomPresence';
import ParticipantSidebar from './ParticipantSidebar';
import RoomSettingsSheet from './RoomSettingsSheet';
import type { RoomParticipant, StudyRoom } from '@/hooks/useStudyRooms';

interface DisplaySettings {
  showXP: boolean;
  showStreak: boolean;
  showEducation: boolean;
  showCountry: boolean;
  showStudyTitle: boolean;
  showPinCount: boolean;
  blurBackground: boolean;
}

interface StudyRoomViewProps {
  room: StudyRoom;
  participants: RoomParticipant[];
  currentUserId: string;
  isMicOn: boolean;
  myStudyTitle: string;
  onToggleMic: () => void;
  onUpdateStudyTitle: (title: string) => void;
  onPinUser: (userId: string) => void;
  onUnpinUser: (userId: string) => void;
  onLeaveRoom: () => void;
  onAddFriend: (userId: string) => void;
  onReport: (userId: string) => void;
  onPopout?: () => void;
}

const defaultDisplaySettings: DisplaySettings = {
  showXP: true,
  showStreak: true,
  showEducation: true,
  showCountry: true,
  showStudyTitle: true,
  showPinCount: true,
  blurBackground: false,
};

const StudyRoomView = ({
  room,
  participants,
  currentUserId,
  isMicOn,
  myStudyTitle,
  onToggleMic,
  onUpdateStudyTitle,
  onPinUser,
  onUnpinUser,
  onLeaveRoom,
  onAddFriend,
  onReport,
  onPopout,
}: StudyRoomViewProps) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem('studyRoomDisplaySettings');
    return saved ? { ...defaultDisplaySettings, ...JSON.parse(saved) } : defaultDisplaySettings;
  });

  const {
    isVideoOn,
    isScreenSharing,
    localStream,
    screenStream,
    toggleVideo,
    toggleMic: toggleLocalMic,
    toggleScreenShare,
    screenRef,
  } = useVideoChat();

  // Real-time presence tracking
  const {
    presentUserIds,
    isConnected,
    isUserPresent,
    updateMyPresence,
  } = useStudyRoomPresence(room.id);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Check if screen share is allowed (not in public rooms)
  const isScreenShareAllowed = room.room_type !== 'public';

  // Update local video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Sync my presence state when mic/video changes
  useEffect(() => {
    updateMyPresence({
      isMicOn,
      isVideoOn,
      studyTitle: myStudyTitle,
    });
  }, [isMicOn, isVideoOn, myStudyTitle, updateMyPresence]);

  const updateDisplaySetting = (key: keyof DisplaySettings, value: boolean) => {
    setDisplaySettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('studyRoomDisplaySettings', JSON.stringify(updated));
      return updated;
    });
  };

  // Sort participants: pinned first, then by pin count
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.is_pinned_by_me && !b.is_pinned_by_me) return -1;
    if (!a.is_pinned_by_me && b.is_pinned_by_me) return 1;
    return (b.pin_count || 0) - (a.pin_count || 0);
  });

  const handleMicToggle = () => {
    onToggleMic();
    if (localStream) {
      toggleLocalMic();
    }
  };

  const totalGridItems = sortedParticipants.length + (isScreenSharing ? 1 : 0);
  const gridCols = totalGridItems <= 2 
    ? 'grid-cols-1 md:grid-cols-2' 
    : totalGridItems <= 4 
    ? 'grid-cols-2' 
    : totalGridItems <= 9 
    ? 'grid-cols-2 md:grid-cols-3' 
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className={`flex items-center justify-between p-4 border-b border-border ${
          room.is_system_room 
            ? 'bg-gradient-to-r from-accent/10 to-primary/10' 
            : 'bg-card'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold text-foreground">{room.name}</h2>
                {room.is_system_room && (
                  <Badge className="bg-gradient-to-r from-accent to-primary text-white text-xs">
                    Official
                  </Badge>
                )}
                {/* Connection status indicator */}
                {isConnected ? (
                  <Badge variant="outline" className="text-success border-success/30 text-xs">
                    <Wifi className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Connecting...
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {room.study_topic && `📚 ${room.study_topic} • `}
                {presentUserIds.length} online • {participants.length} total
                {room.is_always_muted && ' • 🔇 Muted Room'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {room.room_type === 'kids' && (
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                🧒 Kids Room
              </Badge>
            )}
            {room.education_level && (
              <Badge variant="outline">{room.education_level}</Badge>
            )}
            {room.country && (
              <Badge variant="secondary">{room.country}</Badge>
            )}
            {onPopout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPopout}
                title="Pop out room"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              title={showSidebar ? 'Hide participants' : 'Show participants'}
              className="hidden md:flex"
            >
              {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className={cn('grid gap-4', gridCols)}>
            {/* Screen Share (if active) */}
            {isScreenSharing && screenStream && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-xl border-2 border-accent bg-black overflow-hidden col-span-full aspect-video"
              >
                <video
                  ref={screenRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Monitor className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Your Screen</span>
                </div>
              </motion.div>
            )}

            {sortedParticipants.map((participant, index) => {
              const isMe = participant.user_id === currentUserId;
              const initials = participant.profile?.full_name?.split(' ').map(n => n[0]).join('') || '?';
              const showLocalVideo = isMe && isVideoOn && localStream;

              return (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'relative rounded-xl border-2 overflow-hidden transition-all aspect-video',
                    participant.is_pinned_by_me
                      ? 'border-gold bg-gold/5'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="absolute inset-0 flex flex-col">
                    {/* Video / Avatar */}
                    <div className={cn(
                      "flex-1 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 relative",
                      displaySettings.blurBackground && showLocalVideo && "backdrop-blur-md"
                    )}>
                      {showLocalVideo ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className={cn(
                            "absolute inset-0 w-full h-full object-cover",
                            displaySettings.blurBackground && "filter blur-sm"
                          )}
                        />
                      ) : (
                        <div className="relative">
                          <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                            <AvatarImage src={participant.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-2xl font-bold bg-accent text-accent-foreground">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {/* Real-time presence indicator */}
                          <span className={cn(
                            "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background",
                            isUserPresent(participant.user_id) || isMe
                              ? "bg-success animate-pulse"
                              : "bg-muted-foreground"
                          )} />
                        </div>
                      )}
                    </div>

                    {/* Bottom info bar */}
                    <div className="p-3 bg-background/80 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {participant.is_mic_on || (isMe && isMicOn) ? (
                            <Mic className="w-4 h-4 text-success shrink-0" />
                          ) : (
                            <MicOff className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-sm truncate">
                            {participant.profile?.full_name || 'Unknown'}
                            {isMe && ' (You)'}
                          </span>
                        </div>

                        {/* Right Side - Stats & Actions */}
                        <div className="flex items-center gap-1">
                          {/* Enabled Stats on right side */}
                          {displaySettings.showPinCount && (participant.pin_count || 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Pin className="w-3 h-3 mr-1" />
                              {participant.pin_count}
                            </Badge>
                          )}
                          {displaySettings.showXP && participant.profile?.xp_points && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="w-3 h-3 mr-1 text-gold" />
                              {participant.profile.xp_points}
                            </Badge>
                          )}
                          {displaySettings.showStreak && participant.profile?.current_streak && (
                            <Badge variant="secondary" className="text-xs">
                              <Flame className="w-3 h-3 mr-1 text-streak" />
                              {participant.profile.current_streak}
                            </Badge>
                          )}

                          {!isMe && (
                            <>
                              {/* Quick Pin Button */}
                              <Button
                                variant={participant.is_pinned_by_me ? "default" : "ghost"}
                                size="icon"
                                className={cn(
                                  "h-7 w-7",
                                  participant.is_pinned_by_me && "bg-gold hover:bg-gold/90"
                                )}
                                onClick={() => 
                                  participant.is_pinned_by_me 
                                    ? onUnpinUser(participant.user_id)
                                    : onPinUser(participant.user_id)
                                }
                              >
                                <Pin className={cn("w-3.5 h-3.5", participant.is_pinned_by_me && "fill-current")} />
                              </Button>

                              {/* Quick Add Friend Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onAddFriend(participant.user_id)}
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </Button>

                              {/* More Options */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => onReport(participant.user_id)}
                                    className="text-destructive"
                                  >
                                    <Flag className="w-4 h-4 mr-2" /> Report
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </div>

                      {displaySettings.showStudyTitle && participant.study_title && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          📚 {participant.study_title}
                        </p>
                      )}
                    </div>

                    {/* Pin indicator */}
                    {participant.is_pinned_by_me && (
                      <div className="absolute top-2 right-2">
                        <Pin className="w-5 h-5 text-gold fill-gold" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Empty state when alone */}
            {sortedParticipants.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">You're the first one here!</h3>
                <p className="text-muted-foreground max-w-md">
                  Wait for others to join or invite your friends to study together.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center justify-center gap-3">
            {/* Mic Button */}
            {room.is_always_muted ? (
              <Button
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14 opacity-50 cursor-not-allowed"
                disabled
                title="Microphones are disabled in this room"
              >
                <MicOff className="w-6 h-6" />
              </Button>
            ) : (
              <Button
                variant={isMicOn ? "default" : "outline"}
                size="lg"
                className={cn(
                  "rounded-full w-14 h-14",
                  isMicOn && "bg-accent hover:bg-accent/90"
                )}
                onClick={handleMicToggle}
                title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
              >
                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>
            )}

            {/* Video Button */}
            <Button
              variant={isVideoOn ? "default" : "outline"}
              size="lg"
              className={cn(
                "rounded-full w-14 h-14",
                isVideoOn && "bg-accent hover:bg-accent/90"
              )}
              onClick={toggleVideo}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            {/* Screen Share Button - Disabled in public rooms */}
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="lg"
              className={cn(
                "rounded-full w-14 h-14",
                isScreenSharing && "bg-accent hover:bg-accent/90",
                !isScreenShareAllowed && "opacity-50 cursor-not-allowed"
              )}
              onClick={isScreenShareAllowed ? toggleScreenShare : undefined}
              disabled={!isScreenShareAllowed}
              title={!isScreenShareAllowed ? "Screen sharing not allowed in public rooms" : isScreenSharing ? "Stop sharing screen" : "Share screen"}
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </Button>

            {/* Chat Button (Coming Soon) */}
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14"
              disabled
              title="Chat coming soon"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>

            {/* Settings Button - Now opens sheet */}
            <RoomSettingsSheet
              displaySettings={displaySettings}
              onUpdateDisplaySetting={updateDisplaySetting}
            />

            {/* Leave Button */}
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={onLeaveRoom}
              title="Leave room"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile, toggleable on desktop */}
      {showSidebar && (
        <div className="hidden md:block">
          <ParticipantSidebar
            participants={participants}
            currentUserId={currentUserId}
            displaySettings={displaySettings}
            onPinUser={onPinUser}
            onUnpinUser={onUnpinUser}
            onAddFriend={onAddFriend}
            presentUserIds={presentUserIds}
          />
        </div>
      )}
    </div>
  );
};

export default StudyRoomView;
