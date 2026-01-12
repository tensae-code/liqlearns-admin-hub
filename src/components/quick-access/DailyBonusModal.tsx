import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, Star, Zap, Trophy, Flame, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const prizes = [
  { name: '50 XP', icon: Zap, color: 'text-accent', value: 50 },
  { name: '100 XP', icon: Star, color: 'text-gold', value: 100 },
  { name: '25 Aura', icon: Sparkles, color: 'text-success', value: 25 },
  { name: '50 Aura', icon: Sparkles, color: 'text-gold', value: 50 },
  { name: 'Badge', icon: Trophy, color: 'text-streak', value: 1 },
  { name: 'Streak Shield', icon: Flame, color: 'text-destructive', value: 1 },
  { name: '200 XP', icon: Crown, color: 'text-accent', value: 200 },
  { name: '100 Aura', icon: Star, color: 'text-gold', value: 100 },
];

interface DailyBonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DailyBonusModal = ({ open, onOpenChange }: DailyBonusModalProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(() => {
    const lastSpin = localStorage.getItem('dailyBonusLastSpin');
    if (lastSpin) {
      const lastSpinDate = new Date(lastSpin);
      const today = new Date();
      return lastSpinDate.toDateString() === today.toDateString();
    }
    return false;
  });
  const [wonPrize, setWonPrize] = useState<typeof prizes[0] | null>(null);

  useEffect(() => {
    // Check if it's a new day
    const lastSpin = localStorage.getItem('dailyBonusLastSpin');
    if (lastSpin) {
      const lastSpinDate = new Date(lastSpin);
      const today = new Date();
      if (lastSpinDate.toDateString() !== today.toDateString()) {
        setHasSpun(false);
        setWonPrize(null);
      }
    }
  }, [open]);

  const spin = () => {
    if (isSpinning || hasSpun) return;
    
    setIsSpinning(true);
    setWonPrize(null);
    
    // Random prize selection
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[prizeIndex];
    
    // Calculate rotation (5 full spins + landing on prize)
    const segmentAngle = 360 / prizes.length;
    const targetAngle = 360 * 5 + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));
    
    setRotation(prev => prev + targetAngle);
    
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      setWonPrize(prize);
      localStorage.setItem('dailyBonusLastSpin', new Date().toISOString());
      localStorage.setItem('dailyBonusClaimed', 'true');
      toast.success(`🎉 You won ${prize.name}!`);
    }, 4000);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !isSpinning && onOpenChange(value)}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-gold" />
            Daily Bonus
          </DialogTitle>
        </DialogHeader>

        {/* Spinner Wheel */}
        <div className="relative w-64 h-64 mx-auto mb-6">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-accent" />
          </div>

          {/* Wheel */}
          <motion.div
            className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg overflow-hidden relative"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.2, 0.8, 0.3, 1] }}
          >
            {prizes.map((prize, i) => {
              const angle = (360 / prizes.length) * i;
              const PrizeIcon = prize.icon;
              return (
                <div
                  key={i}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div 
                    className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center"
                    style={{ transform: `rotate(${22.5}deg)` }}
                  >
                    <PrizeIcon className={`w-5 h-5 ${prize.color} mb-1`} />
                    <span className="text-[10px] font-medium text-white/90">{prize.name}</span>
                  </div>
                  {/* Segment divider */}
                  <div 
                    className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-white/20"
                  />
                </div>
              );
            })}
            {/* Center circle */}
            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-card border-4 border-gold flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gold" />
            </div>
          </motion.div>
        </div>

        {/* Won Prize Display */}
        <AnimatePresence>
          {wonPrize && (
            <motion.div
              className="text-center mb-4 p-4 rounded-xl bg-gold/10 border border-gold/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-lg font-display font-bold text-gold">
                🎉 You won {wonPrize.name}!
              </p>
              <p className="text-sm text-muted-foreground">Reward added to your account</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spin Button */}
        <Button
          className="w-full bg-gradient-to-r from-gold to-amber-500 text-white font-bold py-3"
          onClick={spin}
          disabled={isSpinning || hasSpun}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.span>
              Spinning...
            </span>
          ) : hasSpun ? (
            'Come back tomorrow!'
          ) : (
            <span className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Spin the Wheel!
            </span>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default DailyBonusModal;
