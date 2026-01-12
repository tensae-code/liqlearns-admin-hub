import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Mic,
  MicOff,
  Pin,
  UserPlus,
  Search,
  Settings2,
  Users,
  Zap,
  Flame,
  GraduationCap,
  MapPin,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomParticipant } from '@/hooks/useStudyRooms';

interface DisplaySettings {
  showXP: boolean;
  showStreak: boolean;
  showEducation: boolean;
  showCountry: boolean;
  showStudyTitle: boolean;
  showPinCount: boolean;
}

interface ParticipantSidebarProps {
  participants: RoomParticipant[];
  currentUserId: string;
  displaySettings: DisplaySettings;
  onUpdateDisplaySetting: (key: keyof DisplaySettings, value: boolean) => void;
  onPinUser: (userId: string) => void;
  onUnpinUser: (userId: string) => void;
  onAddFriend: (userId: string) => void;
}

const ParticipantSidebar = ({
  participants,
  currentUserId,
  displaySettings,
  onUpdateDisplaySetting,
  onPinUser,
  onUnpinUser,
  onAddFriend,
}: ParticipantSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const filteredParticipants = participants.filter(p =>
    p.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.study_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    if (a.is_pinned_by_me && !b.is_pinned_by_me) return -1;
    if (!a.is_pinned_by_me && b.is_pinned_by_me) return 1;
    return (b.pin_count || 0) - (a.pin_count || 0);
  });

  const displayToggles = [
    { key: 'showXP' as const, label: 'XP Points', icon: Zap },
    { key: 'showStreak' as const, label: 'Streak', icon: Flame },
    { key: 'showEducation' as const, label: 'Education Level', icon: GraduationCap },
    { key: 'showCountry' as const, label: 'Country', icon: MapPin },
    { key: 'showStudyTitle' as const, label: 'Study Topic', icon: BookOpen },
    { key: 'showPinCount' as const, label: 'Pin Count', icon: Pin },
  ];

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Participants</h3>
            <Badge variant="secondary" className="text-xs">
              {participants.length}
            </Badge>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Display Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose what information to show for each participant
                </p>
                {displayToggles.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor={key} className="text-sm font-medium">
                        {label}
                      </Label>
                    </div>
                    <Switch
                      id={key}
                      checked={displaySettings[key]}
                      onCheckedChange={(checked) => onUpdateDisplaySetting(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedParticipants.map((participant) => {
            const isMe = participant.user_id === currentUserId;
            const initials = participant.profile?.full_name?.split(' ').map(n => n[0]).join('') || '?';

            return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'p-3 rounded-lg transition-colors',
                  participant.is_pinned_by_me
                    ? 'bg-gold/10 border border-gold/30'
                    : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {(participant.is_mic_on) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                        <Mic className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">
                        {participant.profile?.full_name || 'Unknown'}
                      </span>
                      {isMe && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          You
                        </Badge>
                      )}
                    </div>

                    {/* Study Title */}
                    {displaySettings.showStudyTitle && participant.study_title && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        📚 {participant.study_title}
                      </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {displaySettings.showPinCount && (participant.pin_count || 0) > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          <Pin className="w-2.5 h-2.5 mr-0.5 text-gold" />
                          {participant.pin_count}
                        </Badge>
                      )}
                      {displaySettings.showEducation && participant.profile?.education_level && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                          {participant.profile.education_level}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isMe && (
                    <div className="flex flex-col gap-1">
                      <Button
                        variant={participant.is_pinned_by_me ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          participant.is_pinned_by_me && "bg-gold hover:bg-gold/90 text-gold-foreground"
                        )}
                        onClick={() =>
                          participant.is_pinned_by_me
                            ? onUnpinUser(participant.user_id)
                            : onPinUser(participant.user_id)
                        }
                      >
                        <Pin className={cn("w-3.5 h-3.5", participant.is_pinned_by_me && "fill-current")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onAddFriend(participant.user_id)}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {sortedParticipants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No participants found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParticipantSidebar;
