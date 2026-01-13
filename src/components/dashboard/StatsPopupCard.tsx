import { useState, useEffect } from 'react';
import { X, Flame, Star, Award, Trophy, Gift, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StatsPopupCardProps {
  type: 'streak' | 'xp' | 'badges';
  isOpen: boolean;
  onClose: () => void;
  data: {
    currentStreak?: number;
    longestStreak?: number;
    xpPoints?: number;
    level?: number;
    badges?: Array<{ name: string; icon: string; earned: boolean }>;
  };
}

const StatsPopupCard = ({ type, isOpen, onClose, data }: StatsPopupCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Small delay for mount animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const renderStreakContent = () => (
    <div className="space-y-4">
      {/* Current Streak */}
      <div className="text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-streak to-orange-500 flex items-center justify-center mb-3 animate-pulse">
          <Flame className="w-12 h-12 text-white" />
        </div>
        <p className="text-4xl font-display font-bold text-streak">{data.currentStreak || 0}</p>
        <p className="text-muted-foreground">Day Streak</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{data.longestStreak || 0}</p>
          <p className="text-xs text-muted-foreground">Longest Streak</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <Shield className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">3</p>
          <p className="text-xs text-muted-foreground">Streak Shields</p>
        </div>
      </div>

      {/* Week Progress */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-streak/10 to-orange-500/10 border border-streak/20">
        <p className="text-sm font-medium text-foreground mb-2">This Week</p>
        <div className="flex justify-between">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i < 6 ? 'bg-streak text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {i < 6 ? <Flame className="w-4 h-4" /> : day}
              </div>
              <span className="text-[10px] text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full bg-gradient-to-r from-streak to-orange-500 text-white">
        <Gift className="w-4 h-4 mr-2" />
        Claim Streak Bonus
      </Button>
    </div>
  );

  const renderXPContent = () => (
    <div className="space-y-4">
      {/* XP Display */}
      <div className="text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center mb-3">
          <Star className="w-12 h-12 text-white" />
        </div>
        <p className="text-4xl font-display font-bold text-gold">{(data.xpPoints || 0).toLocaleString()}</p>
        <p className="text-muted-foreground">Total XP</p>
      </div>

      {/* Level Progress */}
      <div className="p-4 rounded-xl bg-muted/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Level {data.level || 5}</span>
          <span className="text-xs text-muted-foreground">2,450 / 3,000 XP</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gold to-amber-500 rounded-full transition-all duration-700"
            style={{ width: isVisible ? '82%' : '0%' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">550 XP to Level {(data.level || 5) + 1}</p>
      </div>

      {/* XP Breakdown */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Recent XP</p>
        {[
          { source: 'Daily Quiz', xp: 50, icon: '📝' },
          { source: 'Video Lesson', xp: 30, icon: '🎬' },
          { source: 'Study Room', xp: 40, icon: '👥' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-sm text-foreground">{item.source}</span>
            </div>
            <span className="text-sm font-medium text-gold">+{item.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBadgesContent = () => (
    <div className="space-y-4">
      {/* Badges Header */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
          <Award className="w-10 h-10 text-white" />
        </div>
        <p className="text-2xl font-display font-bold text-foreground">5 Badges</p>
        <p className="text-muted-foreground">Earned</p>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { name: 'Early Bird', icon: '🌅', earned: true },
          { name: 'Streak Master', icon: '🔥', earned: true },
          { name: 'Quiz Ace', icon: '🎯', earned: true },
          { name: 'Bookworm', icon: '📚', earned: true },
          { name: 'Social Star', icon: '⭐', earned: true },
          { name: 'Night Owl', icon: '🦉', earned: false },
          { name: 'Speed Reader', icon: '⚡', earned: false },
          { name: 'Chef', icon: '👨‍🍳', earned: false },
          { name: 'Coder', icon: '💻', earned: false },
        ].map((badge, i) => (
          <div
            key={i}
            className={cn(
              'p-3 rounded-xl text-center transition-transform hover:scale-105',
              badge.earned 
                ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20' 
                : 'bg-muted/30 opacity-50'
            )}
          >
            <span className="text-2xl">{badge.icon}</span>
            <p className="text-xs font-medium text-foreground mt-1 truncate">{badge.name}</p>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full">
        View All Badges
      </Button>
    </div>
  );

  const getTitle = () => {
    switch (type) {
      case 'streak': return 'Your Streak';
      case 'xp': return 'Your XP';
      case 'badges': return 'Your Badges';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'streak': return 'from-streak to-orange-500';
      case 'xp': return 'from-gold to-amber-500';
      case 'badges': return 'from-purple-500 to-pink-500';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Card - properly centered */}
      <div
        className={cn(
          "fixed z-50 w-[90%] max-w-sm transition-all duration-200 ease-out",
          "top-1/2 left-1/2",
          isVisible 
            ? "opacity-100 translate-x-[-50%] translate-y-[-50%] scale-100" 
            : "opacity-0 translate-x-[-50%] translate-y-[-45%] scale-95"
        )}
      >
        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-4 bg-gradient-to-r ${getGradient()} text-white flex items-center justify-between`}>
            <h3 className="text-lg font-display font-semibold">{getTitle()}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {type === 'streak' && renderStreakContent()}
            {type === 'xp' && renderXPContent()}
            {type === 'badges' && renderBadgesContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default StatsPopupCard;
