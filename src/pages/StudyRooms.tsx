import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Users,
  Video,
  Plus,
  Clock,
  Star,
  Lock,
  Unlock,
  Mic,
  MicOff,
  MessageSquare
} from 'lucide-react';
import QuickAccessButton from '@/components/quick-access/QuickAccessButton';

const studyRooms = [
  {
    id: 1,
    name: 'Amharic Beginners Circle',
    host: 'Sara M.',
    participants: 8,
    maxParticipants: 12,
    topic: 'Fidel Practice',
    isLive: true,
    isPrivate: false,
    level: 'Beginner',
    xpBonus: 40,
  },
  {
    id: 2,
    name: 'Advanced Grammar Workshop',
    host: 'Daniel K.',
    participants: 5,
    maxParticipants: 8,
    topic: 'Sentence Structure',
    isLive: true,
    isPrivate: false,
    level: 'Advanced',
    xpBonus: 60,
  },
  {
    id: 3,
    name: 'Cultural Exchange Hub',
    host: 'Meron A.',
    participants: 15,
    maxParticipants: 20,
    topic: 'Ethiopian Holidays',
    isLive: true,
    isPrivate: false,
    level: 'All Levels',
    xpBonus: 35,
  },
  {
    id: 4,
    name: 'Kids Learning Room',
    host: 'Teacher Hana',
    participants: 6,
    maxParticipants: 10,
    topic: 'Fun with Fidel',
    isLive: true,
    isPrivate: true,
    level: 'Beginner',
    xpBonus: 30,
  },
  {
    id: 5,
    name: 'Pronunciation Practice',
    host: 'Yonas T.',
    participants: 4,
    maxParticipants: 6,
    topic: 'Speaking Exercises',
    isLive: false,
    scheduledFor: '3:00 PM',
    isPrivate: false,
    level: 'Intermediate',
    xpBonus: 50,
  },
  {
    id: 6,
    name: 'Business Amharic',
    host: 'Tigist B.',
    participants: 0,
    maxParticipants: 8,
    topic: 'Professional Vocabulary',
    isLive: false,
    scheduledFor: '5:30 PM',
    isPrivate: false,
    level: 'Advanced',
    xpBonus: 55,
  },
];

const myRooms = [
  { id: 101, name: 'My Study Group', participants: 3, lastActive: '2 hours ago' },
];

const StudyRooms = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all');

  const filteredRooms = studyRooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'live' && room.isLive) ||
                         (filter === 'scheduled' && !room.isLive);
    return matchesSearch && matchesFilter;
  });

  const liveCount = studyRooms.filter(r => r.isLive).length;
  const totalParticipants = studyRooms.filter(r => r.isLive).reduce((sum, r) => sum + r.participants, 0);

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
          <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90">
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
              <p className="text-primary-foreground/70">Live Rooms</p>
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
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Rooms' },
            { id: 'live', label: 'Live Now' },
            { id: 'scheduled', label: 'Scheduled' },
          ].map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? 'default' : 'outline'}
              className={filter === f.id ? 'bg-gradient-accent text-accent-foreground' : ''}
              onClick={() => setFilter(f.id as typeof filter)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* My Rooms */}
      {myRooms.length > 0 && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">My Rooms</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-xl bg-card border border-border hover:border-accent/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">{room.name}</h3>
                  <Badge variant="outline">{room.participants} members</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Last active: {room.lastActive}</p>
                <Button size="sm" className="w-full mt-3">
                  <Video className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Study Rooms Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Available Rooms</h2>
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
                    {room.isLive ? (
                      <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                        🔴 Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        {room.scheduledFor}
                      </Badge>
                    )}
                    {room.isPrivate ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Unlock className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors">
                    {room.name}
                  </h3>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {room.level}
                </Badge>
              </div>

              {/* Topic */}
              <p className="text-sm text-muted-foreground mb-3">
                📝 {room.topic}
              </p>

              {/* Host & Participants */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                      {room.host.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{room.host}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{room.participants}/{room.maxParticipants}</span>
                </div>
              </div>

              {/* Participants Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all"
                  style={{ width: `${(room.participants / room.maxParticipants) * 100}%` }}
                />
              </div>

              {/* Action */}
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-gold">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  +{room.xpBonus} XP
                </Badge>
                <Button 
                  size="sm" 
                  className="bg-gradient-accent text-accent-foreground hover:opacity-90"
                  disabled={room.participants >= room.maxParticipants}
                >
                  {room.isLive ? 'Join Now' : 'Notify Me'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">No rooms found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or create your own room</p>
          <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create Room
          </Button>
        </div>
      )}

      {/* Quick Access Button */}
      <QuickAccessButton />
    </DashboardLayout>
  );
};

export default StudyRooms;
