import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, RotateCcw, Trophy } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface FillBlanksPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const FillBlanksPlayer = ({ config, onComplete }: FillBlanksPlayerProps) => {
  const text = config.text || '';
  const blanks = config.blanks || [];

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setAnswers({});
    setChecked(false);
    setResults({});
  }, [text, blanks]);

  // Split text by {{blank}} markers
  const parts = text.split(/\{\{blank\}\}/g);

  const checkAnswers = () => {
    const res: Record<string, boolean> = {};
    let correct = 0;
    blanks.forEach((blank, idx) => {
      const userAnswer = (answers[blank.id] || '').trim().toLowerCase();
      const correctAnswer = blank.answer.trim().toLowerCase();
      const isCorrect = userAnswer === correctAnswer;
      res[blank.id] = isCorrect;
      if (isCorrect) correct++;
    });
    setResults(res);
    setChecked(true);
    onComplete?.(correct, blanks.length);
  };

  const reset = () => {
    setAnswers({});
    setChecked(false);
    setResults({});
  };

  const score = Object.values(results).filter(Boolean).length;
  const isComplete = checked && score === blanks.length;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-card border border-border rounded-xl">
        <div className="flex flex-wrap items-center gap-1 text-foreground leading-relaxed">
          {parts.map((part, idx) => (
            <span key={`part-${idx}`}>
              <span>{part}</span>
              {idx < blanks.length && (
                <span className="inline-flex items-center mx-1">
                  <Input
                    value={answers[blanks[idx].id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [blanks[idx].id]: e.target.value }))}
                    className={cn(
                      'inline-block w-24 h-8 text-sm text-center mx-0.5',
                      checked && results[blanks[idx].id] && 'border-success bg-success/10',
                      checked && !results[blanks[idx].id] && 'border-destructive bg-destructive/10'
                    )}
                    disabled={checked}
                    placeholder={`#${idx + 1}`}
                  />
                  {checked && !results[blanks[idx].id] && (
                    <span className="text-xs text-success ml-1">({blanks[idx].answer})</span>
                  )}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        {!checked ? (
          <Button onClick={checkAnswers} disabled={Object.keys(answers).length === 0}>
            <Check className="w-4 h-4 mr-1" /> Check
          </Button>
        ) : (
          <>
            {isComplete ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-3 bg-success/10 border border-success/30 rounded-xl w-full"
              >
                <Trophy className="w-6 h-6 text-success mx-auto mb-1" />
                <p className="font-bold text-foreground text-sm">All correct! 🎉</p>
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground">{score}/{blanks.length} correct</p>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FillBlanksPlayer;
