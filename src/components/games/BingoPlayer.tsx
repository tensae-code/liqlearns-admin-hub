import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, RotateCcw, Trophy, Volume2, X, Pause, Play } from 'lucide-react';
import type { GameConfig, GameItem } from '@/lib/gameTypes';
import { toast } from 'sonner';

interface BingoPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const BingoPlayer = ({ config, onComplete }: BingoPlayerProps) => {
  const gridSize = config.gridSize || 3;
  const items = config.items || [];
  const totalCells = gridSize * gridSize;

  const [gridItems, setGridItems] = useState<GameItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentCall, setCurrentCall] = useState<GameItem | null>(null);
  const [callIndex, setCallIndex] = useState(0);
  const [callOrder, setCallOrder] = useState<GameItem[]>([]);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongCell, setWrongCell] = useState<string | null>(null);
  const [isAutoCalling, setIsAutoCalling] = useState(true);
  const [callHighlight, setCallHighlight] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shuffle and fill grid
  useEffect(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const grid = shuffled.slice(0, totalCells);
    while (grid.length < totalCells) {
      grid.push({ id: `pad-${grid.length}`, text: '⭐' });
    }
    setGridItems(grid.sort(() => Math.random() - 0.5));
    setCallOrder(shuffled.sort(() => Math.random() - 0.5));
    setCallIndex(0);
    setSelected(new Set());
    setCompleted(false);
    setScore(0);
  }, [items, totalCells]);

  // Set current call & animate
  useEffect(() => {
    if (callOrder.length > 0 && callIndex < callOrder.length) {
      setCurrentCall(callOrder[callIndex]);
      setCallHighlight(true);
      const t = setTimeout(() => setCallHighlight(false), 600);
      return () => clearTimeout(t);
    }
  }, [callIndex, callOrder]);

  // Auto-call timer
  useEffect(() => {
    if (!isAutoCalling || completed || callOrder.length === 0) return;
    timerRef.current = setTimeout(() => {
      if (callIndex < callOrder.length - 1) {
        setCallIndex(i => i + 1);
      } else {
        setIsAutoCalling(false);
      }
    }, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [callIndex, isAutoCalling, completed, callOrder.length]);

  const handleCellClick = (item: GameItem) => {
    if (completed || selected.has(item.id)) return;
    
    if (currentCall && item.text === currentCall.text) {
      // Correct!
      const newSelected = new Set(selected);
      newSelected.add(item.id);
      setSelected(newSelected);
      setScore(s => s + 1);
      toast.success('Correct! ✓', { duration: 1000 });

      // Check for bingo
      const grid2D: string[][] = [];
      for (let r = 0; r < gridSize; r++) {
        grid2D.push(gridItems.slice(r * gridSize, (r + 1) * gridSize).map(i => i.id));
      }
      const checkLine = (ids: string[]) => ids.every(id => newSelected.has(id));
      let hasBingo = false;
      for (let i = 0; i < gridSize; i++) {
        if (checkLine(grid2D[i])) hasBingo = true;
        if (checkLine(grid2D.map(row => row[i]))) hasBingo = true;
      }
      if (checkLine(grid2D.map((row, i) => row[i]))) hasBingo = true;
      if (checkLine(grid2D.map((row, i) => row[gridSize - 1 - i]))) hasBingo = true;

      if (hasBingo) {
        setCompleted(true);
        setIsAutoCalling(false);
        onComplete?.(newSelected.size, totalCells);
      } else {
        // Advance to next call immediately on correct match
        if (timerRef.current) clearTimeout(timerRef.current);
        if (callIndex < callOrder.length - 1) {
          setCallIndex(i => i + 1);
        }
      }
    } else {
      // Wrong!
      setWrongCell(item.id);
      toast.error('Wrong! Look for: ' + (currentCall?.text || ''), { duration: 1500 });
      setTimeout(() => setWrongCell(null), 800);
    }
  };

  const nextCall = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (callIndex < callOrder.length - 1) {
      setCallIndex(i => i + 1);
    }
  };

  const reset = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const grid = shuffled.slice(0, totalCells);
    while (grid.length < totalCells) {
      grid.push({ id: `pad-${grid.length}`, text: '⭐' });
    }
    setGridItems(grid.sort(() => Math.random() - 0.5));
    setCallOrder(shuffled.sort(() => Math.random() - 0.5));
    setCallIndex(0);
    setSelected(new Set());
    setCompleted(false);
    setScore(0);
    setIsAutoCalling(true);
  };

  return (
    <div className="space-y-4">
      {/* Current call */}
      <motion.div 
        className="text-center p-4 bg-primary/10 border border-primary/30 rounded-xl"
        animate={callHighlight ? { scale: [1, 1.03, 1], borderColor: ['hsl(var(--primary) / 0.3)', 'hsl(var(--primary))', 'hsl(var(--primary) / 0.3)'] } : {}}
        transition={{ duration: 0.6 }}
      >
        <p className="text-xs text-muted-foreground mb-1">🔊 Find this on your card:</p>
        <motion.p
          key={callIndex}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground"
        >
          {currentCall?.text || '...'}
        </motion.p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">Call {callIndex + 1}/{callOrder.length}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setIsAutoCalling(!isAutoCalling)} disabled={completed}>
            {isAutoCalling ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isAutoCalling ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="ghost" size="sm" onClick={nextCall} disabled={completed}>Skip →</Button>
        </div>
        {isAutoCalling && !completed && (
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              key={callIndex}
              className="h-full bg-primary rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
            />
          </div>
        )}
      </motion.div>

      {/* Bingo grid */}
      <div
        className="grid gap-2 mx-auto max-w-xs"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {gridItems.map((item) => (
          <motion.button
            key={item.id}
            className={cn(
              'aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all',
              selected.has(item.id)
                ? 'bg-primary text-primary-foreground border-primary scale-95'
                : wrongCell === item.id
                  ? 'bg-destructive/20 border-destructive text-destructive'
                  : 'bg-card border-border hover:border-primary/50 text-foreground'
            )}
            whileTap={{ scale: 0.9 }}
            animate={wrongCell === item.id ? { x: [0, -4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            onClick={() => handleCellClick(item)}
          >
            {selected.has(item.id) ? <Check className="w-5 h-5" /> : item.text}
          </motion.button>
        ))}
      </div>

      {/* Completion */}
      {completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl"
        >
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">BINGO! 🎉</p>
          <p className="text-sm text-muted-foreground">You matched {score} items</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default BingoPlayer;
