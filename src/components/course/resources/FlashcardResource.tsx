import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Shuffle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

interface FlashcardResourceProps {
  title: string;
  cards?: Flashcard[];
  onComplete: (knownCount: number, totalCount: number) => void;
  onClose: () => void;
}

// Demo flashcards
const demoCards: Flashcard[] = [
  {
    id: '1',
    front: 'What is a React Hook?',
    back: 'A function that lets you "hook into" React features like state and lifecycle from function components.',
    hint: 'Starts with "use"'
  },
  {
    id: '2',
    front: 'What is the Virtual DOM?',
    back: 'A lightweight JavaScript representation of the actual DOM that React uses for efficient updates.',
    hint: 'Think of it as a copy'
  },
  {
    id: '3',
    front: 'What is Props Drilling?',
    back: 'The process of passing props through multiple nested components to reach a deeply nested component.',
    hint: 'Related to component hierarchy'
  },
  {
    id: '4',
    front: 'What is a Pure Component?',
    back: 'A component that renders the same output for the same state and props, without side effects.',
    hint: 'Think predictable'
  },
  {
    id: '5',
    front: 'What is Lazy Loading?',
    back: 'A technique where components are loaded only when they are needed, improving initial load time.',
    hint: 'On-demand loading'
  }
];

const FlashcardResource = ({ 
  title, 
  cards = demoCards,
  onComplete, 
  onClose 
}: FlashcardResourceProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [knownCards, setKnownCards] = useState<string[]>([]);
  const [unknownCards, setUnknownCards] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = ((knownCards.length + unknownCards.length) / cards.length) * 100;
  const remainingCards = cards.filter(c => !knownCards.includes(c.id) && !unknownCards.includes(c.id));

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowHint(false);
  };

  const handleKnow = () => {
    setKnownCards([...knownCards, currentCard.id]);
    moveToNext();
  };

  const handleDontKnow = () => {
    setUnknownCards([...unknownCards, currentCard.id]);
    moveToNext();
  };

  const moveToNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (remainingCards.length <= 1) {
      setIsFinished(true);
    } else {
      // Find next unreviewed card
      const nextUnreviewed = cards.findIndex((c, i) => 
        i > currentIndex && !knownCards.includes(c.id) && !unknownCards.includes(c.id)
      );
      if (nextUnreviewed !== -1) {
        setCurrentIndex(nextUnreviewed);
      } else {
        setIsFinished(true);
      }
    }
  };

  const handleShuffle = () => {
    const unreviewed = cards.filter(c => !knownCards.includes(c.id) && !unknownCards.includes(c.id));
    if (unreviewed.length > 0) {
      const randomCard = unreviewed[Math.floor(Math.random() * unreviewed.length)];
      setCurrentIndex(cards.findIndex(c => c.id === randomCard.id));
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setKnownCards([]);
    setUnknownCards([]);
    setIsFinished(false);
  };

  if (isFinished) {
    const knownPercentage = Math.round((knownCards.length / cards.length) * 100);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
            className="w-24 h-24 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4"
          >
            <span className="text-5xl">🃏</span>
          </motion.div>

          <h3 className="text-2xl font-bold text-foreground mb-2">
            Deck Complete!
          </h3>
          <p className="text-muted-foreground mb-6">
            You've reviewed all flashcards
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-success/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-success">{knownCards.length}</div>
              <p className="text-sm text-muted-foreground">Known</p>
            </div>
            <div className="bg-warning/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-warning">{unknownCards.length}</div>
              <p className="text-sm text-muted-foreground">To Review</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button 
              onClick={() => onComplete(knownCards.length, cards.length)}
              className="bg-gradient-accent"
            >
              Continue
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  const isReviewed = knownCards.includes(currentCard.id) || unknownCards.includes(currentCard.id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🃏</span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-success/20 text-success">
              {knownCards.length} Known
            </Badge>
            <Badge variant="secondary" className="bg-warning/20 text-warning">
              {unknownCards.length} Review
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="p-4">
        <div 
          className="relative h-64 cursor-pointer perspective-1000"
          onClick={handleFlip}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentCard.id}-${isFlipped}`}
              initial={{ rotateY: isFlipped ? -180 : 0, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 0 : 180, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'absolute inset-0 rounded-xl border-2 p-6 flex flex-col items-center justify-center backface-hidden',
                isFlipped 
                  ? 'bg-accent/10 border-accent' 
                  : 'bg-muted/50 border-border'
              )}
            >
              {!isFlipped ? (
                <>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                    Question
                  </p>
                  <p className="text-xl font-medium text-foreground text-center">
                    {currentCard.front}
                  </p>
                  {currentCard.hint && showHint && (
                    <p className="text-sm text-muted-foreground mt-4 italic">
                      Hint: {currentCard.hint}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    Click to reveal answer
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-accent mb-2 uppercase tracking-wide">
                    Answer
                  </p>
                  <p className="text-lg text-foreground text-center">
                    {currentCard.back}
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hint Button */}
        {!isFlipped && currentCard.hint && !showHint && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              setShowHint(true);
            }}
            className="mt-2 mx-auto block"
          >
            Show Hint
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border">
        {isFlipped && !isReviewed ? (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
              onClick={handleDontKnow}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Study More
            </Button>
            <Button 
              className="flex-1 bg-success hover:bg-success/90"
              onClick={handleKnow}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Got It!
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  setIsFlipped(false);
                  setShowHint(false);
                }
              }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleShuffle}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (currentIndex < cards.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                  setIsFlipped(false);
                  setShowHint(false);
                }
              }}
              disabled={currentIndex === cards.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FlashcardResource;
