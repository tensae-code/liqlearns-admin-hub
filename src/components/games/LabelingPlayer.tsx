import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tag, Check, RotateCcw, Trophy, X } from 'lucide-react';

interface LabelingPlayerProps {
  config: {
    labelingImage?: string;
    labels?: { id: string; text: string; x: number; y: number }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const LabelingPlayer = ({ config, onComplete }: LabelingPlayerProps) => {
  const labels = config.labels || [];
  const image = config.labelingImage;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  // Available labels to drag/pick from
  const [availableLabels, setAvailableLabels] = useState(() =>
    [...labels].sort(() => Math.random() - 0.5).map(l => l.text)
  );
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const handleSpotClick = (id: string) => {
    if (checked) return;
    if (selectedLabel) {
      // Place label
      setAnswers(prev => ({ ...prev, [id]: selectedLabel }));
      setAvailableLabels(prev => prev.filter(l => l !== selectedLabel));
      // If spot had a previous label, return it
      if (answers[id]) {
        setAvailableLabels(prev => [...prev, answers[id]]);
      }
      setSelectedLabel(null);
    } else if (answers[id]) {
      // Remove placed label
      setAvailableLabels(prev => [...prev, answers[id]]);
      setAnswers(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    labels.forEach(l => {
      if (answers[l.id]?.toLowerCase() === l.text.toLowerCase()) correct++;
    });
    setScore(correct);
    setChecked(true);
    onComplete?.(correct, labels.length);
  };

  const reset = () => {
    setAnswers({});
    setChecked(false);
    setScore(0);
    setSelectedLabel(null);
    setAvailableLabels([...labels].sort(() => Math.random() - 0.5).map(l => l.text));
  };

  if (labels.length === 0) return <p className="text-center text-muted-foreground py-8">No labels configured</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
        <Tag className="w-4 h-4" /> Select a label, then tap its spot
      </p>

      {/* Image with spots */}
      <div className="relative bg-muted/30 rounded-xl overflow-hidden border border-border" style={{ minHeight: 200 }}>
        {image && <img src={image} alt="Labeling" className="w-full h-auto" />}
        {!image && <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Diagram Area</div>}
        {labels.map(label => {
          const placed = answers[label.id];
          const isRight = checked && placed?.toLowerCase() === label.text.toLowerCase();
          const isWrong = checked && placed && placed.toLowerCase() !== label.text.toLowerCase();
          return (
            <motion.button
              key={label.id}
              className={cn(
                'absolute w-auto min-w-[28px] h-7 rounded-full text-[10px] font-bold flex items-center justify-center px-2 border-2 transition-all',
                isRight ? 'bg-emerald-500 border-emerald-600 text-white' :
                isWrong ? 'bg-destructive border-destructive text-white' :
                placed ? 'bg-primary border-primary text-primary-foreground' :
                'bg-card border-dashed border-primary/50 text-primary animate-pulse'
              )}
              style={{ left: `${label.x}%`, top: `${label.y}%`, transform: 'translate(-50%, -50%)' }}
              onClick={() => handleSpotClick(label.id)}
              whileTap={{ scale: 0.9 }}
            >
              {placed || '?'}
              {checked && isWrong && <span className="ml-1 text-[8px] opacity-80">→ {label.text}</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Label bank */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {availableLabels.map((label, i) => (
          <motion.button
            key={`${label}-${i}`}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all',
              selectedLabel === label
                ? 'bg-primary border-primary text-primary-foreground scale-105'
                : 'bg-card border-border text-foreground hover:border-primary/50'
            )}
            onClick={() => setSelectedLabel(selectedLabel === label ? null : label)}
            whileTap={{ scale: 0.95 }}
          >
            {label}
          </motion.button>
        ))}
        {availableLabels.length === 0 && !checked && (
          <span className="text-xs text-muted-foreground">All labels placed</span>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {!checked ? (
          <Button onClick={checkAnswers} disabled={Object.keys(answers).length < labels.length} size="sm">
            <Check className="w-4 h-4 mr-1" /> Check
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {score === labels.length ? (
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-bold text-foreground">Perfect! 🎉</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{score}/{labels.length} correct</span>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabelingPlayer;
