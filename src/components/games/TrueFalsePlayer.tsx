import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, Check, X, ChevronRight } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface TrueFalsePlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const TrueFalsePlayer = ({ config, onComplete }: TrueFalsePlayerProps) => {
  const statements = config.statements || [];
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const statement = statements[index];
  if (!statement) return <p className="text-center text-muted-foreground py-8">No statements configured.</p>;

  const handleAnswer = (answer: boolean) => {
    if (answered !== null) return;
    setAnswered(answer);
    const correct = answer === statement.isTrue;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const next = () => {
    if (index < statements.length - 1) {
      setIndex(i => i + 1);
      setAnswered(null);
      setIsCorrect(null);
    } else {
      const finalScore = score + (isCorrect ? 0 : 0); // already counted
      onComplete?.(score, statements.length);
    }
  };

  const reset = () => {
    setIndex(0);
    setScore(0);
    setAnswered(null);
    setIsCorrect(null);
  };

  const allDone = index >= statements.length - 1 && answered !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Question <span className="font-bold text-foreground">{index + 1}/{statements.length}</span></p>
        <p className="text-sm text-muted-foreground">Score: <span className="font-bold text-foreground">{score}</span></p>
      </div>

      {/* Statement */}
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-5 rounded-xl border border-border bg-card text-center"
      >
        <p className="text-base font-medium text-foreground leading-relaxed">{statement.text}</p>
      </motion.div>

      {/* True/False buttons */}
      {answered === null ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleAnswer(true)}
            className="h-14 text-base font-semibold border-2 hover:bg-success/10 hover:border-success hover:text-success"
          >
            <Check className="w-5 h-5 mr-2" /> True
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleAnswer(false)}
            className="h-14 text-base font-semibold border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
          >
            <X className="w-5 h-5 mr-2" /> False
          </Button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className={cn(
            'p-4 rounded-xl border text-center',
            isCorrect ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
          )}>
            <p className={cn('font-bold text-sm', isCorrect ? 'text-success' : 'text-destructive')}>
              {isCorrect ? '✅ Correct!' : `❌ Wrong — the answer is ${statement.isTrue ? 'True' : 'False'}`}
            </p>
            {statement.explanation && (
              <p className="text-xs text-muted-foreground mt-2">{statement.explanation}</p>
            )}
          </div>

          {!allDone ? (
            <Button onClick={next} className="w-full mt-3">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <div className="text-center mt-3 p-4 bg-success/10 border border-success/30 rounded-xl">
              <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="font-bold text-foreground">{score}/{statements.length} Correct! 🎉</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-1" /> Play Again
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default TrueFalsePlayer;
