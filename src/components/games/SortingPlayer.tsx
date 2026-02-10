import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, FolderInput } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface SortingPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const SortingPlayer = ({ config, onComplete }: SortingPlayerProps) => {
  const categories = config.categories || [];
  const sortItems = config.sortItems || [];
  const [remaining, setRemaining] = useState(() => [...sortItems].sort(() => Math.random() - 0.5));
  const [bins, setBins] = useState<Record<string, typeof sortItems>>(() =>
    Object.fromEntries(categories.map(c => [c.id, []]))
  );
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    if (!selectedItem || done) return;
    const item = remaining.find(i => i.id === selectedItem);
    if (!item) return;

    if (item.categoryId === categoryId) {
      setBins(prev => ({ ...prev, [categoryId]: [...prev[categoryId], item] }));
      setRemaining(prev => prev.filter(i => i.id !== item.id));
      setScore(s => s + 1);
      setSelectedItem(null);
      if (remaining.length === 1) {
        setDone(true);
        onComplete?.(score + 1, sortItems.length);
      }
    } else {
      setWrong(categoryId);
      setTimeout(() => setWrong(null), 500);
    }
  };

  const reset = () => {
    setRemaining([...sortItems].sort(() => Math.random() - 0.5));
    setBins(Object.fromEntries(categories.map(c => [c.id, []])));
    setSelectedItem(null);
    setScore(0);
    setWrong(null);
    setDone(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Sorted: <span className="font-bold text-foreground">{score}/{sortItems.length}</span></p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Items to sort */}
      {!done && (
        <div className="flex flex-wrap gap-2">
          {remaining.map(item => (
            <motion.button
              key={item.id}
              onClick={() => setSelectedItem(item.id)}
              className={cn(
                'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                selectedItem === item.id
                  ? 'bg-primary/10 border-primary text-foreground ring-2 ring-primary/20'
                  : 'bg-card border-border hover:border-primary/40 text-foreground'
              )}
              whileTap={{ scale: 0.95 }}
              layout
            >
              {item.text}
            </motion.button>
          ))}
        </div>
      )}

      {/* Category bins */}
      <div className={cn('grid gap-3', categories.length <= 2 ? 'grid-cols-2' : categories.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4')}>
        {categories.map(cat => (
          <motion.button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={cn(
              'p-3 rounded-xl border-2 border-dashed min-h-[100px] flex flex-col items-center justify-start gap-2 transition-all',
              wrong === cat.id
                ? 'border-destructive bg-destructive/5'
                : selectedItem
                  ? 'border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer'
                  : 'border-border bg-muted/30'
            )}
            animate={wrong === cat.id ? { x: [0, -3, 3, -3, 0] } : {}}
          >
            <FolderInput className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{cat.name}</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {bins[cat.id]?.map(item => (
                <span key={item.id} className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded-md">{item.text}</span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl">
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">All Sorted! 🎉</p>
          <p className="text-sm text-muted-foreground">{score}/{sortItems.length} correct</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default SortingPlayer;
