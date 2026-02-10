import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Keyboard, RotateCcw, Trophy, Timer, Zap } from 'lucide-react';

interface TypeRacerPlayerProps {
  config: {
    typeRacerTexts?: { text: string; difficulty?: string }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const TypeRacerPlayer = ({ config, onComplete }: TypeRacerPlayerProps) => {
  const texts = config.typeRacerTexts || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [allDone, setAllDone] = useState(false);
  const [results, setResults] = useState<{ wpm: number; accuracy: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const current = texts[currentIdx];

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTyping = () => {
    setStarted(true);
    setStartTime(Date.now());
    setInput('');
    setFinished(false);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - Date.now()) / 1000));
    }, 100);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInput = (val: string) => {
    if (!started || finished) return;
    setInput(val);
    setElapsed(Math.floor((Date.now() - startTime) / 1000));

    // Calculate accuracy
    let correct = 0;
    const target = current.text;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === target[i]) correct++;
    }
    const acc = val.length > 0 ? Math.round((correct / val.length) * 100) : 100;
    setAccuracy(acc);

    // Check completion
    if (val === target) {
      const secs = (Date.now() - startTime) / 1000;
      const words = target.split(' ').length;
      const calcWpm = Math.round((words / secs) * 60);
      setWpm(calcWpm);
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setResults(prev => [...prev, { wpm: calcWpm, accuracy: acc }]);
    }
  };

  const next = () => {
    if (currentIdx + 1 < texts.length) {
      setCurrentIdx(prev => prev + 1);
      setStarted(false);
      setFinished(false);
      setInput('');
      setElapsed(0);
    } else {
      setAllDone(true);
      const avgWpm = Math.round(results.reduce((s, r) => s + r.wpm, 0) / results.length);
      onComplete?.(avgWpm, 100);
    }
  };

  if (!current) return <p className="text-center text-muted-foreground py-8">No texts configured</p>;

  if (allDone) {
    const avgWpm = Math.round(results.reduce((s, r) => s + r.wpm, 0) / results.length);
    const avgAcc = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 space-y-3">
        <Trophy className="w-10 h-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-lg text-foreground">Complete!</p>
        <div className="flex gap-4 justify-center text-sm">
          <span className="text-muted-foreground">Avg WPM: <b className="text-foreground">{avgWpm}</b></span>
          <span className="text-muted-foreground">Avg Accuracy: <b className="text-foreground">{avgAcc}%</b></span>
        </div>
        <Button variant="outline" onClick={() => { setCurrentIdx(0); setAllDone(false); setResults([]); setStarted(false); setFinished(false); setInput(''); }}>
          <RotateCcw className="w-4 h-4 mr-1" /> Play Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{currentIdx + 1}/{texts.length}</p>
        {started && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><Timer className="w-3 h-3" />{elapsed}s</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Zap className="w-3 h-3" />{accuracy}%</span>
          </div>
        )}
      </div>

      {/* Target text */}
      <div className="p-4 bg-muted/30 rounded-xl border border-border font-mono text-sm leading-relaxed">
        {current.text.split('').map((char, i) => {
          let color = 'text-muted-foreground';
          if (i < input.length) {
            color = input[i] === char ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive bg-destructive/10';
          } else if (i === input.length && started && !finished) {
            color = 'text-foreground bg-primary/20 rounded px-0.5';
          }
          return (
            <span key={i} className={cn(color, 'transition-colors')}>
              {char}
            </span>
          );
        })}
      </div>

      {!started ? (
        <Button onClick={startTyping} className="w-full">
          <Keyboard className="w-4 h-4 mr-2" /> Start Typing
        </Button>
      ) : finished ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
          <div className="flex gap-4 justify-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-emerald-600">{wpm}</p>
              <p className="text-[10px] text-muted-foreground">WPM</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
              <p className="text-[10px] text-muted-foreground">Accuracy</p>
            </div>
          </div>
          <Button size="sm" onClick={next}>{currentIdx + 1 < texts.length ? 'Next →' : 'Finish'}</Button>
        </motion.div>
      ) : (
        <input
          ref={inputRef}
          value={input}
          onChange={e => handleInput(e.target.value)}
          className="w-full p-3 bg-card border-2 border-primary/30 rounded-xl font-mono text-sm focus:outline-none focus:border-primary transition-colors"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      )}
    </div>
  );
};

export default TypeRacerPlayer;
