import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakFireAnimationProps {
  streak: number;
  show: boolean;
  onComplete: () => void;
}

// Fire particle component
const FireParticle = ({ 
  delay, 
  x, 
  size, 
  color 
}: { 
  delay: number; 
  x: number; 
  size: number;
  color: string;
}) => (
  <motion.div
    className={cn("absolute rounded-full blur-sm", color)}
    style={{ 
      width: size, 
      height: size,
      left: `${50 + x}%`,
      bottom: 0 
    }}
    initial={{ y: 0, opacity: 0, scale: 0 }}
    animate={{ 
      y: [-20, -150 - Math.random() * 100],
      opacity: [0, 1, 1, 0],
      scale: [0.5, 1.2, 0.8, 0],
      x: [0, (Math.random() - 0.5) * 50]
    }}
    transition={{ 
      duration: 1.5 + Math.random() * 0.5,
      delay: delay,
      ease: "easeOut"
    }}
  />
);

// Fire emoji burst component
const FireEmoji = ({ 
  delay, 
  startX,
  startY,
  size 
}: { 
  delay: number; 
  startX: number;
  startY: number;
  size: number;
}) => (
  <motion.div
    className="absolute text-center pointer-events-none"
    style={{ 
      left: `${startX}%`,
      top: `${startY}%`,
      fontSize: size
    }}
    initial={{ opacity: 0, scale: 0, rotate: -20 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      scale: [0.3, 1.3, 1, 0.5],
      y: [0, -100, -200],
      rotate: [-20, 10, -10, 20],
    }}
    transition={{ 
      duration: 2,
      delay: delay,
      ease: "easeOut"
    }}
  >
    🔥
  </motion.div>
);

// Lightning bolt for high streaks
const LightningBolt = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute text-4xl pointer-events-none"
    style={{ left: `${x}%`, top: '20%' }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      scale: [0.5, 1.5, 1, 0],
    }}
    transition={{ 
      duration: 0.5,
      delay: delay,
    }}
  >
    ⚡
  </motion.div>
);

// Crown for legendary streaks
const Crown = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute text-6xl pointer-events-none left-1/2 -translate-x-1/2 top-[15%]"
    initial={{ opacity: 0, scale: 0, y: -50 }}
    animate={{ 
      opacity: [0, 1, 1],
      scale: [0.5, 1.2, 1],
      y: [-50, 0],
    }}
    transition={{ 
      duration: 0.8,
      delay: delay,
    }}
  >
    👑
  </motion.div>
);

