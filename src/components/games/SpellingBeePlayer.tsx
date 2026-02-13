import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Volume2, Check, X, ArrowRight, Trophy, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameConfig } from '@/lib/gameTypes';

interface SpellingBeePlayerProps {
  config: GameConfig;
  onComplete: (score: number, maxScore: number) => void;
  level?: string;
}

const SpellingBeePlayer = ({ config, onComplete, level }: SpellingBeePlayerProps) => {
  const words = config.spellingBeeWords || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex) / words.length) * 100 : 0;

  const playAudio = useCallback(() => {
    if (!currentWord) return;
    setIsPlaying(true);
    if (currentWord.audioUrl) {
      const audio = new Audio(currentWord.audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
    } else {
      // Use Web Speech API as fallback
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  }, [currentWord]);

  useEffect(() => {
    if (currentWord && !completed) {
      const timer = setTimeout(() => playAudio(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, completed]);

  useEffect(() => {
    if (!completed) inputRef.current?.focus();
  }, [currentIndex, showResult, completed]);

  const handleSubmit = () => {
    if (!currentWord || !answer.trim()) return;
    const isCorrect = answer.trim().toLowerCase() === currentWord.word.toLowerCase();
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);
    setShowResult(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setShowResult(null);
      setAnswer('');
      if (currentIndex + 1 >= words.length) {
        setCompleted(true);
        onComplete(newScore, words.length);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1500);
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No spelling words configured for this game.</p>
      </div>
    );
  }

  if (completed) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center py-8 space-y-4">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Spelling Bee Complete!</h2>
        <p className="text-lg text-muted-foreground">
          You spelled <span className="font-bold text-foreground">{score}</span> out of{' '}
          <span className="font-bold text-foreground">{words.length}</span> words correctly
        </p>
        <div className="text-3xl font-bold text-foreground">
          {Math.round((score / words.length) * 100)}%
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-4">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Word {currentIndex + 1} of {words.length}</span>
          <span>Score: {score}/{currentIndex}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Word Card */}
      <Card className="p-6 text-center space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Play button */}
            <Button
              variant="outline" size="lg"
              className="rounded-full w-16 h-16 mx-auto mb-4"
              onClick={playAudio}
              disabled={isPlaying}
            >
              {isPlaying ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </Button>

            <p className="text-sm text-muted-foreground mb-1">Listen and spell the word</p>

            {currentWord.definition && (
              <p className="text-xs text-muted-foreground italic mb-2">
                Definition: {currentWord.definition}
              </p>
            )}
            {currentWord.sentence && (
              <p className="text-xs text-muted-foreground mb-2">
                "{currentWord.sentence.replace(new RegExp(currentWord.word, 'gi'), '______')}"
              </p>
            )}
            {currentWord.difficulty && (
              <Badge variant="outline" className="mb-3 text-[10px]">{currentWord.difficulty}</Badge>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Type the word..."
            className="text-center text-lg"
            disabled={showResult !== null}
          />
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={!answer.trim() || showResult !== null}
          className="w-full">
          <ArrowRight className="w-4 h-4 mr-1" /> Submit
        </Button>

        {/* Result feedback */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className={`p-3 rounded-lg ${
                showResult === 'correct' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2 font-medium">
                {showResult === 'correct' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {showResult === 'correct' ? 'Correct!' : `Wrong! The answer is: ${currentWord.word}`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default SpellingBeePlayer;
