import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Headphones, Check, RotateCcw, Trophy, Volume2, ArrowRight, EyeOff } from 'lucide-react';

interface ListenSpellPlayerProps {
  config: {
    listenSpellItems?: { id: string; text: string; audioUrl?: string; hint?: string }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const ListenSpellPlayer = ({ config, onComplete }: ListenSpellPlayerProps) => {
  const items = config.listenSpellItems || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const current = items[currentIdx];

  const playAudio = () => {
    if (!current) return;
    if (current.audioUrl) {
      const audio = new Audio(current.audioUrl);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
    } else {
      // Use browser TTS as fallback
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(current.text);
      utterance.rate = 0.8;
      synthRef.current = utterance;
      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const checkAnswer = () => {
    const correct = userInput.trim().toLowerCase() === current.text.toLowerCase();
    setIsCorrect(correct);
    setChecked(true);
    if (correct) setScore(prev => prev + 1);
  };

  const next = () => {
    if (currentIdx + 1 < items.length) {
      setCurrentIdx(prev => prev + 1);
      setUserInput('');
      setChecked(false);
      setIsCorrect(false);
      setShowHint(false);
    } else {
      setFinished(true);
      onComplete?.(score, items.length);
    }
  };

  if (!current) return <p className="text-center text-muted-foreground py-8">No items configured</p>;

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 space-y-3">
        <Trophy className="w-10 h-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-lg text-foreground">Complete!</p>
        <p className="text-muted-foreground">{score}/{items.length} correct</p>
        <Button variant="outline" onClick={() => { setCurrentIdx(0); setScore(0); setFinished(false); setUserInput(''); setChecked(false); }}>
          <RotateCcw className="w-4 h-4 mr-1" /> Play Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{currentIdx + 1}/{items.length}</p>
        <p className="text-xs font-medium text-foreground">Score: {score}</p>
      </div>

      <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
        <Headphones className="w-4 h-4" /> Listen carefully, then spell what you hear
      </p>

      {/* Play button */}
      <div className="flex justify-center">
        <motion.button
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center transition-all',
            isPlaying
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          )}
          onClick={playAudio}
          whileTap={{ scale: 0.95 }}
          animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
          transition={isPlaying ? { repeat: Infinity, duration: 1 } : {}}
        >
          <Volume2 className={cn('w-8 h-8', isPlaying && 'animate-pulse')} />
        </motion.button>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder="Type what you heard..."
          disabled={checked}
          onKeyDown={e => e.key === 'Enter' && !checked && userInput.trim() && checkAnswer()}
          className="flex-1"
        />
        {!checked ? (
          <Button onClick={checkAnswer} disabled={!userInput.trim()} size="sm">
            <Check className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={next} size="sm">
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Hint */}
      {current.hint && !checked && (
        <button onClick={() => setShowHint(true)} className="flex items-center gap-1 text-xs text-muted-foreground mx-auto hover:text-foreground">
          <EyeOff className="w-3 h-3" /> {showHint ? current.hint : 'Show hint'}
        </button>
      )}

      {checked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={cn('text-center text-sm p-2 rounded-lg',
            isCorrect ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-destructive bg-destructive/10'
          )}
        >
          {isCorrect ? '✅ Correct!' : `❌ Answer: ${current.text}`}
        </motion.div>
      )}
    </div>
  );
};

export default ListenSpellPlayer;
