import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, Eye, EyeOff } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

type Direction = [number, number];
const DIRECTIONS: Direction[] = [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];

const generateGrid = (words: string[], size: number): { grid: string[][], placements: Map<string, Set<string>> } => {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placements = new Map<string, Set<string>>();

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
        const cellSet = new Set<string>();
        cells.forEach(([cr, cc], i) => {
          grid[cr][cc] = upper[i];
          cellSet.add(`${cr}-${cc}`);
        });
        placements.set(upper, cellSet);
        break;
      }
      attempts++;
    }
  }

  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') grid[r][c] = alpha[Math.floor(Math.random() * alpha.length)];
    }
  }

  return { grid, placements };
};

interface WordSearchPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const WordSearchPlayer = ({ config, onComplete }: WordSearchPlayerProps) => {
  const words = config.words || [];
  const size = config.gridSize || 10;

  const [grid, setGrid] = useState<string[][]>([]);
  const [placements, setPlacements] = useState<Map<string, Set<string>>>(new Map());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [showFound, setShowFound] = useState(true);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [endCell, setEndCell] = useState<[number, number] | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { grid: g, placements: p } = generateGrid(words, size);
    setGrid(g);
    setPlacements(p);
    setFoundWords(new Set());
    setFoundCells(new Set());
  }, [words, size]);

  const cellKey = (r: number, c: number) => `${r}-${c}`;

  const getLineCells = (start: [number, number], end: [number, number]): [number, number][] => {
    if (!start || !end) return [];
    const dr = end[0] - start[0];
    const dc = end[1] - start[1];
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return [start];
    
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      if (Math.abs(dr) > Math.abs(dc)) {
        const cells: [number, number][] = [];
        for (let i = 0; i <= Math.abs(dr); i++) cells.push([start[0] + stepR * i, start[1]]);
        return cells;
      } else {
        const cells: [number, number][] = [];
        for (let i = 0; i <= Math.abs(dc); i++) cells.push([start[0], start[1] + stepC * i]);
        return cells;
      }
    }

    const cells: [number, number][] = [];
    for (let i = 0; i <= len; i++) cells.push([start[0] + stepR * i, start[1] + stepC * i]);
    return cells;
  };

  const selectedCells = startCell && endCell ? getLineCells(startCell, endCell) : startCell ? [startCell] : [];
  const selectedSet = new Set(selectedCells.map(([r, c]) => cellKey(r, c)));

  // Get cell coordinates from a touch point
  const getCellFromTouch = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const row = el.getAttribute('data-row');
    const col = el.getAttribute('data-col');
    if (row === null || col === null) return null;
    return [parseInt(row), parseInt(col)];
  }, []);

  const handleStart = (r: number, c: number) => {
    setIsSelecting(true);
    setStartCell([r, c]);
    setEndCell([r, c]);
  };

  const handleMove = (r: number, c: number) => {
    if (!isSelecting) return;
    setEndCell([r, c]);
  };

  const handleEnd = useCallback(() => {
    setIsSelecting(false);
    if (!startCell || !endCell) return;

    const cells = getLineCells(startCell, endCell);
    const selectedText = cells.map(([r, c]) => grid[r]?.[c] || '').join('');
    const reversed = selectedText.split('').reverse().join('');
    const upperWords = words.map(w => w.toUpperCase().replace(/\s/g, ''));

    for (const w of upperWords) {
      if (selectedText === w || reversed === w) {
        setFoundWords(prev => {
          const next = new Set(prev);
          next.add(w);
          if (next.size === upperWords.length) onComplete?.(next.size, upperWords.length);
          return next;
        });
        setFoundCells(prev => {
          const next = new Set(prev);
          cells.forEach(([r, c]) => next.add(cellKey(r, c)));
          return next;
        });
        break;
      }
    }
    setStartCell(null);
    setEndCell(null);
  }, [startCell, endCell, grid, words, onComplete]);

  // Touch move handler on the grid container
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const cell = getCellFromTouch(touch.clientX, touch.clientY);
    if (cell) handleMove(cell[0], cell[1]);
  }, [isSelecting, getCellFromTouch]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  }, [handleEnd]);

  const reset = () => {
    const { grid: g, placements: p } = generateGrid(words, size);
    setGrid(g);
    setPlacements(p);
    setFoundWords(new Set());
    setFoundCells(new Set());
    setStartCell(null);
    setEndCell(null);
  };

  const isComplete = foundWords.size === words.length && words.length > 0;

  return (
    <div className="space-y-4">
      {/* Word list with toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 flex-1">
          {words.map(word => {
            const upper = word.toUpperCase().replace(/\s/g, '');
            const isFound = foundWords.has(upper);
            return (
              <Badge
                key={word}
                variant={isFound ? 'default' : 'outline'}
                className={cn(
                  'text-xs transition-all',
                  isFound && showFound && 'line-through bg-success text-success-foreground',
                  isFound && !showFound && 'opacity-30 bg-success text-success-foreground'
                )}
              >
                {word}
              </Badge>
            );
          })}
        </div>
        {foundWords.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFound(!showFound)}
            className="shrink-0"
            title={showFound ? 'Hide found words on grid' : 'Show found words on grid'}
          >
            {showFound ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="inline-grid gap-0.5 select-none"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, touchAction: 'none' }}
        onMouseLeave={() => { setIsSelecting(false); setStartCell(null); setEndCell(null); }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = cellKey(r, c);
            const isFoundCell = foundCells.has(key);
            const isSelected = selectedSet.has(key);
            return (
              <button
                key={key}
                data-row={r}
                data-col={c}
                className={cn(
                  'w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold rounded transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isFoundCell && showFound
                      ? 'bg-success/20 text-success font-extrabold'
                      : 'bg-muted/40 text-foreground hover:bg-muted'
                )}
                onMouseDown={() => handleStart(r, c)}
                onMouseEnter={() => handleMove(r, c)}
                onMouseUp={() => handleEnd()}
                onTouchStart={(e) => { e.preventDefault(); handleStart(r, c); }}
              >
                {cell}
              </button>
            );
          })
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
