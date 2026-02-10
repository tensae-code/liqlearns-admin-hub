import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, RotateCcw, Trophy, Check, X } from 'lucide-react';
import type { GameConfig, QuizQuestion } from '@/lib/gameTypes';

interface QuizPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const QuizPlayer = ({ config, onComplete }: QuizPlayerProps) => {
  const questions = config.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const current = questions[currentIdx];

  const handleSelect = (optionId: string) => {
    if (answered) return;
    setSelectedOption(optionId);
    setAnswered(true);

    const isCorrect = current.options.find(o => o.id === optionId)?.isCorrect || false;
    if (isCorrect) setScore(s => s + 1);
    setResults(prev => [...prev, isCorrect]);
  };

  const next = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setFinished(true);
      onComplete?.(score + (results[results.length - 1] ? 0 : 0), questions.length);
    }
  };

  const reset = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setResults([]);
  };

  if (questions.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No questions configured</p>;
  }

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 py-6"
      >
        <Trophy className={cn('w-12 h-12 mx-auto', score >= questions.length * 0.7 ? 'text-success' : 'text-orange-500')} />
        <div>
          <p className="text-2xl font-bold text-foreground">{score}/{questions.length}</p>
          <p className="text-sm text-muted-foreground">
            {score === questions.length ? 'Perfect score! 🎉' :
             score >= questions.length * 0.7 ? 'Great job! 👏' :
             'Keep practicing! 💪'}
          </p>
        </div>
        {/* Results breakdown */}
        <div className="flex gap-1 justify-center">
          {results.map((r, i) => (
            <div key={i} className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs', r ? 'bg-success text-white' : 'bg-destructive text-white')}>
              {i + 1}
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="w-4 h-4 mr-1" /> Retake Quiz
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{currentIdx + 1}/{questions.length}</span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-3"
        >
          <p className="font-semibold text-foreground">{current.question}</p>

          <div className="space-y-2">
            {current.options.map(option => {
              const isSelected = selectedOption === option.id;
              const showCorrect = answered && option.isCorrect;
              const showWrong = answered && isSelected && !option.isCorrect;

              return (
                <motion.button
                  key={option.id}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center gap-3',
                    !answered && 'hover:border-primary/50 hover:bg-primary/5',
                    !answered && 'bg-card border-border text-foreground',
                    showCorrect && 'bg-success/10 border-success text-success',
                    showWrong && 'bg-destructive/10 border-destructive text-destructive',
                    answered && !showCorrect && !showWrong && 'bg-card border-border text-muted-foreground opacity-60'
                  )}
                  onClick={() => handleSelect(option.id)}
                  whileTap={!answered ? { scale: 0.98 } : {}}
                >
                  <span className="flex-1">{option.text}</span>
                  {showCorrect && <Check className="w-5 h-5 shrink-0" />}
                  {showWrong && <X className="w-5 h-5 shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button onClick={next}>
            {currentIdx < questions.length - 1 ? <>Next <ChevronRight className="w-4 h-4 ml-1" /></> : 'See Results'}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default QuizPlayer;
