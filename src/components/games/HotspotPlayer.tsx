import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { GameConfig } from '@/lib/gameTypes';

interface HotspotPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const HotspotPlayer = ({ config, onComplete }: HotspotPlayerProps) => {
  const hotspots = config.hotspots || [];
  const imageUrl = config.hotspotImage;
  const [found, setFound] = useState<Set<string>>(new Set());
  const [currentTarget, setCurrentTarget] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!imageUrl || hotspots.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hotspot image configured.</p>;
  }

  const target = hotspots[currentTarget];
  const isComplete = found.size === hotspots.length;

  const handleClick = (e: React.MouseEvent) => {
    if (isComplete || !target) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);
    if (dist <= target.radius) {
      const newFound = new Set(found);
      newFound.add(target.id);
      setFound(newFound);

      if (newFound.size === hotspots.length) {
        onComplete?.(hotspots.length, hotspots.length);
      } else {
        setCurrentTarget(prev => prev + 1);
      }
      toast.success(`Found: ${target.label}`);
    } else {
      toast.error('Try again! Click closer to the target.');
    }
  };

  const reset = () => {
    setFound(new Set());
    setCurrentTarget(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Found: <span className="font-bold text-foreground">{found.size}/{hotspots.length}</span></p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {!isComplete && target && (
        <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-foreground">Find: <span className="text-primary">{target.label}</span></p>
        </div>
      )}

      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative rounded-xl overflow-hidden border border-border cursor-crosshair"
      >
        <img src={`${imageUrl}?v=2`} alt="Hotspot" className="w-full block" />
        {/* Show found markers */}
        {hotspots.filter(h => found.has(h.id)).map(h => (
          <motion.div
            key={h.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute w-6 h-6 -ml-3 -mt-3 bg-success rounded-full border-2 border-white flex items-center justify-center shadow-lg"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            <span className="text-[10px] text-white font-bold">✓</span>
          </motion.div>
        ))}
      </div>

      {isComplete && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-4 bg-success/10 border border-success/30 rounded-xl">
          <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-bold text-foreground">All Found! 🎉</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default HotspotPlayer;
