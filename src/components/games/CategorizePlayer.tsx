import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FolderOpen, Check, RotateCcw, Trophy, X } from 'lucide-react';

interface CategorizePlayerProps {
  config: {
    categorizeBuckets?: { id: string; name: string; color?: string }[];
    categorizeItems?: { id: string; text: string; bucketId: string }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const BUCKET_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-red-400',
  'from-indigo-500 to-violet-400',
];

const CategorizePlayer = ({ config, onComplete }: CategorizePlayerProps) => {
  const buckets = config.categorizeBuckets || [];
  const items = config.categorizeItems || [];

  const [unplaced, setUnplaced] = useState<typeof items>([]);
  const [placements, setPlacements] = useState<Record<string, string[]>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setUnplaced([...items].sort(() => Math.random() - 0.5));
    const initial: Record<string, string[]> = {};
    buckets.forEach(b => { initial[b.id] = []; });
    setPlacements(initial);
    setChecked(false);
    setScore(0);
  }, []);

  const placeInBucket = (bucketId: string) => {
    if (checked || !selectedItem) return;
    // Remove from unplaced
    setUnplaced(prev => prev.filter(i => i.id !== selectedItem));
    // Remove from any other bucket
    setPlacements(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = next[k].filter(id => id !== selectedItem); });
      next[bucketId] = [...(next[bucketId] || []), selectedItem];
      return next;
    });
    setSelectedItem(null);
  };

  const removeFromBucket = (itemId: string, bucketId: string) => {
    if (checked) return;
    setPlacements(prev => ({
      ...prev,
      [bucketId]: prev[bucketId].filter(id => id !== itemId),
    }));
    const item = items.find(i => i.id === itemId);
    if (item) setUnplaced(prev => [...prev, item]);
  };

  const checkAnswers = () => {
    let correct = 0;
    Object.entries(placements).forEach(([bucketId, itemIds]) => {
      itemIds.forEach(itemId => {
        const item = items.find(i => i.id === itemId);
        if (item && item.bucketId === bucketId) correct++;
      });
    });
    setScore(correct);
    setChecked(true);
    onComplete?.(correct, items.length);
  };

  const reset = () => {
    setUnplaced([...items].sort(() => Math.random() - 0.5));
    const initial: Record<string, string[]> = {};
    buckets.forEach(b => { initial[b.id] = []; });
    setPlacements(initial);
    setChecked(false);
    setScore(0);
    setSelectedItem(null);
  };

  if (buckets.length === 0) return <p className="text-center text-muted-foreground py-8">No categories configured</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
        <FolderOpen className="w-4 h-4" /> Tap an item, then tap a category to place it
      </p>

      {/* Unplaced items */}
      <div className="flex flex-wrap gap-1.5 justify-center min-h-[40px] p-2 bg-muted/20 rounded-xl border border-dashed border-border">
        {unplaced.length === 0 && !checked && <span className="text-xs text-muted-foreground">All items placed!</span>}
        {unplaced.map(item => (
          <motion.button
            key={item.id}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all',
              selectedItem === item.id
                ? 'bg-primary border-primary text-primary-foreground scale-105'
                : 'bg-card border-border text-foreground hover:border-primary/40'
            )}
            onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
            whileTap={{ scale: 0.95 }}
            layout
          >
            {item.text}
          </motion.button>
        ))}
      </div>

      {/* Buckets */}
      <div className={cn('grid gap-2', buckets.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
        {buckets.map((bucket, bi) => {
          const color = BUCKET_COLORS[bi % BUCKET_COLORS.length];
          const bucketItems = placements[bucket.id] || [];

          return (
            <motion.button
              key={bucket.id}
              className={cn(
                'rounded-xl border-2 overflow-hidden text-left transition-all',
                selectedItem ? 'border-primary/50 ring-2 ring-primary/10 cursor-pointer' : 'border-border cursor-default'
              )}
              onClick={() => selectedItem && placeInBucket(bucket.id)}
              whileTap={selectedItem ? { scale: 0.98 } : undefined}
            >
              <div className={cn('px-2.5 py-1.5 bg-gradient-to-r text-white text-xs font-bold', color)}>
                {bucket.name}
              </div>
              <div className="p-2 min-h-[50px] space-y-1 bg-card">
                {bucketItems.map(itemId => {
                  const item = items.find(i => i.id === itemId);
                  if (!item) return null;
                  const isRight = checked && item.bucketId === bucket.id;
                  const isWrong = checked && item.bucketId !== bucket.id;
                  return (
                    <div
                      key={itemId}
                      className={cn(
                        'px-2 py-1 rounded text-[11px] font-medium flex items-center justify-between',
                        isRight ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                        isWrong ? 'bg-destructive/10 text-destructive' :
                        'bg-muted/50 text-foreground'
                      )}
                      onClick={(e) => { e.stopPropagation(); if (!checked) removeFromBucket(itemId, bucket.id); }}
                    >
                      <span>{item.text}</span>
                      {checked ? (isRight ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />) : (
                        <X className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-destructive" />
                      )}
                    </div>
                  );
                })}
                {bucketItems.length === 0 && (
                  <span className="text-[10px] text-muted-foreground/50">Drop here</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-2 justify-center">
        {!checked ? (
          <Button onClick={checkAnswers} disabled={unplaced.length > 0} size="sm">
            <Check className="w-4 h-4 mr-1" /> Check
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {score === items.length ? (
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-bold text-foreground">Perfect! 🎉</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{score}/{items.length} correct</span>
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

export default CategorizePlayer;
