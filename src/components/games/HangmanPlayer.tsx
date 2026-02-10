import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface HangmanPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const HANGMAN_PARTS = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const HangmanPlayer = ({ config, onComplete }: HangmanPlayerProps) => {
  const words = config.hangmanWords || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);

  if (words.length === 0) return <p className="text-center text-muted-foreground py-8">No words configured.</p>;

  const current = words[currentIndex];
  const word = current.word.toUpperCase();
  const hint = current.hint;
  const maxWrong = HANGMAN_PARTS.length;
  const isLost = wrongCount >= maxWrong;
  const isWon = word.split('').every(ch => ch === ' ' || guessed.has(ch));
  const isComplete = isWon || isLost;

  const handleGuess = (letter: string) => {
    if (isComplete || guessed.has(letter)) return;
    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= maxWrong) {
        onComplete?.(currentIndex, words.length);
      }
    } else {
      const allFound = word.split('').every(ch => ch === ' ' || newGuessed.has(ch));
      if (allFound && currentIndex === words.length - 1) {
        onComplete?.(words.length, words.length);
      }
    }
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1);
      setGuessed(new Set());
      setWrongCount(0);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setGuessed(new Set());
    setWrongCount(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Word {currentIndex + 1}/{words.length} • Wrong: <span className="font-bold text-destructive">{wrongCount}/{maxWrong}</span>
        </p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Hangman figure */}
      <div className="flex justify-center">
        <svg width="120" height="140" viewBox="0 0 120 140" className="text-foreground">
          {/* Gallows */}
          <line x1="20" y1="130" x2="100" y2="130" stroke="currentColor" strokeWidth="3" />
          <line x1="40" y1="130" x2="40" y2="10" stroke="currentColor" strokeWidth="3" />
          <line x1="40" y1="10" x2="80" y2="10" stroke="currentColor" strokeWidth="3" />
          <line x1="80" y1="10" x2="80" y2="25" stroke="currentColor" strokeWidth="3" />
          {/* Head */}
          {wrongCount >= 1 && <circle cx="80" cy="35" r="10" stroke="currentColor" strokeWidth="2" fill="none" />}
          {/* Body */}
          {wrongCount >= 2 && <line x1="80" y1="45" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />}
          {/* Left arm */}
          {wrongCount >= 3 && <line x1="80" y1="55" x2="65" y2="70" stroke="currentColor" strokeWidth="2" />}
          {/* Right arm */}
          {wrongCount >= 4 && <line x1="80" y1="55" x2="95" y2="70" stroke="currentColor" strokeWidth="2" />}
          {/* Left leg */}
          {wrongCount >= 5 && <line x1="80" y1="80" x2="65" y2="100" stroke="currentColor" strokeWidth="2" />}
          {/* Right leg */}
          {wrongCount >= 6 && <line x1="80" y1="80" x2="95" y2="100" stroke="currentColor" strokeWidth="2" />}
        </svg>
      </div>

      {/* Word display */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {word.split('').map((ch, i) => (
          <span
            key={i}
            className={cn(
              'w-8 h-10 flex items-center justify-center text-lg font-bold border-b-2',
              ch === ' ' ? 'border-transparent w-4' :
              isComplete && !guessed.has(ch) ? 'text-destructive border-destructive' :
              guessed.has(ch) ? 'text-foreground border-primary' : 'border-border'
            )}
          >
            {ch === ' ' ? '' : (guessed.has(ch) || isComplete) ? ch : ''}
          </span>
        ))}
      </div>

      {/* Hint */}
      {hint && (
        <p className="text-center text-xs text-muted-foreground">💡 Hint: {hint}</p>
      )}

      {/* Keyboard */}
      {!isComplete && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {ALPHABET.map(letter => (
            <motion.button
              key={letter}
              onClick={() => handleGuess(letter)}
              disabled={guessed.has(letter)}
              className={cn(
                'w-8 h-8 rounded-md text-xs font-bold transition-all',
                guessed.has(letter)
                  ? word.includes(letter)
                    ? 'bg-success/20 text-success border border-success/30'
                    : 'bg-destructive/20 text-destructive border border-destructive/30'
                  : 'bg-card border border-border hover:border-primary hover:bg-primary/5 text-foreground'
              )}
              whileTap={!guessed.has(letter) ? { scale: 0.9 } : {}}
            >
              {letter}
            </motion.button>
          ))}
        </div>
      )}

      {isWon && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl">
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">Correct! 🎉</p>
          {currentIndex < words.length - 1 ? (
            <Button size="sm" className="mt-3" onClick={nextWord}>Next Word →</Button>
          ) : (
            <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Play Again
            </Button>
          )}
        </motion.div>
      )}

      {isLost && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <p className="font-bold text-foreground">The word was: <span className="text-primary">{word}</span></p>
          {currentIndex < words.length - 1 ? (
            <Button size="sm" className="mt-3" onClick={nextWord}>Next Word →</Button>
          ) : (
            <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Try Again
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default HangmanPlayer;
