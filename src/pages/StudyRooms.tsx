import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useStudyRooms } from '@/hooks/useStudyRooms';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import CreateRoomModal from '@/components/study-rooms/CreateRoomModal';
import JoinRoomModal from '@/components/study-rooms/JoinRoomModal';
import StudyRoomView from '@/components/study-rooms/StudyRoomView';
import FloatingStudyRoom from '@/components/study-rooms/FloatingStudyRoom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Star,
  Lock,
  Globe,
  Flame,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Baby,
  Crown,
  MicOff
} from 'lucide-react';
import QuickAccessButton from '@/components/quick-access/QuickAccessButton';
import { supabase } from '@/integrations/supabase/client';

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
  const [ageCategory, setAgeCategory] = useState<'adult' | 'kids'>('adult');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinModalRoom, setJoinModalRoom] = useState<typeof rooms[0] | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [myStudyTitle, setMyStudyTitle] = useState('');
  const [isPopout, setIsPopout] = useState(false);

  // Get unique countries from rooms based on current age category
  const currentRooms = rooms.filter(r => 
    ageCategory === 'kids' ? r.room_type === 'kids' : (r.room_type === 'public' || r.room_type === 'private')
  );
  const countries = [...new Set(currentRooms.map(r => r.country).filter(Boolean))];

  const filteredRooms = currentRooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (room.study_topic?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCountry = countryFilter === 'all' || room.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  // Stats for current category
  const adultRooms = rooms.filter(r => r.room_type === 'public' || r.room_type === 'private');
  const kidsRooms = rooms.filter(r => r.room_type === 'kids');
  const liveCount = filteredRooms.length;
  const totalParticipants = filteredRooms.reduce((sum, r) => sum + (r.participant_count || 0), 0);

  // Handle joining a room
  const handleJoinRoom = async (studyTitle: string) => {
    console.log('handleJoinRoom called', { joinModalRoom, profileId: profile?.id, studyTitle });
    
    if (!joinModalRoom) {
      console.error('No room selected to join');
      toast({ title: 'Error', description: 'No room selected', variant: 'destructive' });
      return;
    }
    
    if (!profile?.id) {
      console.error('No profile ID - user may not be logged in');
      toast({ title: 'Error', description: 'Please log in to join a room', variant: 'destructive' });
      return;
    }
    
    const roomToJoin = joinModalRoom;
    console.log('Attempting to join room:', roomToJoin.id);
    
    const success = await joinRoom(roomToJoin.id, studyTitle);
    console.log('joinRoom result:', success);
    
    if (success) {
      // Set the room first, then fetch participants
      setCurrentRoom(roomToJoin);
      setMyStudyTitle(studyTitle);
      setJoinModalRoom(null);
      
      // Fetch participants after a small delay to ensure DB is updated
      setTimeout(() => {
        fetchParticipants(roomToJoin.id);
      }, 200);
    } else {
      // Close modal even on failure so user can retry
      setJoinModalRoom(null);
    }
  };

  // Handle leaving room
  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    await leaveRoom(currentRoom.id);
    setCurrentRoom(null);
    setMyStudyTitle('');
    setIsMicOn(false);
    setIsPopout(false);
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
  const handleAddFriend = async (userId: string) => {
    if (!profile?.id) {
      toast({ title: 'Error', description: 'Please log in to add friends', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: profile.id,
          addressee_id: userId,
          status: 'pending',
        });

      if (error) throw error;
      toast({ title: 'Friend Request Sent!', description: 'Waiting for them to accept.' });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ title: 'Already Sent', description: 'Friend request already exists.' });
      } else {
        toast({ title: 'Error', description: 'Failed to send friend request.', variant: 'destructive' });
      }
    }
  };

  // Handle report
  const handleReport = (userId: string) => {
    toast({ title: 'Report Submitted', description: 'Thank you for reporting. Our team will review this.' });
  };

  // Handle popout
  const handlePopout = () => {
    setIsPopout(true);
  };

  const handleExpandFromPopout = () => {
    setIsPopout(false);
  };

  // If in a room but NOT in popout mode, show the full room view
  if (currentRoom && !isPopout) {
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
          onPopout={handlePopout}
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

      {/* Age Category Tabs */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={ageCategory} onValueChange={(v) => setAgeCategory(v as 'adult' | 'kids')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-14">
            <TabsTrigger 
              value="adult" 
              className="flex items-center gap-2 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <ShieldCheck className="w-5 h-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">18+ Rooms</span>
                <span className="text-xs opacity-70">{adultRooms.length} active</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="kids" 
              className="flex items-center gap-2 text-base data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              <Baby className="w-5 h-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Under 18</span>
                <span className="text-xs opacity-70">{kidsRooms.length} active</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Stats Banner */}
      <motion.div
        className={`mb-8 p-6 rounded-2xl text-white ${
          ageCategory === 'kids' 
            ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
            : 'bg-gradient-hero'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-display font-bold">{filteredRooms.length}</p>
              <p className="text-white/70">
                {ageCategory === 'kids' ? 'Kids Rooms' : 'Adult Rooms'}
              </p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-display font-bold">
                {filteredRooms.reduce((sum, r) => sum + (r.participant_count || 0), 0)}
              </p>
              <p className="text-white/70">Learning Now</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl">
            {ageCategory === 'kids' ? (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span className="font-medium">Safe & moderated for students under 18</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span className="font-medium">Earn XP by joining study rooms!</span>
              </>
            )}
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
            placeholder={`Search ${ageCategory === 'kids' ? 'kids' : '18+'} rooms...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

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
                className={`p-5 rounded-xl border transition-all group ${
                  room.is_system_room 
                    ? 'bg-gradient-to-br from-accent/10 to-primary/10 border-accent/50 hover:border-accent hover:shadow-xl' 
                    : 'bg-card border-border hover:border-accent/30 hover:shadow-lg'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {room.is_system_room ? (
                        <Badge className="bg-gradient-to-r from-accent to-primary text-white border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Official
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                          🔴 Live
                        </Badge>
                      )}
                      {room.is_always_muted && (
                        <Badge variant="secondary" className="text-muted-foreground">
                          <MicOff className="w-3 h-3 mr-1" />
                          Muted
                        </Badge>
                      )}
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

      {/* Floating Study Room (when in popout mode) */}
      <AnimatePresence>
        {isPopout && currentRoom && (
          <FloatingStudyRoom
            room={currentRoom}
            participants={participants}
            currentUserId={profile?.id || ''}
            isMicOn={isMicOn}
            onToggleMic={handleToggleMic}
            onLeaveRoom={handleLeaveRoom}
            onExpand={handleExpandFromPopout}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default StudyRooms;
