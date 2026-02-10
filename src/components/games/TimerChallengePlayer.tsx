import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Timer, RotateCcw, Trophy, Play } from 'lucide-react';
import type { GameConfig, GameItem } from '@/lib/gameTypes';

interface TimerChallengePlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const TimerChallengePlayer = ({ config, onComplete }: TimerChallengePlayerProps) => {
  const timeLimit = config.timeLimit || 60;
  const taskType = config.taskType || 'rapid_response';
  const items = config.items || [];

  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (started && timeLeft > 0 && !finished) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && started) {
      setFinished(true);
      onComplete?.(answers.length, items.length || answers.length);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [started, timeLeft, finished]);

  const start = () => {
    setStarted(true);
    setTimeLeft(timeLimit);
    setCurrentIdx(0);
    setAnswer('');
    setAnswers([]);
    setFinished(false);
  };

  const submitAnswer = () => {
    if (!answer.trim()) return;
    setAnswers(prev => [...prev, answer.trim()]);
    setAnswer('');
    if (taskType === 'rapid_response' && currentIdx < items.length - 1) {
      setCurrentIdx(i => i + 1);
    } else if (taskType === 'rapid_response' && currentIdx >= items.length - 1) {
      setFinished(true);
      onComplete?.(answers.length + 1, items.length);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / timeLimit) * 100;

  if (!started) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary mx-auto flex items-center justify-center">
          <Timer className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground">Timer Challenge</p>
          <p className="text-sm text-muted-foreground">
            {taskType === 'writing' ? `Write as much as you can in ${formatTime(timeLimit)}` :
             taskType === 'rapid_response' ? `Answer ${items.length} prompts before time runs out` :
             `Complete the quiz in ${formatTime(timeLimit)}`}
          </p>
        </div>
        <Button onClick={start}>
          <Play className="w-4 h-4 mr-1" /> Start
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn('text-lg font-bold', timeLeft <= 10 ? 'text-destructive' : 'text-foreground')}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-muted-foreground">{answers.length} answers</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', timeLeft <= 10 ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {!finished ? (
        <>
          {/* Current prompt */}
          {taskType === 'rapid_response' && items[currentIdx] && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
              <p className="text-lg font-bold text-foreground">{items[currentIdx].text}</p>
              <p className="text-xs text-muted-foreground mt-1">{currentIdx + 1}/{items.length}</p>
            </div>
          )}

          {/* Input */}
          {taskType === 'writing' ? (
            <Textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Start writing..."
              className="min-h-[120px]"
              autoFocus
            />
          ) : (
            <div className="flex gap-2">
              <Input
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
                onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              />
              <Button onClick={submitAnswer}>Go</Button>
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl"
        >
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">
            {taskType === 'writing' ? 'Time\'s up!' : `${answers.length} answers!`}
          </p>
          {taskType === 'writing' && (
            <p className="text-sm text-muted-foreground">{answer.split(/\s+/).filter(Boolean).length} words written</p>
          )}
          <Button size="sm" variant="outline" className="mt-3" onClick={start}>
            <RotateCcw className="w-4 h-4 mr-1" /> Try Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default TimerChallengePlayer;
