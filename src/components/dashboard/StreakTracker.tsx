import { motion } from 'framer-motion';
import { Flame, Shield, Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAT_GRADIENTS } from '@/lib/theme';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  weekProgress: boolean[];
  onStreakClick?: () => void;
}

const StreakTracker = ({ 
  currentStreak = 7, 
  longestStreak = 45,
  weekProgress = [true, true, true, true, true, true, false],
  onStreakClick
}: StreakTrackerProps) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const completedDays = weekProgress.filter(Boolean).length;
  const totalStreaks = Math.floor(currentStreak * 1.5); // Estimated total based on history

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:border-streak/50 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onStreakClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-streak to-orange-600 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h2 className="font-display font-semibold text-foreground">Streak Stats</h2>
            <p className="text-xs text-muted-foreground">Tap to see animation</p>
          </div>
        </div>
        <div className="text-right">
          <motion.p
            className="text-3xl font-display font-bold text-streak"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {currentStreak}
          </motion.p>
          <p className="text-xs text-muted-foreground">days</p>
        </div>
      </div>

      {/* Streak Stats Grid - Current, Longest, Total */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={cn('p-2.5 rounded-lg text-center bg-gradient-to-br text-white', STAT_GRADIENTS[3])}>
          <Flame className="w-4 h-4 mx-auto mb-1" />
          <p className="text-lg font-display font-bold">{currentStreak}</p>
          <p className="text-[10px] opacity-80">Current</p>
        </div>
        <div className={cn('p-2.5 rounded-lg text-center bg-gradient-to-br text-white', STAT_GRADIENTS[1])}>
          <Trophy className="w-4 h-4 mx-auto mb-1" />
          <p className="text-lg font-display font-bold">{longestStreak}</p>
          <p className="text-[10px] opacity-80">Longest</p>
        </div>
        <div className={cn('p-2.5 rounded-lg text-center bg-gradient-to-br text-white', STAT_GRADIENTS[0])}>
          <Zap className="w-4 h-4 mx-auto mb-1" />
          <p className="text-lg font-display font-bold">{totalStreaks}</p>
          <p className="text-[10px] opacity-80">Total</p>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-3">This Week</p>
        <div className="flex justify-between gap-2">
          {days.map((day, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <motion.div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center mb-1 transition-all',
                  weekProgress[i]
                    ? 'bg-gradient-to-br from-streak to-orange-600'
                    : 'bg-muted border-2 border-dashed border-muted-foreground/30'
                )}
                whileHover={{ scale: 1.1 }}
              >
                {weekProgress[i] ? (
                  <Flame className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-xs text-muted-foreground">{day}</span>
                )}
              </motion.div>
              <span className={cn(
                'text-xs font-medium',
                weekProgress[i] ? 'text-streak' : 'text-muted-foreground'
              )}>
                {day}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn('p-3 rounded-lg bg-gradient-to-br text-white', STAT_GRADIENTS[2])}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Weekly Goal</span>
          </div>
          <p className="text-lg font-display font-bold">{completedDays}/7</p>
          <p className="text-xs opacity-80">days completed</p>
        </div>
        <div className={cn('p-3 rounded-lg bg-gradient-to-br text-white', STAT_GRADIENTS[1])}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Freeze</span>
          </div>
          <p className="text-lg font-display font-bold">2</p>
          <p className="text-xs opacity-80">streak shields</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StreakTracker;
