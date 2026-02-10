import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, RotateCcw, Trophy, Volume2 } from 'lucide-react';
import type { GameConfig, GameItem } from '@/lib/gameTypes';

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

  // Shuffle and fill grid
  useEffect(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const grid = shuffled.slice(0, totalCells);
    // Pad if not enough items
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

  useEffect(() => {
    if (callOrder.length > 0 && callIndex < callOrder.length) {
      setCurrentCall(callOrder[callIndex]);
    }
  }, [callIndex, callOrder]);

  const handleCellClick = (item: GameItem) => {
    if (completed) return;
    if (currentCall && item.text === currentCall.text) {
      const newSelected = new Set(selected);
      newSelected.add(item.id);
      setSelected(newSelected);
      setScore(s => s + 1);

      // Check for bingo (full row, column, or diagonal)
      const grid2D: string[][] = [];
      for (let r = 0; r < gridSize; r++) {
        grid2D.push(gridItems.slice(r * gridSize, (r + 1) * gridSize).map(i => i.id));
      }

      const checkLine = (ids: string[]) => ids.every(id => newSelected.has(id));
      let hasBingo = false;

      // Rows & cols
      for (let i = 0; i < gridSize; i++) {
        if (checkLine(grid2D[i])) hasBingo = true;
        if (checkLine(grid2D.map(row => row[i]))) hasBingo = true;
      }
      // Diagonals
      if (checkLine(grid2D.map((row, i) => row[i]))) hasBingo = true;
      if (checkLine(grid2D.map((row, i) => row[gridSize - 1 - i]))) hasBingo = true;

      if (hasBingo) {
        setCompleted(true);
        onComplete?.(newSelected.size, totalCells);
      } else if (callIndex < callOrder.length - 1) {
        setCallIndex(i => i + 1);
      }
    }
  };

  const nextCall = () => {
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
  };

  return (
    <div className="space-y-4">
      {/* Current call */}
      <div className="text-center p-4 bg-primary/10 border border-primary/30 rounded-xl">
        <p className="text-xs text-muted-foreground mb-1">Find this on your card:</p>
        <p className="text-2xl font-bold text-foreground">{currentCall?.text || '...'}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">Call {callIndex + 1}/{callOrder.length}</Badge>
          <Button variant="ghost" size="sm" onClick={nextCall} disabled={completed}>Skip</Button>
        </div>
      </div>

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
                : 'bg-card border-border hover:border-primary/50 text-foreground'
            )}
            whileTap={{ scale: 0.9 }}
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
