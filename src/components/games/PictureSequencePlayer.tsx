import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Images, Check, RotateCcw, Trophy, X, GripVertical } from 'lucide-react';

interface PictureSequencePlayerProps {
  config: {
    sequencePictures?: { id: string; imageUrl?: string; label: string; correctOrder: number }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const PictureSequencePlayer = ({ config, onComplete }: PictureSequencePlayerProps) => {
  const pictures = config.sequencePictures || [];
  const sorted = [...pictures].sort((a, b) => a.correctOrder - b.correctOrder);

  const [userOrder, setUserOrder] = useState<typeof pictures>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setUserOrder([...pictures].sort(() => Math.random() - 0.5));
    setChecked(false);
    setScore(0);
  }, []);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const newOrder = [...userOrder];
    const [dragged] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(idx, 0, dragged);
    setUserOrder(newOrder);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => setDraggedIdx(null);

  const checkAnswer = () => {
    let correct = 0;
    userOrder.forEach((item, idx) => {
      if (item.id === sorted[idx]?.id) correct++;
    });
    setScore(correct);
    setChecked(true);
    onComplete?.(correct, pictures.length);
  };

  const reset = () => {
    setUserOrder([...pictures].sort(() => Math.random() - 0.5));
    setChecked(false);
    setScore(0);
  };

  if (pictures.length === 0) return <p className="text-center text-muted-foreground py-8">No pictures configured</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
        <Images className="w-4 h-4" /> Drag to arrange in the correct order
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {userOrder.map((item, idx) => {
          const isCorrect = checked && item.id === sorted[idx]?.id;
          const isWrong = checked && item.id !== sorted[idx]?.id;
          return (
            <motion.div
              key={item.id}
              className={cn(
                'rounded-xl border-2 overflow-hidden cursor-grab active:cursor-grabbing transition-all',
                isCorrect ? 'border-emerald-500 ring-2 ring-emerald-500/20' :
                isWrong ? 'border-destructive ring-2 ring-destructive/20' :
                draggedIdx === idx ? 'border-primary shadow-lg scale-105' :
                'border-border hover:border-primary/30'
              )}
              draggable={!checked}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              layout
            >
              <div className="relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.label} className="w-full h-20 object-cover" />
                ) : (
                  <div className="w-full h-20 bg-muted/50 flex items-center justify-center">
                    <Images className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </div>
                {checked && (
                  <div className={cn('absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center',
                    isCorrect ? 'bg-emerald-500' : 'bg-destructive'
                  )}>
                    {isCorrect ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                  </div>
                )}
              </div>
              <div className="p-1.5 flex items-center gap-1">
                <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium text-foreground truncate">{item.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-center">
        {!checked ? (
          <Button onClick={checkAnswer} size="sm">
            <Check className="w-4 h-4 mr-1" /> Check Order
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {score === pictures.length ? (
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-bold text-foreground">Perfect! 🎉</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{score}/{pictures.length} correct</span>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PictureSequencePlayer;
