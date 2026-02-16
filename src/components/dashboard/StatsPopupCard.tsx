import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Flame, Star, Award, Trophy, Target, TrendingUp, Gift, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StatsPopupCardProps {
  type: 'streak' | 'xp' | 'badges' | 'aura';
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
  const renderStreakContent = () => (
    <div className="space-y-4">
      {/* Current Streak */}
      <div className="text-center">
        <motion.div
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-streak to-orange-500 flex items-center justify-center mb-3"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame className="w-12 h-12 text-white" />
        </motion.div>
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
        <motion.div
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center mb-3"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Star className="w-12 h-12 text-white" />
        </motion.div>
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
          <motion.div 
            className="h-full bg-gradient-to-r from-gold to-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '82%' }}
            transition={{ duration: 1, delay: 0.3 }}
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

  const renderBadgesContent = () => {
    const badgeCategories = [
      {
        label: 'Personal',
        color: 'from-pink-500 to-rose-400',
        borderColor: 'border-pink-400/30',
        bgColor: 'bg-pink-500/10',
        badges: [
          { name: 'Early Bird', icon: '🌅', earned: true, level: 3 },
          { name: 'Dedicated', icon: '⏰', earned: true, level: 2 },
        ],
      },
      {
        label: 'Skills',
        color: 'from-blue-500 to-cyan-400',
        borderColor: 'border-blue-400/30',
        bgColor: 'bg-blue-500/10',
        badges: [
          { name: 'Streak Master', icon: '🔥', earned: true, level: 5 },
          { name: 'Skill Seeker', icon: '🧠', earned: false, level: 0 },
        ],
      },
      {
        label: 'Courses',
        color: 'from-emerald-500 to-teal-400',
        borderColor: 'border-emerald-400/30',
        bgColor: 'bg-emerald-500/10',
        badges: [
          { name: 'Quiz Ace', icon: '🎯', earned: true, level: 2 },
          { name: 'Bookworm', icon: '📚', earned: true, level: 4 },
        ],
      },
    ];

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-500 via-violet-500 to-emerald-500 flex items-center justify-center mb-3">
            <Award className="w-10 h-10 text-white" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">5 Badges</p>
          <p className="text-muted-foreground">Earned</p>
        </div>

        {badgeCategories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${cat.color}`} />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cat.badges.map((badge, i) => (
                <motion.div
                  key={i}
                  className={`relative p-3 rounded-xl text-center transition-all ${
                    badge.earned
                      ? `${cat.bgColor} border ${cat.borderColor}`
                      : 'bg-muted/30 opacity-50 border border-border'
                  }`}
                  whileHover={badge.earned ? { scale: 1.05 } : {}}
                >
                  {badge.earned && (
                    <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-gold text-[10px] font-bold text-white shadow-sm">
                      Lv.{badge.level}
                    </div>
                  )}
                  <span className="text-2xl block">{badge.icon}</span>
                  <p className="text-[11px] font-medium text-foreground mt-1 truncate">{badge.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full" size="sm">
          View All Badges
        </Button>
      </div>
    );
  };

  const renderAuraContent = () => (
    <div className="space-y-4">
      {/* Aura Display */}
      <div className="text-center">
        <motion.div
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>
        <p className="text-4xl font-display font-bold text-violet-600">{(data.xpPoints || 0).toLocaleString()}</p>
        <p className="text-muted-foreground">Aura Points</p>
      </div>

      {/* Aura Breakdown */}
      <div className="p-4 rounded-xl bg-muted/50">
        <p className="text-sm font-medium text-foreground mb-3">How to earn Aura</p>
        <div className="space-y-2">
          {[
            { action: 'Complete a lesson', aura: 10, icon: '📚' },
            { action: 'Daily streak bonus', aura: 25, icon: '🔥' },
            { action: 'Help a friend', aura: 50, icon: '🤝' },
            { action: 'Win a challenge', aura: 100, icon: '🏆' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="text-sm text-foreground">{item.action}</span>
              </div>
              <span className="text-sm font-medium text-violet-600">+{item.aura}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aura Perks */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-600/10 border border-violet-500/20">
        <p className="text-xs text-foreground">✨ High aura unlocks exclusive badges and clan perks!</p>
      </div>
    </div>
  );

  const getTitle = () => {
    switch (type) {
      case 'streak': return 'Your Streak';
      case 'xp': return 'Your XP';
      case 'badges': return 'Your Badges';
      case 'aura': return 'Your Aura';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'streak': return 'from-streak to-orange-500';
      case 'xp': return 'from-gold to-amber-500';
      case 'badges': return 'from-purple-500 to-pink-500';
      case 'aura': return 'from-violet-500 to-purple-600';
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={onClose}
          />

          {/* Card */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm pointer-events-auto"
            >
              <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
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

                <div className="p-4 overflow-y-auto">
                  {type === 'streak' && renderStreakContent()}
                  {type === 'xp' && renderXPContent()}
                  {type === 'badges' && renderBadgesContent()}
                  {type === 'aura' && renderAuraContent()}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default StatsPopupCard;
