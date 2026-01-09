import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, Flame, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type TimeRange = 'weekly' | 'monthly' | 'alltime';

interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  xp: number;
  aura: number;
  streak: number;
  avatar: string;
  badge?: 'gold' | 'silver' | 'bronze';
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Alemayehu M.', username: 'alemayehu_m', xp: 15420, aura: 3200, streak: 45, avatar: 'A', badge: 'gold' },
  { rank: 2, name: 'Sara T.', username: 'sara_t', xp: 14380, aura: 2850, streak: 38, avatar: 'S', badge: 'silver' },
  { rank: 3, name: 'Dawit B.', username: 'dawit_b', xp: 13750, aura: 2600, streak: 32, avatar: 'D', badge: 'bronze' },
  { rank: 4, name: 'Tigist K.', username: 'tigist_k', xp: 12890, aura: 2400, streak: 28, avatar: 'T' },
  { rank: 5, name: 'Yonas G.', username: 'yonas_g', xp: 12340, aura: 2100, streak: 25, avatar: 'Y' },
  { rank: 6, name: 'Hanna A.', username: 'hanna_a', xp: 11890, aura: 1950, streak: 22, avatar: 'H' },
  { rank: 7, name: 'Bereket F.', username: 'bereket_f', xp: 11450, aura: 1800, streak: 20, avatar: 'B' },
  { rank: 8, name: 'Meron L.', username: 'meron_l', xp: 10980, aura: 1650, streak: 18, avatar: 'M' },
];

const Leaderboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-gold" />;
      case 2: return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3: return <Medal className="w-5 h-5 text-streak" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getBadgeStyle = (badge?: 'gold' | 'silver' | 'bronze') => {
    switch (badge) {
      case 'gold': return 'ring-2 ring-gold bg-gold/10';
      case 'silver': return 'ring-2 ring-muted-foreground bg-muted';
      case 'bronze': return 'ring-2 ring-streak bg-streak/10';
      default: return '';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <h2 className="font-display font-semibold text-foreground">Leaderboard</h2>
          </div>
          <Button variant="ghost" size="sm">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Time Range Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['weekly', 'monthly', 'alltime'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                timeRange === range
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {range === 'alltime' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-border">
        {mockLeaderboard.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors',
              getBadgeStyle(entry.badge)
            )}
          >
            {/* Rank */}
            <div className="w-8 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarFallback className={cn(
                'font-semibold',
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
              <p className="font-medium text-foreground truncate">{entry.name}</p>
              <p className="text-xs text-muted-foreground">@{entry.username}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-gold">
                <Star className="w-4 h-4" />
                <span className="font-medium">{entry.xp.toLocaleString()}</span>
              </div>
              <div className="hidden md:flex items-center gap-1 text-accent">
                <span className="text-xs">✨</span>
                <span className="font-medium">{entry.aura.toLocaleString()}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-streak">
                <Flame className="w-4 h-4" />
                <span className="font-medium">{entry.streak}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Current User Position */}
      <div className="p-4 border-t border-border bg-accent/5">
        <div className="flex items-center gap-3">
          <div className="w-8 flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">#42</span>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
              Y
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-foreground">You</p>
            <p className="text-xs text-muted-foreground">Keep going! 8 more to level up</p>
          </div>
          <div className="flex items-center gap-1 text-gold">
            <Star className="w-4 h-4" />
            <span className="font-medium">1,250</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
