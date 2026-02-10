import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BarChart3, Check, Trophy } from 'lucide-react';

interface PollPlayerProps {
  config: {
    pollQuestions?: {
      id: string;
      question: string;
      options: { id: string; text: string }[];
      correctId?: string;
    }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const POLL_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-500',
];

const PollPlayer = ({ config, onComplete }: PollPlayerProps) => {
  const questions = config.pollQuestions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  // Simulated vote counts for fun
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  const current = questions[currentIdx];

  const vote = (optionId: string) => {
    if (voted) return;
    setSelectedId(optionId);
    // Simulate votes
    const counts: Record<string, number> = {};
    current.options.forEach(o => {
      counts[o.id] = Math.floor(Math.random() * 20) + 3;
    });
    counts[optionId] += 5; // Bump user's choice
    setVoteCounts(counts);
    setVoted(true);
    if (current.correctId && optionId === current.correctId) {
      setScore(prev => prev + 1);
    }
  };

  const next = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedId(null);
      setVoted(false);
      setVoteCounts({});
    } else {
      setFinished(true);
      onComplete?.(score, questions.length);
    }
  };

  if (!current) return <p className="text-center text-muted-foreground py-8">No polls configured</p>;

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 space-y-3">
        <Trophy className="w-10 h-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-lg text-foreground">All Done!</p>
        {questions.some(q => q.correctId) && <p className="text-muted-foreground">{score}/{questions.length} correct</p>}
      </motion.div>
    );
  }

  const totalVotes = Object.values(voteCounts).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{currentIdx + 1}/{questions.length}</p>
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
      </div>

      <p className="text-sm font-semibold text-foreground text-center">{current.question}</p>

      <div className="space-y-2">
        {current.options.map((option, i) => {
          const isSelected = selectedId === option.id;
          const isCorrectOption = current.correctId === option.id;
          const pct = voted && totalVotes > 0 ? Math.round((voteCounts[option.id] || 0) / totalVotes * 100) : 0;

          return (
            <motion.button
              key={option.id}
              className={cn(
                'w-full rounded-xl border-2 text-left transition-all relative overflow-hidden',
                voted && isCorrectOption ? 'border-emerald-500' :
                voted && isSelected && !isCorrectOption && current.correctId ? 'border-destructive' :
                isSelected ? 'border-primary' :
                'border-border hover:border-primary/30'
              )}
              onClick={() => vote(option.id)}
              whileTap={!voted ? { scale: 0.98 } : undefined}
            >
              {/* Fill bar */}
              {voted && (
                <motion.div
                  className={cn('absolute inset-y-0 left-0 opacity-15', POLL_COLORS[i % POLL_COLORS.length])}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )}
              <div className="relative px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">{option.text}</span>
                </div>
                {voted && (
                  <span className="text-xs font-bold text-muted-foreground">{pct}%</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {voted && (
        <div className="flex justify-center">
          <Button onClick={next} size="sm">
            {currentIdx + 1 < questions.length ? 'Next →' : 'Finish'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PollPlayer;
