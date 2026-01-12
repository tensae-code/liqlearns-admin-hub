import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';

interface StreakGiftAnimationProps {
  currentStreak: number;
  longestStreak?: number;
  onClose: () => void;
  show: boolean;
}

const StreakGiftAnimation: React.FC<StreakGiftAnimationProps> = ({ 
  currentStreak, 
  longestStreak = 10,
  onClose,
  show
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  
  const actualLongestStreak = Math.max(currentStreak, longestStreak);
  const totalStreaks = Math.floor(currentStreak * 1.5);

  useEffect(() => {
    if (!show) {
      setShowStreakPopup(false);
      return;
    }

    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * -100 - 50
    }));
    setParticles(newParticles);

    const popupTimer = setTimeout(() => {
      setShowStreakPopup(true);
    }, 600);

    return () => {
      clearTimeout(popupTimer);
    };
  }, [show]);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayLetter = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      const isActive = i === 0 || Math.random() > 0.3;
      days.push({ dayLetter, isActive });
    }
    return days;
  };

  const last7Days = getLast7Days();

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
          background: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
        }}
        onClick={onClose}
      >
        {/* Main Streak Container */}
        <motion.div
          key="streak-content"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          exit={{ 
            scale: 0,
            y: -100,
            opacity: 0
          }}
          transition={{
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1],
            times: [0, 0.5, 1]
          }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow Effect */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl blur-3xl opacity-60"
          />

          {/* Main Box */}
          <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-3xl p-8 sm:p-12 shadow-2xl border-4 border-yellow-300 max-w-md w-full mx-4">
            {/* Lightning Icon */}
            <motion.div
              animate={{
                rotate: [0, -15, 15, -15, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2"
            >
              <div className="bg-yellow-400 rounded-full p-4 shadow-lg">
                <Zap className="w-12 h-12 text-orange-600 fill-orange-600" />
              </div>
            </motion.div>

            {/* Streak Number */}
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-center mb-4"
              >
                <div className="text-7xl sm:text-8xl font-black text-white drop-shadow-2xl">
                  {currentStreak}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-200 uppercase tracking-wider mt-2">
                  Day Streak
                </div>
              </motion.div>

              {/* Fire Emoji */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-5xl mt-2"
              >
                🔥
              </motion.div>
            </div>

            {/* Streak stats popup */}
            <AnimatePresence>
              {showStreakPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mt-6 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30"
                >
                  {/* Streak Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{currentStreak}</div>
                      <div className="text-xs text-yellow-100">Current</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{actualLongestStreak}</div>
                      <div className="text-xs text-yellow-100">Longest</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{totalStreaks}</div>
                      <div className="text-xs text-yellow-100">Total</div>
                    </div>
                  </div>

                  {/* 7-Day Activity Calendar */}
                  <div className="flex justify-center gap-2">
                    {last7Days.map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            day.isActive 
                              ? 'bg-yellow-400 text-orange-600 shadow-lg scale-110' 
                              : 'bg-white/30 text-white/60'
                          }`}
                        >
                          {day.dayLetter}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Celebration Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <div className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
                Keep it burning! 🚀
              </div>
            </motion.div>

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onClose}
              className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold rounded-xl transition-all border border-white/30"
            >
              Close
            </motion.button>
          </div>

          {/* Sparkle Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 1,
                scale: 0
              }}
              animate={{ 
                x: particle.x,
                y: particle.y,
                opacity: [1, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                times: [0, 0.5, 1]
              }}
              className="absolute top-1/2 left-1/2"
            >
              <Sparkles 
                className="w-8 h-8 text-yellow-300" 
                fill="currentColor"
              />
            </motion.div>
          ))}

          {/* Side Confetti */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ 
              scale: [0, 1.5, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.5, 1]
            }}
            className="absolute -left-16 top-0"
          >
            <div className="text-5xl">🎉</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ 
              scale: [0, 1.5, 0],
              rotate: [0, -180, -360]
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.5, 1]
            }}
            className="absolute -right-16 top-0"
          >
            <div className="text-5xl">🎊</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              y: [0, 50, 100]
            }}
            transition={{
              duration: 2,
              times: [0, 0.5, 1]
            }}
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <div className="text-4xl">⭐</div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StreakGiftAnimation;