const StreakFireAnimation = ({ streak, show, onComplete }: StreakFireAnimationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; x: number; size: number; color: string }>>([]);
  const [emojis, setEmojis] = useState<Array<{ id: number; delay: number; x: number; y: number; size: number }>>([]);

  // Determine fire intensity based on streak
  const getIntensity = () => {
    if (streak >= 100) return 'legendary'; // Gold fire + crown + lightning
    if (streak >= 50) return 'epic'; // Purple fire + lightning
    if (streak >= 30) return 'rare'; // Blue fire
    if (streak >= 14) return 'uncommon'; // Orange fire enhanced
    if (streak >= 7) return 'common'; // Orange fire
    return 'starter'; // Small fire
  };

  const intensity = getIntensity();

  // Generate particles based on intensity
  useEffect(() => {
    if (!show) return;

    const particleCounts = {
      starter: 8,
      common: 15,
      uncommon: 25,
      rare: 35,
      epic: 45,
      legendary: 60,
    };

    const colors = {
      starter: ['bg-orange-400', 'bg-yellow-400'],
      common: ['bg-orange-500', 'bg-red-500', 'bg-yellow-400'],
      uncommon: ['bg-orange-500', 'bg-red-600', 'bg-yellow-500', 'bg-amber-400'],
      rare: ['bg-blue-400', 'bg-cyan-400', 'bg-blue-600', 'bg-purple-400'],
      epic: ['bg-purple-500', 'bg-pink-500', 'bg-violet-600', 'bg-fuchsia-400'],
      legendary: ['bg-yellow-400', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'],
    };

    const count = particleCounts[intensity];
    const colorPalette = colors[intensity];

    // Generate fire particles
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 1.5,
      x: (Math.random() - 0.5) * 60,
      size: 8 + Math.random() * 16,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
    }));
    setParticles(newParticles);

    // Generate fire emojis
    const emojiCount = Math.min(streak, 30);
    const newEmojis = Array.from({ length: emojiCount }, (_, i) => ({
      id: i,
      delay: 0.5 + Math.random() * 2,
      x: 10 + Math.random() * 80,
      y: 70 + Math.random() * 20,
      size: 24 + Math.random() * 32,
    }));
    setEmojis(newEmojis);

    // Auto-close after animation
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [show, streak, intensity, onComplete]);

  const getStreakTitle = () => {
    if (streak >= 100) return '🏆 LEGENDARY STREAK! 🏆';
    if (streak >= 50) return '⚡ EPIC STREAK! ⚡';
    if (streak >= 30) return '💎 RARE STREAK! 💎';
    if (streak >= 14) return '🌟 GREAT STREAK! 🌟';
    if (streak >= 7) return '🔥 STREAK ON FIRE! 🔥';
    return '✨ Keep it going! ✨';
  };

  const getStreakColor = () => {
    if (streak >= 100) return 'from-yellow-400 via-amber-500 to-orange-600';
    if (streak >= 50) return 'from-purple-400 via-pink-500 to-violet-600';
    if (streak >= 30) return 'from-blue-400 via-cyan-500 to-blue-600';
    if (streak >= 14) return 'from-orange-400 via-red-500 to-amber-600';
    if (streak >= 7) return 'from-orange-500 via-red-500 to-yellow-500';
    return 'from-orange-400 to-yellow-500';
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Fire Particles */}
          <div className="absolute bottom-0 left-0 right-0 h-full overflow-hidden">
            {particles.map((p) => (
              <FireParticle key={p.id} delay={p.delay} x={p.x} size={p.size} color={p.color} />
            ))}
          </div>

          {/* Fire Emojis (TikTok gift style) */}
          <div className="absolute inset-0 overflow-hidden">
            {emojis.map((e) => (
              <FireEmoji key={e.id} delay={e.delay} startX={e.x} startY={e.y} size={e.size} />
            ))}
          </div>

          {/* Lightning for epic+ */}
          {(intensity === 'epic' || intensity === 'legendary') && (
            <>
              <LightningBolt delay={0.3} x={20} />
              <LightningBolt delay={0.6} x={80} />
              <LightningBolt delay={1} x={35} />
              <LightningBolt delay={1.3} x={65} />
            </>
          )}

          {/* Crown for legendary */}
          {intensity === 'legendary' && <Crown delay={0.8} />}

          {/* Main Content */}
          <motion.div
            className="relative z-10 text-center px-6"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
          >
            {/* Animated Fire Icon */}
            <motion.div
              className="relative mx-auto mb-4"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
            >
              <div className={cn(
                "w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center",
                "bg-gradient-to-br shadow-2xl",
                getStreakColor()
              )}>
                <Flame className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
              </div>
              {/* Glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-full blur-2xl opacity-60",
                "bg-gradient-to-br",
                getStreakColor()
              )} />
            </motion.div>

            {/* Streak Number */}
            <motion.div
              className={cn(
                "text-6xl md:text-8xl font-display font-black mb-2",
                "bg-gradient-to-br bg-clip-text text-transparent",
                getStreakColor()
              )}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
            >
              {streak}
            </motion.div>

            <motion.p
              className="text-white/90 text-lg md:text-xl font-medium mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Day Streak!
            </motion.p>

            {/* Title */}
            <motion.p
              className="text-2xl md:text-3xl font-display font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {getStreakTitle()}
            </motion.p>

            {/* Tap to continue */}
            <motion.p
              className="text-white/60 text-sm mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ delay: 2, duration: 2, repeat: Infinity }}
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakFireAnimation;
