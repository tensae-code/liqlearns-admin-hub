import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface FireParticle {
  id: number;
  x: number;
  delay: number;
  size: number;
}

interface StreakGiftAnimationProps {
  currentStreak: number;
  onClose: () => void;
  show: boolean;
}

const StreakGiftAnimation: React.FC<StreakGiftAnimationProps> = ({ 
  currentStreak, 
  onClose,
  show
}) => {
  const [fireParticles, setFireParticles] = useState<FireParticle[]>([]);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Determine intensity based on streak
  const getIntensity = () => {
    if (currentStreak >= 100) return 'legendary';
    if (currentStreak >= 50) return 'epic';
    if (currentStreak >= 30) return 'fire';
    if (currentStreak >= 14) return 'hot';
    if (currentStreak >= 7) return 'warm';
    return 'starter';
  };

  const intensity = getIntensity();

  const getStreakTitle = () => {
    switch (intensity) {
      case 'legendary': return '🏆 LEGENDARY STREAK!';
      case 'epic': return '⚡ EPIC STREAK!';
      case 'fire': return '🔥 ON FIRE!';
      case 'hot': return '🌟 HOT STREAK!';
      case 'warm': return '✨ STREAK MASTER!';
      default: return '🔥 STREAK STARTED!';
    }
  };

  const getGlowColor = () => {
    switch (intensity) {
      case 'legendary': return 'from-purple-500 via-pink-500 to-yellow-400';
      case 'epic': return 'from-blue-500 via-purple-500 to-pink-500';
      case 'fire': return 'from-red-500 via-orange-500 to-yellow-400';
      case 'hot': return 'from-orange-500 via-amber-500 to-yellow-400';
      default: return 'from-orange-400 via-amber-400 to-yellow-300';
    }
  };

  useEffect(() => {
    if (!show) return;

    // Generate fire particles
    const particleCount = intensity === 'legendary' ? 30 : intensity === 'epic' ? 25 : intensity === 'fire' ? 20 : 15;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      delay: Math.random() * 0.5,
      size: Math.random() * 30 + 20,
    }));
    setFireParticles(particles);

    // Generate sparkles
    const sparkleCount = intensity === 'legendary' ? 20 : 12;
    const newSparkles = Array.from({ length: sparkleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 300 - 150,
      y: Math.random() * -200 - 50,
    }));
    setSparkles(newSparkles);
  }, [show, intensity]);

  if (!show) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="streak-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ 
          background: 'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
        }}
        onClick={onClose}
      >
        {/* Central Fire Container */}
        <motion.div
          key="fire-content"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pulsing Glow Effect */}
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute w-64 h-64 bg-gradient-to-r ${getGlowColor()} rounded-full blur-3xl`}
          />

          {/* Secondary Glow */}
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className={`absolute w-80 h-80 bg-gradient-to-r ${getGlowColor()} rounded-full blur-[80px] opacity-40`}
          />

          {/* Fire Particles Rising */}
          {fireParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                y: 50,
                x: particle.x * 0.3,
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                y: [-50, -200, -350],
                x: particle.x,
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeOut"
              }}
              className="absolute"
              style={{ fontSize: particle.size }}
            >
              🔥
            </motion.div>
          ))}

          {/* Main Fire Display */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-[120px] sm:text-[150px] relative z-10"
          >
            🔥
          </motion.div>

          {/* Streak Number */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 text-center -mt-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-6xl sm:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,150,0,0.8)]"
            >
              {currentStreak}
            </motion.div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-200 uppercase tracking-widest mt-2">
              Day Streak
            </div>
          </motion.div>

          {/* Streak Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-2xl sm:text-3xl font-bold text-white drop-shadow-lg relative z-10"
          >
            {getStreakTitle()}
          </motion.div>

          {/* Sparkle Particles */}
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                x: sparkle.x,
                y: sparkle.y,
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 1,
                ease: "easeOut"
              }}
              className="absolute z-20"
            >
              <Sparkles 
                className="w-6 h-6 text-yellow-300" 
                fill="currentColor"
              />
            </motion.div>
          ))}

          {/* Lightning bolts for epic+ streaks */}
          {(intensity === 'epic' || intensity === 'legendary') && (
            <>
              <motion.div
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1 }}
                className="absolute -left-20 top-10 text-5xl"
              >
                ⚡
              </motion.div>
              <motion.div
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1.2 }}
                className="absolute -right-20 top-10 text-5xl"
              >
                ⚡
              </motion.div>
            </>
          )}

          {/* Crown for legendary streaks */}
          {intensity === 'legendary' && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="absolute -top-32 text-6xl"
            >
              <motion.div
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👑
              </motion.div>
            </motion.div>
          )}

          {/* Tap to continue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8 text-white/60 text-sm relative z-10"
          >
            Tap anywhere to continue
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StreakGiftAnimation;
