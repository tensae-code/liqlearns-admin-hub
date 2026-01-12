import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mic,
  MicOff,
  Pin,
  UserPlus,
  Search,
  Users,
  Zap,
  Flame,
  GraduationCap,
  MapPin,
  BookOpen,
  Filter,
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
  blurBackground: boolean;
}

interface ParticipantSidebarProps {
  participants: RoomParticipant[];
  currentUserId: string;
  displaySettings: DisplaySettings;
  onPinUser: (userId: string) => void;
  onUnpinUser: (userId: string) => void;
  onAddFriend: (userId: string) => void;
}

const ParticipantSidebar = ({
  participants,
  currentUserId,
  displaySettings,
  onPinUser,
  onUnpinUser,
  onAddFriend,
}: ParticipantSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  // Get unique countries from participants
  const countries = [...new Set(participants.map(p => p.profile?.country).filter(Boolean))] as string[];

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.study_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === 'all' || p.profile?.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    if (a.is_pinned_by_me && !b.is_pinned_by_me) return -1;
    if (!a.is_pinned_by_me && b.is_pinned_by_me) return 1;
    return (b.pin_count || 0) - (a.pin_count || 0);
  });

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
        </div>

        {/* Country Filter */}
        <div className="mb-3">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="h-9">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by country" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {country}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <div className="relative shrink-0">
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
                  </div>

                  {/* Right Side - Enabled Stats */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {displaySettings.showPinCount && (participant.pin_count || 0) > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <Pin className="w-2.5 h-2.5 mr-0.5 text-gold" />
                        {participant.pin_count}
                      </Badge>
                    )}
                    {displaySettings.showXP && participant.profile?.xp_points && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <Zap className="w-2.5 h-2.5 mr-0.5 text-gold" />
                        {participant.profile.xp_points}
                      </Badge>
                    )}
                    {displaySettings.showStreak && participant.profile?.current_streak && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <Flame className="w-2.5 h-2.5 mr-0.5 text-streak" />
                        {participant.profile.current_streak}
                      </Badge>
                    )}
                    {displaySettings.showEducation && participant.profile?.education_level && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                        {participant.profile.education_level}
                      </Badge>
                    )}
                    {displaySettings.showCountry && participant.profile?.country && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        {participant.profile.country}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                {!isMe && (
                  <div className="flex items-center gap-1 mt-2 pl-13">
                    <Button
                      variant={participant.is_pinned_by_me ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-7 text-xs",
                        participant.is_pinned_by_me && "bg-gold hover:bg-gold/90 text-gold-foreground"
                      )}
                      onClick={() =>
                        participant.is_pinned_by_me
                          ? onUnpinUser(participant.user_id)
                          : onPinUser(participant.user_id)
                      }
                    >
                      <Pin className={cn("w-3 h-3 mr-1", participant.is_pinned_by_me && "fill-current")} />
                      {participant.is_pinned_by_me ? 'Unpin' : 'Pin'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onAddFriend(participant.user_id)}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Add Friend
                    </Button>
                  </div>
                )}
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
