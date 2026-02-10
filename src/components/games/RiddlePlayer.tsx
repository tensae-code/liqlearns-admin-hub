import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { HelpCircle, Check, RotateCcw, Trophy, Lightbulb, ArrowRight } from 'lucide-react';

interface RiddlePlayerProps {
  config: {
    riddles?: { question: string; answer: string; hints?: string[] }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const RiddlePlayer = ({ config, onComplete }: RiddlePlayerProps) => {
  const riddles = config.riddles || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = riddles[currentIdx];

  const checkAnswer = () => {
    const correct = userAnswer.trim().toLowerCase() === current.answer.toLowerCase();
    setIsCorrect(correct);
    setChecked(true);
    if (correct) setScore(prev => prev + 1);
  };

  const revealHint = () => {
    if (current.hints && hintsRevealed < current.hints.length) {
      setHintsRevealed(prev => prev + 1);
    }
  };

  const next = () => {
    if (currentIdx + 1 < riddles.length) {
      setCurrentIdx(prev => prev + 1);
      setUserAnswer('');
      setHintsRevealed(0);
      setChecked(false);
      setIsCorrect(false);
    } else {
      setFinished(true);
      onComplete?.(score, riddles.length);
    }
  };

  if (!current) return <p className="text-center text-muted-foreground py-8">No riddles configured</p>;

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 space-y-3">
        <Trophy className="w-10 h-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-lg text-foreground">All Done!</p>
        <p className="text-muted-foreground">{score}/{riddles.length} solved</p>
        <Button variant="outline" onClick={() => { setCurrentIdx(0); setScore(0); setFinished(false); setUserAnswer(''); setHintsRevealed(0); setChecked(false); }}>
          <RotateCcw className="w-4 h-4 mr-1" /> Play Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{currentIdx + 1}/{riddles.length}</p>
        <p className="text-xs font-medium text-foreground">Score: {score}</p>
      </div>

      {/* Riddle card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20"
        >
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-foreground leading-relaxed">{current.question}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Hints */}
      {current.hints && current.hints.length > 0 && (
        <div className="space-y-1.5">
          {current.hints.slice(0, hintsRevealed).map((hint, i) => (
            <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg"
            >
              <Lightbulb className="w-3 h-3 shrink-0" /> {hint}
            </motion.div>
          ))}
          {!checked && hintsRevealed < current.hints.length && (
            <button onClick={revealHint} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto">
              <Lightbulb className="w-3 h-3" /> Reveal hint ({current.hints.length - hintsRevealed} left)
            </button>
          )}
        </div>
      )}

      {/* Answer input */}
      <div className="flex gap-2">
        <Input
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          placeholder="Type your answer..."
          disabled={checked}
          onKeyDown={e => e.key === 'Enter' && !checked && userAnswer.trim() && checkAnswer()}
          className="flex-1"
        />
        {!checked ? (
          <Button onClick={checkAnswer} disabled={!userAnswer.trim()} size="sm">
            <Check className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={next} size="sm">
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {checked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={cn('text-center text-sm p-2 rounded-lg', isCorrect ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-destructive bg-destructive/10')}
        >
          {isCorrect ? '✅ Correct!' : `❌ Answer: ${current.answer}`}
        </motion.div>
      )}
    </div>
  );
};

export default RiddlePlayer;
