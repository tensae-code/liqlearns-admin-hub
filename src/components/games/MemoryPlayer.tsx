import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface Card {
  id: string;
  pairIndex: number;
  text: string;
  side: 'a' | 'b';
  flipped: boolean;
  matched: boolean;
}

interface MemoryPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const MemoryPlayer = ({ config, onComplete }: MemoryPlayerProps) => {
  const pairs = config.pairs || [];
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    initCards();
  }, [pairs]);

  const initCards = () => {
    const allCards: Card[] = [];
    pairs.forEach((pair, idx) => {
      allCards.push({ id: `a-${idx}`, pairIndex: idx, text: pair.a, side: 'a', flipped: false, matched: false });
      allCards.push({ id: `b-${idx}`, pairIndex: idx, text: pair.b, side: 'b', flipped: false, matched: false });
    });
    // Fisher-Yates shuffle for better randomization
    const shuffled = [...allCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCards(shuffled);
    setFlippedIds([]);
    setMoves(0);
    setMatched(0);
    setLocked(false);
  };

  const handleFlip = (cardId: string) => {
    if (locked) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;
    if (flippedIds.length >= 2) return;

    const newFlipped = [...flippedIds, cardId];
    setFlippedIds(newFlipped);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [first, second] = newFlipped.map(id => cards.find(c => c.id === id)!);
      const firstCard = cardId === first.id ? card : first;
      const secondCard = cardId === second.id ? card : second;

      if (firstCard.pairIndex === secondCard.pairIndex && firstCard.side !== secondCard.side) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.pairIndex === firstCard.pairIndex ? { ...c, matched: true, flipped: true } : c
          ));
          setMatched(m => {
            const newMatched = m + 1;
            if (newMatched === pairs.length) {
              onComplete?.(pairs.length, pairs.length);
            }
            return newMatched;
          });
          setFlippedIds([]);
          setLocked(false);
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) && !c.matched ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          setLocked(false);
        }, 1000);
      }
    }
  };

  // Determine grid columns based on count and text length
  const maxTextLen = Math.max(...cards.map(c => c.text.length), 1);
  const cols = maxTextLen > 8
    ? (cards.length <= 8 ? 2 : 3)
    : (cards.length <= 8 ? 4 : cards.length <= 12 ? 4 : 6);

  const isComplete = matched === pairs.length && pairs.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Moves: <span className="font-bold text-foreground">{moves}</span></p>
          <p className="text-sm text-muted-foreground">Matched: <span className="font-bold text-foreground">{matched}/{pairs.length}</span></p>
        </div>
        <Button size="sm" variant="outline" onClick={initCards} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => (
          <motion.button
            key={card.id}
            className={cn(
              'rounded-xl border-2 flex items-center justify-center font-bold transition-all p-2',
              maxTextLen > 8 ? 'min-h-[70px] text-xs' : 'aspect-square text-sm',
              card.matched
                ? 'bg-success/20 border-success text-success'
                : card.flipped
                  ? 'bg-primary/10 border-primary text-foreground'
                  : 'bg-card border-border hover:border-primary/50 text-transparent'
            )}
            whileTap={!card.flipped && !card.matched ? { scale: 0.9 } : {}}
            onClick={() => handleFlip(card.id)}
          >
            <span className="break-words text-center leading-tight">
              {card.flipped || card.matched ? card.text : '?'}
            </span>
          </motion.button>
        ))}
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl"
        >
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">All Matched! 🎉</p>
          <p className="text-sm text-muted-foreground">Completed in {moves} moves</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={initCards}>
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default MemoryPlayer;
