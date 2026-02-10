import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, Check } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface CrosswordPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const CrosswordPlayer = ({ config, onComplete }: CrosswordPlayerProps) => {
  const clues = config.crosswordClues || [];

  // Build grid
  const { grid, gridSize } = useMemo(() => {
    if (clues.length === 0) return { grid: new Map<string, { letter: string; clueIds: string[] }>(), gridSize: { rows: 0, cols: 0 } };
    let maxRow = 0, maxCol = 0;
    const cells = new Map<string, { letter: string; clueIds: string[] }>();

    clues.forEach(clue => {
      const answer = clue.answer.toUpperCase();
      for (let i = 0; i < answer.length; i++) {
        const r = clue.direction === 'down' ? clue.row + i : clue.row;
        const c = clue.direction === 'across' ? clue.col + i : clue.col;
        const key = `${r}-${c}`;
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
        const existing = cells.get(key);
        if (existing) {
          existing.clueIds.push(clue.id);
        } else {
          cells.set(key, { letter: answer[i], clueIds: [clue.id] });
        }
      }
    });

    return { grid: cells, gridSize: { rows: maxRow + 1, cols: maxCol + 1 } };
  }, [clues]);

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [selectedClue, setSelectedClue] = useState<string | null>(clues[0]?.id || null);

  if (clues.length === 0) return <p className="text-center text-muted-foreground py-8">No crossword configured.</p>;

  const handleInput = (key: string, value: string) => {
    if (checked) return;
    setInputs(prev => ({ ...prev, [key]: value.toUpperCase().slice(-1) }));
  };

  const checkAnswers = () => {
    setChecked(true);
    let correct = 0;
    grid.forEach((cell, key) => {
      if (inputs[key] === cell.letter) correct++;
    });
    onComplete?.(correct, grid.size);
  };

  const reset = () => {
    setInputs({});
    setChecked(false);
  };

  const totalCells = grid.size;
  const correctCount = checked ? Array.from(grid.entries()).filter(([key, cell]) => inputs[key] === cell.letter).length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {checked ? `${correctCount}/${totalCells} correct` : `${Object.keys(inputs).length}/${totalCells} filled`}
        </p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 32px))` }}>
          {Array.from({ length: gridSize.rows }).map((_, r) =>
            Array.from({ length: gridSize.cols }).map((_, c) => {
              const key = `${r}-${c}`;
              const cell = grid.get(key);
              if (!cell) return <div key={key} className="w-8 h-8" />;
              const isCorrect = checked && inputs[key] === cell.letter;
              const isWrong = checked && inputs[key] && inputs[key] !== cell.letter;

              return (
                <input
                  key={key}
                  maxLength={1}
                  value={checked && isWrong ? cell.letter : (inputs[key] || '')}
                  onChange={e => handleInput(key, e.target.value)}
                  className={cn(
                    'w-8 h-8 text-center text-xs font-bold border rounded uppercase focus:outline-none focus:ring-1 focus:ring-primary',
                    isCorrect ? 'bg-success/10 border-success text-success' :
                    isWrong ? 'bg-destructive/10 border-destructive text-destructive' :
                    'bg-card border-border text-foreground'
                  )}
                  disabled={checked}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Clues */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-semibold text-foreground mb-1">Across</p>
          {clues.filter(c => c.direction === 'across').map(c => (
            <p key={c.id} className={cn('text-muted-foreground py-0.5', selectedClue === c.id && 'text-primary font-medium')}
              onClick={() => setSelectedClue(c.id)}>
              ({c.row + 1},{c.col + 1}) {c.clue}
            </p>
          ))}
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Down</p>
          {clues.filter(c => c.direction === 'down').map(c => (
            <p key={c.id} className={cn('text-muted-foreground py-0.5', selectedClue === c.id && 'text-primary font-medium')}
              onClick={() => setSelectedClue(c.id)}>
              ({c.row + 1},{c.col + 1}) {c.clue}
            </p>
          ))}
        </div>
      </div>

      {!checked && (
        <Button onClick={checkAnswers} className="w-full">
          <Check className="w-4 h-4 mr-1" /> Check Answers
        </Button>
      )}

      {checked && correctCount === totalCells && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl">
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">Perfect! 🎉</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default CrosswordPlayer;
