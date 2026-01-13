import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, Star, Flame, ChevronRight, X, Users, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { STAT_GRADIENTS } from '@/lib/theme';

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'alltime';

interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  xp: number;
  aura: number;
  streak: number;
  avatar: string;
  badge?: 'gold' | 'silver' | 'bronze';
  id: string;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, id: 'u1', name: 'Alemayehu M.', username: 'alemayehu_m', xp: 15420, aura: 3200, streak: 45, avatar: 'A', badge: 'gold' },
  { rank: 2, id: 'u2', name: 'Sara T.', username: 'sara_t', xp: 14380, aura: 2850, streak: 38, avatar: 'S', badge: 'silver' },
  { rank: 3, id: 'u3', name: 'Dawit B.', username: 'dawit_b', xp: 13750, aura: 2600, streak: 32, avatar: 'D', badge: 'bronze' },
  { rank: 4, id: 'u4', name: 'Tigist K.', username: 'tigist_k', xp: 12890, aura: 2400, streak: 28, avatar: 'T' },
  { rank: 5, id: 'u5', name: 'Yonas G.', username: 'yonas_g', xp: 12340, aura: 2100, streak: 25, avatar: 'Y' },
  { rank: 6, id: 'u6', name: 'Hanna A.', username: 'hanna_a', xp: 11890, aura: 1950, streak: 22, avatar: 'H' },
  { rank: 7, id: 'u7', name: 'Bereket F.', username: 'bereket_f', xp: 11450, aura: 1800, streak: 20, avatar: 'B' },
  { rank: 8, id: 'u8', name: 'Meron L.', username: 'meron_l', xp: 10980, aura: 1650, streak: 18, avatar: 'M' },
];

interface SidebarRankCardProps {
  userRank?: number;
  userXP?: number;
  collapsed?: boolean;
  onProfileClick?: (username: string) => void;
}

const SidebarRankCard = ({ 
  userRank = 42, 
  userXP = 1250, 
  collapsed = false,
  onProfileClick 
}: SidebarRankCardProps) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-4 h-4 text-gold" />;
      case 2: return <Medal className="w-4 h-4 text-muted-foreground" />;
      case 3: return <Medal className="w-4 h-4 text-streak" />;
      default: return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getBadgeStyle = (badge?: 'gold' | 'silver' | 'bronze') => {
    switch (badge) {
      case 'gold': return `bg-gradient-to-r ${STAT_GRADIENTS[3]} text-white`;
      case 'silver': return `bg-gradient-to-r ${STAT_GRADIENTS[0]} text-white`;
      case 'bronze': return `bg-gradient-to-r ${STAT_GRADIENTS[2]} text-white`;
      default: return '';
    }
  };

  const handleUserClick = (entry: LeaderboardEntry) => {
    setSelectedUser(entry);
  };

  const handleViewProfile = () => {
    if (selectedUser) {
      setIsModalOpen(false);
      setSelectedUser(null);
      navigate(`/profile/${selectedUser.username}`);
    }
  };

  const handleFollow = () => {
    toast.success(`Following ${selectedUser?.name}!`);
    setSelectedUser(null);
  };

  const handleAddFriend = () => {
    toast.success(`Friend request sent to ${selectedUser?.name}!`);
    setSelectedUser(null);
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex justify-center p-2 hover:bg-white/10 rounded-lg transition-colors"
        title={`Rank #${userRank}`}
      >
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-gold" />
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Sidebar Rank Display */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-gold" />
          </div>
          <div className="text-left">
            <p className="text-xs text-white/60">Daily Rank</p>
            <p className="text-sm font-bold text-gold">#{userRank}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
      </button>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-card rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col border border-border shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold" />
                    <h2 className="font-display font-bold text-foreground">Leaderboard</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Time Range Tabs */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  {(['daily', 'weekly', 'monthly', 'alltime'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={cn(
                        'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                        timeRange === range
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {range === 'alltime' ? 'All Time' : range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {mockLeaderboard.map((entry, i) => (
                  <motion.button
                    key={entry.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left',
                      getBadgeStyle(entry.badge)
                    )}
                    onClick={() => handleUserClick(entry)}
                  >
                    {/* Rank */}
                    <div className="w-6 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={cn(
                        'text-sm font-semibold',
                        entry.badge === 'gold' ? 'bg-gold/20 text-gold' :
                        entry.badge === 'silver' ? 'bg-muted text-foreground' :
                        entry.badge === 'bronze' ? 'bg-streak/20 text-streak' :
                        'bg-accent/10 text-accent'
                      )}>
                        {entry.avatar}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">@{entry.username}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-gold">
                        <Star className="w-3 h-3" />
                        <span className="font-medium">{entry.xp.toLocaleString()}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 text-streak">
                        <Flame className="w-3 h-3" />
                        <span className="font-medium">{entry.streak}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Current User Position */}
              <div className="p-4 border-t border-border bg-accent/5">
                <div className="flex items-center gap-3">
                  <div className="w-6 flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">#{userRank}</span>
                  </div>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-sm">
                      Y
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">You</p>
                    <p className="text-xs text-muted-foreground">Keep going! Climb the ranks</p>
                  </div>
                  <div className="flex items-center gap-1 text-gold">
                    <Star className="w-3 h-3" />
                    <span className="font-medium text-xs">{userXP.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Action Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              className="bg-card rounded-2xl p-5 max-w-xs w-full border border-border shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className={cn(
                    'text-xl font-semibold',
                    selectedUser.badge === 'gold' ? 'bg-gold/20 text-gold' :
                    selectedUser.badge === 'silver' ? 'bg-muted text-foreground' :
                    selectedUser.badge === 'bronze' ? 'bg-streak/20 text-streak' :
                    'bg-accent/10 text-accent'
                  )}>
                    {selectedUser.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gold flex items-center gap-1">
                      <Star className="w-3 h-3" /> {selectedUser.xp.toLocaleString()} XP
                    </span>
                    <span className="text-xs text-streak flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {selectedUser.streak} day streak
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleViewProfile} className="w-full">
                  View Profile
                </Button>
                <Button onClick={handleFollow} variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" /> Follow
                </Button>
                <Button onClick={handleAddFriend} variant="outline" className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SidebarRankCard;
