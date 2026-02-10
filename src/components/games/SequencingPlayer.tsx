import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, ArrowDown, Check, X } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface SequencingPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const SequencingPlayer = ({ config, onComplete }: SequencingPlayerProps) => {
  const items = config.sequenceItems || [];
  const [shuffled, setShuffled] = useState(() =>
    [...items].sort(() => Math.random() - 0.5)
  );
  const [order, setOrder] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const handleItemClick = (id: string) => {
    if (checked) return;
    if (order.includes(id)) {
      setOrder(prev => prev.filter(i => i !== id));
    } else {
      setOrder(prev => [...prev, id]);
    }
  };

  const checkOrder = () => {
    setChecked(true);
    const correct = items.sort((a, b) => a.correctOrder - b.correctOrder);
    const score = order.reduce((s, id, idx) => {
      return correct[idx]?.id === id ? s + 1 : s;
    }, 0);
    onComplete?.(score, items.length);
  };

  const reset = () => {
    setShuffled([...items].sort(() => Math.random() - 0.5));
    setOrder([]);
    setChecked(false);
  };

  const correctOrder = [...items].sort((a, b) => a.correctOrder - b.correctOrder);
  const score = checked ? order.reduce((s, id, idx) => correctOrder[idx]?.id === id ? s + 1 : s, 0) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {checked ? `Score: ${score}/${items.length}` : `Selected: ${order.length}/${items.length}`}
        </p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Available items */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Tap items in the correct order:</p>
        <div className="flex flex-wrap gap-2">
          {shuffled.map(item => {
            const idx = order.indexOf(item.id);
            const isSelected = idx !== -1;
            const isCorrect = checked && isSelected && correctOrder[idx]?.id === item.id;
            const isWrong = checked && isSelected && correctOrder[idx]?.id !== item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all relative',
                  isCorrect ? 'bg-success/10 border-success text-success' :
                  isWrong ? 'bg-destructive/10 border-destructive text-destructive' :
                  isSelected ? 'bg-primary/10 border-primary text-foreground' :
                  'bg-card border-border hover:border-primary/40 text-foreground'
                )}
                whileTap={!checked ? { scale: 0.95 } : {}}
              >
                {isSelected && (
                  <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                )}
                {item.text}
              </motion.button>
            );
          })}
        </div>
      </div>

      {!checked && order.length === items.length && (
        <Button onClick={checkOrder} className="w-full">
          Check Order
        </Button>
      )}

      {checked && score === items.length && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl">
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">Perfect Order! 🎉</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </motion.div>
      )}

      {checked && score < items.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center p-4 bg-muted/50 border border-border rounded-xl">
          <p className="font-semibold text-foreground">{score}/{items.length} correct</p>
          <p className="text-xs text-muted-foreground mt-1">Correct order: {correctOrder.map(i => i.text).join(' → ')}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Try Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default SequencingPlayer;
