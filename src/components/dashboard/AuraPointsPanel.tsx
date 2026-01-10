import { motion } from 'framer-motion';
import { Sparkles, Lock, Unlock, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AuraPointsPanelProps {
  auraPoints: number;
  level: number;
  nextLevelPoints: number;
}

const AuraPointsPanel = ({ auraPoints = 2450, level = 5, nextLevelPoints = 3000 }: AuraPointsPanelProps) => {
  const progress = (auraPoints / nextLevelPoints) * 100;
  const pointsToNext = nextLevelPoints - auraPoints;

  const unlockedRewards = [
    { name: 'Basic Games', unlocked: true, level: 1 },
    { name: 'Flashcards', unlocked: true, level: 2 },
    { name: 'Audio Lessons', unlocked: true, level: 3 },
    { name: 'Video Content', unlocked: true, level: 4 },
    { name: 'Live Sessions', unlocked: true, level: 5 },
    { name: 'AI Coach Pro', unlocked: false, level: 6 },
    { name: 'Storefront Access', unlocked: false, level: 7 },
  ];

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">Aura Points</h2>
            <p className="text-xs text-muted-foreground">Level {level} Learner</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-accent">
          View All <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Aura Display */}
      <div className="flex items-center justify-center py-4 mb-4">
        <motion.div
          className="relative"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center shadow-gold">
              <div className="text-center">
                <Star className="w-5 h-5 text-white mx-auto mb-0.5" />
                <span className="text-xl font-display font-bold text-white">{auraPoints.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs font-bold text-white">{level}</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Progress to next level */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress to Level {level + 1}</span>
          <span className="font-medium text-gold">{pointsToNext} pts to go</span>
        </div>
        <Progress value={progress} className="h-3 bg-muted" />
      </div>

      {/* Unlockable Rewards */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground mb-2">Rewards</h4>
        <div className="grid grid-cols-2 gap-2">
          {unlockedRewards.slice(0, 6).map((reward, i) => (
            <div
              key={reward.name}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg text-xs',
                reward.unlocked
                  ? 'bg-success/10 border border-success/20'
                  : 'bg-muted/50 border border-border'
              )}
            >
              {reward.unlocked ? (
                <Unlock className="w-3.5 h-3.5 text-success" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={reward.unlocked ? 'text-success' : 'text-muted-foreground'}>
                {reward.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AuraPointsPanel;
