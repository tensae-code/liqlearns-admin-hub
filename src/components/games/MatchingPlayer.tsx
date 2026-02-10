import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, Check } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface MatchingPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const MatchingPlayer = ({ config, onComplete }: MatchingPlayerProps) => {
  const pairs = config.matchPairs || [];
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [shuffledRight, setShuffledRight] = useState(() =>
    [...pairs].sort(() => Math.random() - 0.5)
  );

  const handleLeftClick = (id: string) => {
    if (matched.has(id)) return;
    setSelectedLeft(id);
    setWrong(null);
  };

  const handleRightClick = (rightId: string) => {
    if (!selectedLeft) return;
    const pair = pairs.find(p => p.id === selectedLeft);
    if (pair && pair.id === rightId) {
      const newMatched = new Set(matched);
      newMatched.add(rightId);
      setMatched(newMatched);
      setSelectedLeft(null);
      if (newMatched.size === pairs.length) {
        onComplete?.(pairs.length, pairs.length);
      }
    } else {
      setWrong(rightId);
      setTimeout(() => setWrong(null), 600);
    }
  };

  const reset = () => {
    setMatched(new Set());
    setSelectedLeft(null);
    setWrong(null);
    setShuffledRight([...pairs].sort(() => Math.random() - 0.5));
  };

  const isComplete = matched.size === pairs.length && pairs.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Matched: <span className="font-bold text-foreground">{matched.size}/{pairs.length}</span></p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map(pair => (
            <motion.button
              key={`l-${pair.id}`}
              onClick={() => handleLeftClick(pair.id)}
              className={cn(
                'w-full p-3 rounded-lg border-2 text-sm font-medium text-left transition-all',
                matched.has(pair.id)
                  ? 'bg-success/10 border-success/40 text-success line-through opacity-60'
                  : selectedLeft === pair.id
                    ? 'bg-primary/10 border-primary text-foreground ring-2 ring-primary/20'
                    : 'bg-card border-border hover:border-primary/40 text-foreground'
              )}
              whileTap={{ scale: 0.97 }}
            >
              {pair.left}
            </motion.button>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map(pair => (
            <motion.button
              key={`r-${pair.id}`}
              onClick={() => handleRightClick(pair.id)}
              className={cn(
                'w-full p-3 rounded-lg border-2 text-sm font-medium text-left transition-all',
                matched.has(pair.id)
                  ? 'bg-success/10 border-success/40 text-success line-through opacity-60'
                  : wrong === pair.id
                    ? 'bg-destructive/10 border-destructive text-destructive'
                    : 'bg-card border-border hover:border-primary/40 text-foreground'
              )}
              whileTap={{ scale: 0.97 }}
              animate={wrong === pair.id ? { x: [0, -4, 4, -4, 0] } : {}}
            >
              {pair.right}
            </motion.button>
          ))}
        </div>
      </div>

      {isComplete && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl">
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">All Matched! 🎉</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default MatchingPlayer;
