import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Music, Check, RotateCcw, Trophy, ArrowRight } from 'lucide-react';

interface RhymeTimePlayerProps {
  config: {
    rhymeRounds?: {
      id: string;
      targetWord: string;
      options: { id: string; text: string; isRhyme: boolean }[];
    }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const RhymeTimePlayer = ({ config, onComplete }: RhymeTimePlayerProps) => {
  const rounds = config.rhymeRounds || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = rounds[currentIdx];

  const toggleOption = (id: string) => {
    if (checked) return;
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const checkAnswer = () => {
    if (!current) return;
    const correctIds = current.options.filter(o => o.isRhyme).map(o => o.id);
    const allCorrect = correctIds.every(id => selected.includes(id)) && selected.every(id => correctIds.includes(id));
    if (allCorrect) setScore(prev => prev + 1);
    setChecked(true);
  };

  const next = () => {
    if (currentIdx + 1 < rounds.length) {
      setCurrentIdx(prev => prev + 1);
      setSelected([]);
      setChecked(false);
    } else {
      setFinished(true);
      onComplete?.(score, rounds.length);
    }
  };

  if (!current) return <p className="text-center text-muted-foreground py-8">No rounds configured</p>;

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 space-y-3">
        <Trophy className="w-10 h-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-lg text-foreground">Complete!</p>
        <p className="text-muted-foreground">{score}/{rounds.length} correct</p>
        <Button variant="outline" onClick={() => { setCurrentIdx(0); setScore(0); setFinished(false); setSelected([]); setChecked(false); }}>
          <RotateCcw className="w-4 h-4 mr-1" /> Play Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{currentIdx + 1}/{rounds.length}</p>
        <p className="text-xs font-medium text-foreground">Score: {score}</p>
      </div>

      {/* Target word */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          <Music className="w-4 h-4" /> Which words rhyme with:
        </p>
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block px-6 py-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl border border-primary/30"
        >
          <span className="text-2xl font-bold text-primary">{current.targetWord}</span>
        </motion.div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {current.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isCorrectOption = option.isRhyme;
          const isRight = checked && isSelected && isCorrectOption;
          const isWrong = checked && isSelected && !isCorrectOption;
          const isMissed = checked && !isSelected && isCorrectOption;

          return (
            <motion.button
              key={option.id}
              className={cn(
                'p-3 rounded-xl border-2 text-sm font-medium transition-all',
                isRight ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400' :
                isWrong ? 'bg-destructive/10 border-destructive text-destructive' :
                isMissed ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400' :
                isSelected ? 'bg-primary/10 border-primary text-primary' :
                'bg-card border-border text-foreground hover:border-primary/30'
              )}
              onClick={() => toggleOption(option.id)}
              whileTap={!checked ? { scale: 0.95 } : undefined}
            >
              {option.text}
              {checked && (
                <span className="ml-1 text-[10px]">
                  {isRight ? '✅' : isWrong ? '❌' : isMissed ? '💡' : ''}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-2 justify-center">
        {!checked ? (
          <Button onClick={checkAnswer} disabled={selected.length === 0} size="sm">
            <Check className="w-4 h-4 mr-1" /> Check
          </Button>
        ) : (
          <Button onClick={next} size="sm">
            {currentIdx + 1 < rounds.length ? 'Next →' : 'Finish'} 
          </Button>
        )}
      </div>
    </div>
  );
};

export default RhymeTimePlayer;
