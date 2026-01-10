import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, Star, Zap, Trophy, Flame, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const DailyBonusSpinner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [wonPrize, setWonPrize] = useState<typeof prizes[0] | null>(null);

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
      toast.success(`🎉 You won ${prize.name}!`);
    }, 4000);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-amber-500 shadow-gold flex items-center justify-center"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          y: [0, -5, 0],
          boxShadow: [
            '0 0 20px rgba(245, 158, 11, 0.4)',
            '0 0 40px rgba(245, 158, 11, 0.6)',
            '0 0 20px rgba(245, 158, 11, 0.4)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Gift className="w-6 h-6 text-white" />
        {!hasSpun && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">
            1
          </span>
        )}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSpinning && setIsOpen(false)}
          >
            <motion.div
              className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-gold" />
                  <h2 className="font-display font-bold text-foreground">Daily Bonus</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => !isSpinning && setIsOpen(false)}
                  disabled={isSpinning}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyBonusSpinner;
