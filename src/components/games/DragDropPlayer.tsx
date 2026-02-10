import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GripVertical, RotateCcw, Trophy, Check, X } from 'lucide-react';
import type { GameConfig, GameItem } from '@/lib/gameTypes';

interface DragDropPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const DragDropPlayer = ({ config, onComplete }: DragDropPlayerProps) => {
  const items = config.items || [];
  const mode = config.mode || 'ordering';
  const targets = config.targets || [];

  const [shuffledItems, setShuffledItems] = useState<GameItem[]>([]);
  const [userOrder, setUserOrder] = useState<GameItem[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
    setUserOrder(shuffled);
    setChecked(false);
    setScore(0);
  }, [items]);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const newOrder = [...userOrder];
    const [dragged] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(idx, 0, dragged);
    setUserOrder(newOrder);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const checkAnswer = () => {
    let correct = 0;
    userOrder.forEach((item, idx) => {
      if (item.id === items[idx]?.id) correct++;
    });
    setScore(correct);
    setChecked(true);
    onComplete?.(correct, items.length);
  };

  const reset = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
    setUserOrder(shuffled);
    setChecked(false);
    setScore(0);
  };

  const isComplete = checked && score === items.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        {mode === 'ordering' ? 'Drag items into the correct order' : 
         mode === 'sentence_building' ? 'Arrange words to build the sentence' :
         'Drag items to sort them'}
      </p>

      <div className="space-y-2">
        {userOrder.map((item, idx) => {
          const isCorrect = checked && item.id === items[idx]?.id;
          const isWrong = checked && item.id !== items[idx]?.id;

          return (
            <motion.div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all',
                isCorrect ? 'bg-success/10 border-success' :
                isWrong ? 'bg-destructive/10 border-destructive' :
                draggedIdx === idx ? 'bg-primary/10 border-primary shadow-lg' :
                'bg-card border-border hover:border-primary/30'
              )}
              draggable={!checked}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">{item.text}</span>
              {checked && (
                isCorrect 
                  ? <Check className="w-4 h-4 text-success shrink-0" />
                  : <X className="w-4 h-4 text-destructive shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-center">
        {!checked ? (
          <Button onClick={checkAnswer}>
            <Check className="w-4 h-4 mr-1" /> Check Answer
          </Button>
        ) : (
          <>
            {isComplete ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-3 bg-success/10 border border-success/30 rounded-xl w-full"
              >
                <Trophy className="w-6 h-6 text-success mx-auto mb-1" />
                <p className="font-bold text-foreground text-sm">Perfect! 🎉</p>
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground">{score}/{items.length} correct</p>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DragDropPlayer;
