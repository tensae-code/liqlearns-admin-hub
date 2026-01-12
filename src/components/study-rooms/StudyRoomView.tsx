import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Pin, 
  PinOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  MoreVertical,
  Flag,
  UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { RoomParticipant, StudyRoom } from '@/hooks/useStudyRooms';

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
}

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
}: StudyRoomViewProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(myStudyTitle);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sort participants: pinned first, then by pin count
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.is_pinned_by_me && !b.is_pinned_by_me) return -1;
    if (!a.is_pinned_by_me && b.is_pinned_by_me) return 1;
    return (b.pin_count || 0) - (a.pin_count || 0);
  });

  const handleTitleSave = () => {
    onUpdateStudyTitle(titleInput);
    setIsEditingTitle(false);
  };

  const gridCols = participants.length <= 4 
    ? 'grid-cols-2' 
    : participants.length <= 9 
    ? 'grid-cols-3' 
    : 'grid-cols-4';

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <div>
            <h2 className="font-display font-semibold text-foreground">{room.name}</h2>
            <p className="text-sm text-muted-foreground">
              {room.study_topic && `📚 ${room.study_topic} • `}
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <Users className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* My Study Title */}
      <div className="p-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">I'm studying:</span>
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="What are you studying?"
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              />
              <Button size="sm" onClick={handleTitleSave}>Save</Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-medium text-accent hover:underline"
            >
              {myStudyTitle || 'Click to set your study topic'}
            </button>
          )}
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className={cn(
          'grid gap-4',
          viewMode === 'grid' ? gridCols : 'grid-cols-1'
        )}>
          {sortedParticipants.map((participant, index) => {
            const isMe = participant.user_id === currentUserId;
            const initials = participant.profile?.full_name?.split(' ').map(n => n[0]).join('') || '?';

            return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'relative rounded-xl border-2 overflow-hidden transition-all',
                  participant.is_pinned_by_me
                    ? 'border-gold bg-gold/5'
                    : 'border-border bg-card',
                  viewMode === 'grid' ? 'aspect-video' : 'p-4'
                )}
              >
                {/* Grid View */}
                {viewMode === 'grid' ? (
                  <div className="absolute inset-0 flex flex-col">
                    {/* Video placeholder / Avatar */}
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                        <AvatarImage src={participant.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl font-bold bg-accent text-accent-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Bottom info bar */}
                    <div className="p-3 bg-background/80 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {participant.is_mic_on ? (
                            <Mic className="w-4 h-4 text-success shrink-0" />
                          ) : (
                            <MicOff className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-sm truncate">
                            {participant.profile?.full_name || 'Unknown'}
                            {isMe && ' (You)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {(participant.pin_count || 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Pin className="w-3 h-3 mr-1" />
                              {participant.pin_count}
                            </Badge>
                          )}

                          {!isMe && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => 
                                  participant.is_pinned_by_me 
                                    ? onUnpinUser(participant.user_id)
                                    : onPinUser(participant.user_id)
                                }>
                                  {participant.is_pinned_by_me ? (
                                    <><PinOff className="w-4 h-4 mr-2" /> Unpin</>
                                  ) : (
                                    <><Pin className="w-4 h-4 mr-2" /> Pin</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddFriend(participant.user_id)}>
                                  <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onReport(participant.user_id)}
                                  className="text-destructive"
                                >
                                  <Flag className="w-4 h-4 mr-2" /> Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {participant.study_title && (
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
                ) : (
                  /* List View */
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={participant.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {participant.profile?.full_name || 'Unknown'}
                        </span>
                        {isMe && <Badge variant="secondary">You</Badge>}
                        {participant.is_mic_on ? (
                          <Mic className="w-4 h-4 text-success" />
                        ) : (
                          <MicOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {participant.study_title && (
                        <p className="text-sm text-muted-foreground truncate">
                          📚 {participant.study_title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {(participant.pin_count || 0) > 0 && (
                        <Badge variant="secondary">
                          <Pin className="w-3 h-3 mr-1" />
                          {participant.pin_count}
                        </Badge>
                      )}

                      {!isMe && (
                        <Button
                          variant={participant.is_pinned_by_me ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            participant.is_pinned_by_me 
                              ? onUnpinUser(participant.user_id)
                              : onPinUser(participant.user_id)
                          }
                        >
                          {participant.is_pinned_by_me ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={isMicOn ? "default" : "outline"}
            size="lg"
            className={cn(
              "rounded-full w-14 h-14",
              isMicOn && "bg-accent"
            )}
            onClick={onToggleMic}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14"
            disabled
          >
            <VideoOff className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14"
            disabled
          >
            <MessageSquare className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <Settings className="w-6 h-6" />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={onLeaveRoom}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudyRoomView;
