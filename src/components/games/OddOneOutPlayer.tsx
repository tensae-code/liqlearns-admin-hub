import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface OddOneOutPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const OddOneOutPlayer = ({ config, onComplete }: OddOneOutPlayerProps) => {
  const rounds = config.oddOneOutRounds || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  if (rounds.length === 0) return <p className="text-center text-muted-foreground py-8">No rounds configured.</p>;

  const current = rounds[currentIndex];
  const isAnswered = selected !== null;
  const isCorrect = selected === current.oddId;

  const handleSelect = (id: string) => {
    if (isAnswered) return;
    setSelected(id);
    if (id === current.oddId) {
      setScore(s => s + 1);
    }
  };

  const nextRound = () => {
    const next = currentIndex + 1;
    if (next < rounds.length) {
      setCurrentIndex(next);
      setSelected(null);
    } else {
      onComplete?.(score, rounds.length);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
  };

  const allDone = isAnswered && currentIndex === rounds.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Round {currentIndex + 1}/{rounds.length} • Score: <span className="font-bold text-foreground">{score}</span>
        </p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Question */}
      <p className="text-center text-sm font-medium text-foreground">
        {current.question || 'Which one doesn\'t belong?'}
      </p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {current.items.map(item => {
          const isOdd = item.id === current.oddId;
          const isThis = selected === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={cn(
                'p-4 rounded-xl border-2 text-center font-medium transition-all min-h-[72px] flex items-center justify-center',
                isAnswered
                  ? isOdd
                    ? 'bg-success/10 border-success text-success'
                    : isThis
                      ? 'bg-destructive/10 border-destructive text-destructive'
                      : 'bg-muted/30 border-border text-muted-foreground'
                  : 'bg-card border-border hover:border-primary/40 text-foreground'
              )}
              whileTap={!isAnswered ? { scale: 0.95 } : {}}
            >
              {item.text}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      {isAnswered && current.explanation && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-muted-foreground"
        >
          💡 {current.explanation}
        </motion.p>
      )}

      {/* Result */}
      {isAnswered && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className={cn('font-bold', isCorrect ? 'text-success' : 'text-destructive')}>
            {isCorrect ? '✅ Correct!' : '❌ Wrong!'}
          </p>
          {allDone ? (
            <div className="mt-3">
              {score === rounds.length && <Trophy className="w-8 h-8 text-success mx-auto mb-2" />}
              <p className="text-sm text-muted-foreground">{score}/{rounds.length} correct</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-1" /> Play Again
              </Button>
            </div>
          ) : (
            <Button size="sm" className="mt-3" onClick={nextRound}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default OddOneOutPlayer;
