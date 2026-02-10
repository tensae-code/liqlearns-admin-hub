import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, RotateCcw, Trophy, Eye, RefreshCw } from 'lucide-react';
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
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setAnswers({});
    setChecked(false);
    setResults({});
    setRevealed(new Set());
    setAttempts(0);
  }, [text, blanks]);

  const parts = text.split(/\{\{blank\}\}/g);

  const checkAnswers = () => {
    const res: Record<string, boolean> = {};
    let correct = 0;
    blanks.forEach((blank) => {
      const userAnswer = (answers[blank.id] || '').trim().toLowerCase();
      const correctAnswer = blank.answer.trim().toLowerCase();
      const isCorrect = userAnswer === correctAnswer;
      res[blank.id] = isCorrect;
      if (isCorrect) correct++;
    });
    setResults(res);
    setChecked(true);
    setAttempts(a => a + 1);
  };

  const tryAgain = () => {
    // Keep correct answers, clear wrong ones
    const newAnswers: Record<string, string> = {};
    blanks.forEach((blank) => {
      if (results[blank.id]) {
        newAnswers[blank.id] = answers[blank.id];
      }
    });
    setAnswers(newAnswers);
    setChecked(false);
    setResults({});
  };

  const revealAnswer = (blankId: string) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.add(blankId);
      return next;
    });
    const blank = blanks.find(b => b.id === blankId);
    if (blank) {
      setAnswers(prev => ({ ...prev, [blankId]: blank.answer }));
    }
  };

  const finishWithScore = () => {
    const fullCorrect = Object.entries(results).filter(([id, v]) => v && !revealed.has(id)).length;
    const halfCredit = revealed.size * 0.5;
    const total = fullCorrect + halfCredit;
    onComplete?.(Math.round(total), blanks.length);
  };

  const reset = () => {
    setAnswers({});
    setChecked(false);
    setResults({});
    setRevealed(new Set());
    setAttempts(0);
  };

  const score = Object.values(results).filter(Boolean).length;
  const wrongCount = checked ? blanks.length - score : 0;
  const isComplete = checked && score === blanks.length;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-card border border-border rounded-xl">
        <div className="flex flex-wrap items-center gap-1 text-foreground leading-relaxed">
          {parts.map((part, idx) => (
            <span key={`part-${idx}`}>
              <span>{part}</span>
              {idx < blanks.length && (
                <span className="inline-flex items-center mx-1 gap-0.5">
                  <Input
                    value={answers[blanks[idx].id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [blanks[idx].id]: e.target.value }))}
                    className={cn(
                      'inline-block w-24 h-8 text-sm text-center mx-0.5',
                      checked && results[blanks[idx].id] && 'border-success bg-success/10',
                      checked && !results[blanks[idx].id] && !revealed.has(blanks[idx].id) && 'border-destructive bg-destructive/10',
                      revealed.has(blanks[idx].id) && 'border-amber-400 bg-amber-500/10'
                    )}
                    disabled={checked || revealed.has(blanks[idx].id)}
                    placeholder={`#${idx + 1}`}
                  />
                  {/* Show reveal button for wrong answers that haven't been revealed */}
                  {checked && !results[blanks[idx].id] && !revealed.has(blanks[idx].id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1.5 text-xs text-amber-600 hover:text-amber-700"
                      onClick={() => revealAnswer(blanks[idx].id)}
                      title="Reveal (half points)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {revealed.has(blanks[idx].id) && (
                    <span className="text-[10px] text-amber-500 ml-0.5">½</span>
                  )}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
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
                <p className="font-bold text-foreground text-sm">
                  {revealed.size > 0 ? `Done! ${blanks.length - revealed.size} correct + ${revealed.size} revealed (½ pts)` : 'All correct! 🎉'}
                </p>
                <Button size="sm" variant="outline" className="mt-2" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Play Again
                </Button>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-sm text-muted-foreground">
                  {score}/{blanks.length} correct • {wrongCount} wrong
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={tryAgain}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Try Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={finishWithScore}>
                    <Check className="w-4 h-4 mr-1" /> Finish
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Click 👁 next to wrong answers to reveal (half points)</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FillBlanksPlayer;
