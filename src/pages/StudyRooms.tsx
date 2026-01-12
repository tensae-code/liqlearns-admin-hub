import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useStudyRooms } from '@/hooks/useStudyRooms';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import CreateRoomModal from '@/components/study-rooms/CreateRoomModal';
import JoinRoomModal from '@/components/study-rooms/JoinRoomModal';
import StudyRoomView from '@/components/study-rooms/StudyRoomView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  Video,
  Plus,
  Clock,
  Star,
  Lock,
  Globe,
  Flame,
  GraduationCap,
  MapPin
} from 'lucide-react';
import QuickAccessButton from '@/components/quick-access/QuickAccessButton';

const StudyRooms = () => {
  const {
    rooms,
    loading,
    currentRoom,
    setCurrentRoom,
    participants,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMic,
    updateStudyTitle,
    pinUser,
    unpinUser,
    fetchParticipants,
  } = useStudyRooms();
  
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'public' | 'private' | 'kids'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinModalRoom, setJoinModalRoom] = useState<typeof rooms[0] | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [myStudyTitle, setMyStudyTitle] = useState('');

  // Get unique countries from rooms
  const countries = [...new Set(rooms.map(r => r.country).filter(Boolean))];

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (room.study_topic?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = roomTypeFilter === 'all' || room.room_type === roomTypeFilter;
    const matchesCountry = countryFilter === 'all' || room.country === countryFilter;
    return matchesSearch && matchesType && matchesCountry;
  });

  const liveCount = rooms.length;
  const totalParticipants = rooms.reduce((sum, r) => sum + (r.participant_count || 0), 0);

  // Handle joining a room
  const handleJoinRoom = async (studyTitle: string) => {
    if (!joinModalRoom) return;
    
    const success = await joinRoom(joinModalRoom.id, studyTitle);
    if (success) {
      setCurrentRoom(joinModalRoom);
      setMyStudyTitle(studyTitle);
      await fetchParticipants(joinModalRoom.id);
    }
    setJoinModalRoom(null);
  };

  // Handle leaving room
  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    await leaveRoom(currentRoom.id);
    setCurrentRoom(null);
    setMyStudyTitle('');
    setIsMicOn(false);
  };

  // Handle mic toggle
  const handleToggleMic = () => {
    if (!currentRoom) return;
    const newMicState = !isMicOn;
    setIsMicOn(newMicState);
    toggleMic(currentRoom.id, newMicState);
  };

  // Handle study title update
  const handleUpdateStudyTitle = (title: string) => {
    if (!currentRoom) return;
    setMyStudyTitle(title);
    updateStudyTitle(currentRoom.id, title);
  };

  // Handle pin/unpin
  const handlePinUser = (userId: string) => {
    if (!currentRoom) return;
    pinUser(currentRoom.id, userId);
    fetchParticipants(currentRoom.id);
  };

  const handleUnpinUser = (userId: string) => {
    if (!currentRoom) return;
    unpinUser(currentRoom.id, userId);
    fetchParticipants(currentRoom.id);
  };

  // Handle add friend
  const handleAddFriend = (userId: string) => {
    toast({ title: 'Friend Request', description: 'Friend request sent!' });
  };

  // Handle report
  const handleReport = (userId: string) => {
    toast({ title: 'Report Submitted', description: 'Thank you for reporting. Our team will review this.' });
  };

  // If in a room, show the room view
  if (currentRoom) {
    return (
      <DashboardLayout>
        <StudyRoomView
          room={currentRoom}
          participants={participants}
          currentUserId={profile?.id || ''}
          isMicOn={isMicOn}
          myStudyTitle={myStudyTitle}
          onToggleMic={handleToggleMic}
          onUpdateStudyTitle={handleUpdateStudyTitle}
          onPinUser={handlePinUser}
          onUnpinUser={handleUnpinUser}
          onLeaveRoom={handleLeaveRoom}
          onAddFriend={handleAddFriend}
          onReport={handleReport}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">Study Rooms</h1>
            <p className="text-muted-foreground">Join or create rooms to learn together</p>
          </div>
          <Button 
            className="bg-gradient-accent text-accent-foreground hover:opacity-90"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Room
          </Button>
        </div>
      </motion.div>

      {/* Stats Banner */}
      <motion.div
        className="mb-8 p-6 rounded-2xl bg-gradient-hero text-primary-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-display font-bold">{liveCount}</p>
              <p className="text-primary-foreground/70">Active Rooms</p>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div>
              <p className="text-3xl font-display font-bold">{totalParticipants}</p>
              <p className="text-primary-foreground/70">Learning Now</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-primary-foreground/10 rounded-xl">
            <Video className="w-5 h-5 text-gold" />
            <span className="font-medium">Earn XP by joining study rooms!</span>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search rooms by name or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roomTypeFilter} onValueChange={(v: typeof roomTypeFilter) => setRoomTypeFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Room type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> Public
              </div>
            </SelectItem>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Private
              </div>
            </SelectItem>
            <SelectItem value="kids">
              <div className="flex items-center gap-2">
                🧒 Kids
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {countries.length > 0 && (
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c!}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Study Rooms Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room, i) => (
              <motion.div
                key={room.id}
                className="p-5 rounded-xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                        🔴 Live
                      </Badge>
                      {room.room_type === 'private' ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : room.room_type === 'kids' ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-500">
                          🧒 Kids
                        </Badge>
                      ) : (
                        <Globe className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors">
                      {room.name}
                    </h3>
                  </div>
                  {room.current_streak > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      <Flame className="w-3 h-3 mr-1 text-streak" />
                      {room.current_streak}
                    </Badge>
                  )}
                </div>

                {/* Topic */}
                {room.study_topic && (
                  <p className="text-sm text-muted-foreground mb-3">
                    📝 {room.study_topic}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {room.education_level && (
                    <Badge variant="outline" className="text-xs">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {room.education_level}
                    </Badge>
                  )}
                  {room.country && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {room.country}
                    </Badge>
                  )}
                </div>

                {/* Host & Participants */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={room.host?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                        {room.host?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{room.host?.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{room.participant_count}/{room.max_participants}</span>
                  </div>
                </div>

                {/* Participants Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all"
                    style={{ width: `${((room.participant_count || 0) / room.max_participants) * 100}%` }}
                  />
                </div>

                {/* Action */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-gold">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    +40 XP
                  </Badge>
                  <Button 
                    size="sm" 
                    className="bg-gradient-accent text-accent-foreground hover:opacity-90"
                    disabled={(room.participant_count || 0) >= room.max_participants}
                    onClick={() => setJoinModalRoom(room)}
                  >
                    Join Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">No rooms found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or create your own room</p>
            <Button 
              className="bg-gradient-accent text-accent-foreground hover:opacity-90"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={createRoom}
      />

      {joinModalRoom && (
        <JoinRoomModal
          isOpen={!!joinModalRoom}
          onClose={() => setJoinModalRoom(null)}
          roomName={joinModalRoom.name}
          onJoin={handleJoinRoom}
        />
      )}

      {/* Quick Access Button */}
      <QuickAccessButton />
    </DashboardLayout>
  );
};

export default StudyRooms;
