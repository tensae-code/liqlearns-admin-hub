import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, Check, ArrowRight } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface SentenceBuilderPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const SentenceBuilderPlayer = ({ config, onComplete }: SentenceBuilderPlayerProps) => {
  const sentences = config.sentenceItems || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffled, setShuffled] = useState(() =>
    sentences.length > 0 ? [...sentences[0].words].sort(() => Math.random() - 0.5) : []
  );

  if (sentences.length === 0) return <p className="text-center text-muted-foreground py-8">No sentences configured.</p>;

  const current = sentences[currentIndex];
  const correctOrder = current.words;
  const isCorrect = checked && selected.join(' ') === correctOrder.join(' ');

  const handleWordClick = (word: string, idx: number) => {
    if (checked) return;
    setSelected(prev => [...prev, word]);
    setShuffled(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveWord = (idx: number) => {
    if (checked) return;
    const word = selected[idx];
    setSelected(prev => prev.filter((_, i) => i !== idx));
    setShuffled(prev => [...prev, word]);
  };

  const checkAnswer = () => {
    setChecked(true);
    if (selected.join(' ') === correctOrder.join(' ')) {
      setScore(s => s + 1);
    }
  };

  const nextSentence = () => {
    const next = currentIndex + 1;
    if (next < sentences.length) {
      setCurrentIndex(next);
      setSelected([]);
      setChecked(false);
      setShuffled([...sentences[next].words].sort(() => Math.random() - 0.5));
    } else {
      onComplete?.(score, sentences.length);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setSelected([]);
    setChecked(false);
    setScore(0);
    setShuffled([...sentences[0].words].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Sentence {currentIndex + 1}/{sentences.length} • Score: <span className="font-bold text-foreground">{score}</span>
        </p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Hint / clue */}
      {current.hint && (
        <p className="text-xs text-muted-foreground text-center">💡 {current.hint}</p>
      )}

      {/* Answer area */}
      <div className="min-h-[52px] p-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-wrap gap-1.5">
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground">Tap words below to build the sentence...</span>
        )}
        {selected.map((word, i) => (
          <motion.button
            key={`s-${i}`}
            onClick={() => handleRemoveWord(i)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
              checked
                ? isCorrect
                  ? 'bg-success/10 border-success text-success'
                  : 'bg-destructive/10 border-destructive text-destructive'
                : 'bg-primary/10 border-primary/40 text-foreground hover:bg-primary/20'
            )}
            layout
            whileTap={!checked ? { scale: 0.95 } : {}}
          >
            {word}
          </motion.button>
        ))}
      </div>

      {/* Word bank */}
      {!checked && (
        <div className="flex flex-wrap gap-1.5">
          {shuffled.map((word, i) => (
            <motion.button
              key={`w-${i}-${word}`}
              onClick={() => handleWordClick(word, i)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-card border border-border hover:border-primary/40 text-foreground transition-all"
              whileTap={{ scale: 0.95 }}
              layout
            >
              {word}
            </motion.button>
          ))}
        </div>
      )}

      {/* Check / Next */}
      {!checked && selected.length === correctOrder.length && (
        <Button onClick={checkAnswer} className="w-full">
          <Check className="w-4 h-4 mr-1" /> Check
        </Button>
      )}

      {checked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={cn(
            'text-center p-4 rounded-xl border',
            isCorrect ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
          )}>
          {isCorrect ? (
            <p className="font-bold text-foreground">✅ Correct!</p>
          ) : (
            <>
              <p className="font-bold text-foreground">❌ Not quite</p>
              <p className="text-xs text-muted-foreground mt-1">Correct: {correctOrder.join(' ')}</p>
            </>
          )}
          <Button size="sm" className="mt-3" onClick={nextSentence}>
            {currentIndex < sentences.length - 1 ? <>Next <ArrowRight className="w-4 h-4 ml-1" /></> : 'Finish'}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default SentenceBuilderPlayer;
