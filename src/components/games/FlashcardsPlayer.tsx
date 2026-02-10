import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, ChevronLeft, ChevronRight, Lightbulb, Layers } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface FlashcardsPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const FlashcardsPlayer = ({ config, onComplete }: FlashcardsPlayerProps) => {
  const cards = config.flashcardItems || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const card = cards[index];
  if (!card) return <p className="text-center text-muted-foreground py-8">No flashcards configured.</p>;

  const next = () => {
    setFlipped(false);
    setShowHint(false);
    if (index < cards.length - 1) {
      setIndex(i => i + 1);
    } else {
      onComplete?.(known.size, cards.length);
    }
  };

  const prev = () => {
    if (index > 0) {
      setFlipped(false);
      setShowHint(false);
      setIndex(i => i - 1);
    }
  };

  const markKnown = () => {
    const newKnown = new Set(known);
    newKnown.add(index);
    setKnown(newKnown);
    next();
  };

  const reset = () => {
    setIndex(0);
    setFlipped(false);
    setShowHint(false);
    setKnown(new Set());
  };

  const allDone = index >= cards.length - 1 && flipped;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Card <span className="font-bold text-foreground">{index + 1}/{cards.length}</span></p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-success font-medium">{known.size} known</span>
          <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Card */}
      <motion.button
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[180px] sm:min-h-[220px] rounded-2xl border-2 border-border bg-card hover:shadow-lg transition-shadow flex flex-col items-center justify-center p-6 cursor-pointer"
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? 'back' : 'front'}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <Layers className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-2">{flipped ? 'Answer' : 'Question'}</p>
            <p className="text-lg font-semibold text-foreground">{flipped ? card.back : card.front}</p>
          </motion.div>
        </AnimatePresence>
        <p className="text-[10px] text-muted-foreground mt-4">tap to flip</p>
      </motion.button>

      {/* Hint */}
      {card.hint && !flipped && (
        <div className="text-center">
          {showHint ? (
            <p className="text-sm text-warning italic">💡 {card.hint}</p>
          ) : (
            <button onClick={() => setShowHint(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Lightbulb className="w-3.5 h-3.5 inline mr-1" /> Show hint
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={prev} disabled={index === 0}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {flipped && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={next} className="text-xs">
              Still learning
            </Button>
            <Button size="sm" onClick={markKnown} className="text-xs bg-success hover:bg-success/90 text-white">
              Got it ✓
            </Button>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={next} disabled={index >= cards.length - 1}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardsPlayer;
