import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Eye,
  X,
  Flag,
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
  onReport?: (userId: string) => void;
  presentUserIds?: string[]; // Real-time presence
}

// Comprehensive countries list
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Benin', 'Bolivia', 'Bosnia', 'Botswana', 'Brazil', 'Bulgaria', 'Burkina Faso',
  'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Eritrea', 'Estonia', 'Ethiopia',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
  'Latvia', 'Lebanon', 'Liberia', 'Libya', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Mali', 'Malta', 'Mexico', 'Moldova', 'Mongolia', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway',
  'Oman', 'Pakistan', 'Palestine', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'UAE', 'Uganda', 'UK', 'Ukraine', 'Uruguay', 'USA', 'Uzbekistan',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

// Sample study fields
const STUDY_FIELDS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Medicine', 'Engineering', 'Business', 'Economics', 'Law', 'Arts',
  'Music', 'Languages', 'History', 'Psychology', 'Other'
];

const ParticipantSidebar = ({
  participants,
  currentUserId,
  displaySettings,
  onPinUser,
  onUnpinUser,
  onAddFriend,
  onReport,
  presentUserIds = [],
}: ParticipantSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'pinCount'>('default');
  const [selectedProfile, setSelectedProfile] = useState<RoomParticipant | null>(null);

  // Get unique countries from participants and default list
  const participantCountries = [...new Set(participants.map(p => p.profile?.country).filter(Boolean))] as string[];
  const allCountries = [...new Set([...participantCountries, ...COUNTRIES])].sort();

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.study_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === 'all' || p.profile?.country === countryFilter;
    // Field filter can match study_title
    const matchesField = fieldFilter === 'all' || 
      p.study_title?.toLowerCase().includes(fieldFilter.toLowerCase());
    return matchesSearch && matchesCountry && matchesField;
  });

  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    // Current user always at top
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    
    // Pinned by me comes next
    if (a.is_pinned_by_me && !b.is_pinned_by_me) return -1;
    if (!a.is_pinned_by_me && b.is_pinned_by_me) return 1;
    
    // Sort by pin count if selected
    if (sortBy === 'pinCount') {
      return (b.pin_count || 0) - (a.pin_count || 0);
    }
    
    return 0;
  });

  return (
    <>
      <div className="w-80 border-l border-border bg-card flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Participants</h3>
              <Badge variant="secondary" className="text-xs">
                {participants.length}
              </Badge>
            </div>
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

          {/* Filters Row */}
          <div className="flex gap-2">
            {/* Country Filter */}
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <MapPin className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {allCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Field Filter */}
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <BookOpen className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {STUDY_FIELDS.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort by Pin Count */}
          <div className="flex items-center gap-2">
            <Button
              variant={sortBy === 'pinCount' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSortBy(sortBy === 'pinCount' ? 'default' : 'pinCount')}
            >
              <Pin className="w-3 h-3 mr-1" />
              Sort by Pins
            </Button>
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
                    {/* Avatar with presence indicator */}
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Real-time presence indicator */}
                      <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                        (presentUserIds.includes(participant.user_id) || isMe)
                          ? "bg-success"
                          : "bg-muted-foreground"
                      )} />
                      {(participant.is_mic_on) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                          <Mic className="w-2.5 h-2.5 text-accent-foreground" />
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

                    {/* Right Side - View Profile + Pin Count */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Pin count badge next to eye */}
                      {displaySettings.showPinCount && (participant.pin_count || 0) > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          <Pin className="w-2.5 h-2.5 mr-0.5 text-gold fill-gold" />
                          {participant.pin_count}
                        </Badge>
                      )}
                      
                      {/* View Profile Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedProfile(participant)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats Row - Always show enabled stats (even if 0) */}
                  <div className="flex flex-wrap gap-1 mt-2 pl-13">
                    {displaySettings.showXP && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <Zap className="w-2.5 h-2.5 mr-0.5 text-gold" />
                        {participant.profile?.xp_points ?? 0} XP
                      </Badge>
                    )}
                    {displaySettings.showStreak && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <Flame className="w-2.5 h-2.5 mr-0.5 text-streak" />
                        {participant.profile?.current_streak ?? 0} 🔥
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

      {/* Profile Popup Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Participant Profile</DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedProfile.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xl bg-accent text-accent-foreground">
                    {selectedProfile.profile?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedProfile.profile?.full_name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{selectedProfile.profile?.username || 'unknown'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-gold">
                    <Zap className="w-4 h-4" />
                    <span className="font-bold">{selectedProfile.profile?.xp_points || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">XP Points</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-streak">
                    <Flame className="w-4 h-4" />
                    <span className="font-bold">{selectedProfile.profile?.current_streak || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-gold">
                    <Pin className="w-4 h-4" />
                    <span className="font-bold">{selectedProfile.pin_count || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Times Pinned</p>
                </div>
                {selectedProfile.profile?.country && (
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-bold text-sm">{selectedProfile.profile.country}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Country</p>
                  </div>
                )}
              </div>

              {/* Currently Studying */}
              {selectedProfile.study_title && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-xs text-muted-foreground mb-1">Currently studying</p>
                  <p className="font-medium">📚 {selectedProfile.study_title}</p>
                </div>
              )}

              {/* Actions */}
              {selectedProfile.user_id !== currentUserId && (
                <div className="flex gap-2">
                  <Button
                    variant={selectedProfile.is_pinned_by_me ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      selectedProfile.is_pinned_by_me && "bg-gold hover:bg-gold/90 text-gold-foreground"
                    )}
                    onClick={() => {
                      if (selectedProfile.is_pinned_by_me) {
                        onUnpinUser(selectedProfile.user_id);
                      } else {
                        onPinUser(selectedProfile.user_id);
                      }
                      setSelectedProfile(null);
                    }}
                  >
                    <Pin className={cn("w-4 h-4 mr-2", selectedProfile.is_pinned_by_me && "fill-current")} />
                    {selectedProfile.is_pinned_by_me ? 'Unpin' : 'Pin User'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      onAddFriend(selectedProfile.user_id);
                      setSelectedProfile(null);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                </div>
              )}

              {/* Report */}
              {selectedProfile.user_id !== currentUserId && onReport && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    onReport(selectedProfile.user_id);
                    setSelectedProfile(null);
                  }}
                >
                  <Flag className="w-3 h-3 mr-1" />
                  Report User
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ParticipantSidebar;