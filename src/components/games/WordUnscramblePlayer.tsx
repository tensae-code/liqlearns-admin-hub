import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Shuffle, Check, RotateCcw, Trophy, X, Lightbulb } from 'lucide-react';

interface WordUnscramblePlayerProps {
  config: {
    unscrambleWords?: { word: string; hint?: string }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const WordUnscramblePlayer = ({ config, onComplete }: WordUnscramblePlayerProps) => {
  const words = config.unscrambleWords || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [userLetters, setUserLetters] = useState<string[]>([]);
  const [availableIndices, setAvailableIndices] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = words[currentIdx];

  useEffect(() => {
    if (!current) return;
    const letters = current.word.toUpperCase().split('');
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    // Ensure it's actually scrambled
    if (shuffled.join('') === letters.join('') && letters.length > 1) {
      [shuffled[0], shuffled[shuffled.length - 1]] = [shuffled[shuffled.length - 1], shuffled[0]];
    }
    setScrambled(shuffled);
    setUserLetters([]);
    setAvailableIndices(shuffled.map((_, i) => i));
    setChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  }, [currentIdx, current]);

  const pickLetter = (idx: number) => {
    if (checked) return;
    setUserLetters(prev => [...prev, scrambled[idx]]);
    setAvailableIndices(prev => prev.filter(i => i !== idx));
  };

  const removeLetter = (pos: number) => {
    if (checked) return;
    const letter = userLetters[pos];
    const origIdx = scrambled.findIndex((l, i) => l === letter && !availableIndices.includes(i) && !userLetters.slice(0, pos).filter((_, j) => j !== pos).includes(l));
    // simpler: just re-add first matching unavailable index
    const matchIdx = scrambled.findIndex((l, i) => l === letter && !availableIndices.includes(i));
    if (matchIdx !== -1) {
      setAvailableIndices(prev => [...prev, matchIdx].sort((a, b) => a - b));
    }
    setUserLetters(prev => prev.filter((_, i) => i !== pos));
  };

  const checkAnswer = () => {
    const answer = userLetters.join('');
    const correct = current.word.toUpperCase() === answer;
    setIsCorrect(correct);
    setChecked(true);
    if (correct) setScore(prev => prev + 1);
  };

  const next = () => {
    if (currentIdx + 1 < words.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setFinished(true);
      onComplete?.(score + (isCorrect ? 0 : 0), words.length);
    }
  };

  if (!current) return <p className="text-center text-muted-foreground py-8">No words configured</p>;

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 space-y-3">
        <Trophy className="w-10 h-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-lg text-foreground">Complete!</p>
        <p className="text-muted-foreground">{score}/{words.length} correct</p>
        <Button variant="outline" onClick={() => { setCurrentIdx(0); setScore(0); setFinished(false); }}>
          <RotateCcw className="w-4 h-4 mr-1" /> Play Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{currentIdx + 1}/{words.length}</p>
        <p className="text-xs font-medium text-foreground">Score: {score}</p>
      </div>

      <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
        <Shuffle className="w-4 h-4" /> Unscramble the letters
      </p>

      {/* User's answer area */}
      <div className="flex flex-wrap gap-1.5 justify-center min-h-[44px] p-3 bg-muted/30 rounded-xl border-2 border-dashed border-border">
        {userLetters.length === 0 && <span className="text-xs text-muted-foreground">Tap letters below</span>}
        {userLetters.map((letter, i) => (
          <motion.button
            key={`user-${i}`}
            className={cn(
              'w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center border-2',
              checked && isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700' :
              checked && !isCorrect ? 'bg-destructive/20 border-destructive text-destructive' :
              'bg-primary/10 border-primary text-primary'
            )}
            onClick={() => removeLetter(i)}
            whileTap={{ scale: 0.9 }}
            layout
          >
            {letter}
          </motion.button>
        ))}
      </div>

      {/* Available letters */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {scrambled.map((letter, i) => (
          <motion.button
            key={`avail-${i}`}
            className={cn(
              'w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center border-2 transition-all',
              availableIndices.includes(i)
                ? 'bg-card border-border text-foreground hover:border-primary/50 cursor-pointer'
                : 'opacity-20 cursor-default'
            )}
            onClick={() => availableIndices.includes(i) && pickLetter(i)}
            whileTap={availableIndices.includes(i) ? { scale: 0.9 } : undefined}
          >
            {letter}
          </motion.button>
        ))}
      </div>

      {/* Hint */}
      {current.hint && (
        <button onClick={() => setShowHint(true)} className="flex items-center gap-1 text-xs text-muted-foreground mx-auto hover:text-foreground">
          <Lightbulb className="w-3 h-3" /> {showHint ? current.hint : 'Show hint'}
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-center">
        {!checked ? (
          <Button onClick={checkAnswer} disabled={userLetters.length !== current.word.length} size="sm">
            <Check className="w-4 h-4 mr-1" /> Check
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="text-sm font-medium text-emerald-600">Correct! 🎉</span>
            ) : (
              <span className="text-sm text-destructive">Answer: {current.word}</span>
            )}
            <Button size="sm" onClick={next}>{currentIdx + 1 < words.length ? 'Next →' : 'Finish'}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordUnscramblePlayer;
