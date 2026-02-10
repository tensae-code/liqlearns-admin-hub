import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, Search } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

type Direction = [number, number];
const DIRECTIONS: Direction[] = [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];

const generateGrid = (words: string[], size: number): string[][] => {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placed: { word: string; cells: [number, number][] }[] = [];

  for (const word of words) {
    const upper = word.toUpperCase().replace(/\s/g, '');
    let attempts = 0;
    while (attempts < 100) {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      let fits = true;
      const cells: [number, number][] = [];

      for (let i = 0; i < upper.length; i++) {
        const nr = r + dir[0] * i;
        const nc = c + dir[1] * i;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) { fits = false; break; }
        if (grid[nr][nc] !== '' && grid[nr][nc] !== upper[i]) { fits = false; break; }
        cells.push([nr, nc]);
      }

      if (fits) {
        cells.forEach(([cr, cc], i) => { grid[cr][cc] = upper[i]; });
        placed.push({ word: upper, cells });
        break;
      }
      attempts++;
    }
  }

  // Fill empty cells
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') grid[r][c] = alpha[Math.floor(Math.random() * alpha.length)];
    }
  }

  return grid;
};

interface WordSearchPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const WordSearchPlayer = ({ config, onComplete }: WordSearchPlayerProps) => {
  const words = config.words || [];
  const size = config.gridSize || 10;

  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState<[number, number][]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    setGrid(generateGrid(words, size));
    setFoundWords(new Set());
  }, [words, size]);

  const cellKey = (r: number, c: number) => `${r}-${c}`;
  const selectedSet = new Set(selecting.map(([r, c]) => cellKey(r, c)));

  const handleMouseDown = (r: number, c: number) => {
    setIsSelecting(true);
    setSelecting([[r, c]]);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (!isSelecting) return;
    setSelecting(prev => [...prev, [r, c]]);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    // Check if selection forms a word
    const selectedText = selecting.map(([r, c]) => grid[r]?.[c] || '').join('');
    const reversed = selectedText.split('').reverse().join('');
    const upperWords = words.map(w => w.toUpperCase().replace(/\s/g, ''));

    for (const w of upperWords) {
      if (selectedText === w || reversed === w) {
        setFoundWords(prev => {
          const next = new Set(prev);
          next.add(w);
          if (next.size === upperWords.length) {
            onComplete?.(next.size, upperWords.length);
          }
          return next;
        });
        break;
      }
    }
    setSelecting([]);
  };

  const reset = () => {
    setGrid(generateGrid(words, size));
    setFoundWords(new Set());
    setSelecting([]);
  };

  const isComplete = foundWords.size === words.length && words.length > 0;

  return (
    <div className="space-y-4">
      {/* Word list */}
      <div className="flex flex-wrap gap-2">
        {words.map(word => {
          const upper = word.toUpperCase().replace(/\s/g, '');
          return (
            <Badge
              key={word}
              variant={foundWords.has(upper) ? 'default' : 'outline'}
              className={cn(
                'text-xs',
                foundWords.has(upper) && 'line-through bg-success text-success-foreground'
              )}
            >
              {word}
            </Badge>
          );
        })}
      </div>

      {/* Grid */}
      <div
        className="inline-grid gap-0.5 select-none touch-none"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        onMouseLeave={() => { setIsSelecting(false); setSelecting([]); }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={cellKey(r, c)}
              className={cn(
                'w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold rounded transition-all',
                selectedSet.has(cellKey(r, c))
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-foreground hover:bg-muted'
              )}
              onMouseDown={() => handleMouseDown(r, c)}
              onMouseEnter={() => handleMouseEnter(r, c)}
              onMouseUp={handleMouseUp}
              onTouchStart={() => handleMouseDown(r, c)}
              onTouchEnd={handleMouseUp}
            >
              {cell}
            </button>
          ))
        )}
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-3 bg-success/10 border border-success/30 rounded-xl"
        >
          <Trophy className="w-6 h-6 text-success mx-auto mb-1" />
          <p className="font-bold text-foreground text-sm">All words found! 🎉</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default WordSearchPlayer;
