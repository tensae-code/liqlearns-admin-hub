import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, Trophy, Users, Sparkles, Play, Star, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import heroBg from '@/assets/hero-bg.jpg';

const Hero = () => {
  const navigate = useNavigate();
  const { user, getDashboardPath } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background with warm gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-accent/70" />
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 right-20 w-20 h-20 rounded-2xl bg-gradient-gold shadow-gold flex items-center justify-center animate-float hidden md:flex"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <Trophy className="w-10 h-10 text-gold-foreground" />
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-40 w-16 h-16 rounded-xl bg-gradient-accent shadow-glow flex items-center justify-center animate-float-delayed hidden md:flex"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <Sparkles className="w-8 h-8 text-accent-foreground" />
      </motion.div>

      <motion.div
        className="absolute top-40 left-20 w-14 h-14 rounded-xl bg-success/80 shadow-lg flex items-center justify-center animate-float hidden lg:flex"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
      >
        <Star className="w-7 h-7 text-success-foreground" />
      </motion.div>

      {/* Content */}
      <div className="container relative z-10 pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-foreground">Start learning today with a 3-day free trial</span>
            </span>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Learn Smarter,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent">
              Earn More
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Join thousands of students mastering new skills with gamified learning, 
            expert instructors, and a community that rewards your progress.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {user ? (
              <Button 
                variant="gold" 
                size="xl"
                onClick={() => navigate(getDashboardPath())}
              >
                <LayoutDashboard className="w-5 h-5" />
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="gold" 
                  size="xl"
                  onClick={() => navigate('/auth')}
                >
                  <BookOpen className="w-5 h-5" />
                  Get Started Free
                </Button>
                <Button 
                  variant="glass" 
                  size="xl"
                  onClick={() => navigate('/auth')}
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Button>
              </>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap gap-4 sm:gap-6 md:gap-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-primary-foreground">12.5K+</p>
                <p className="text-xs sm:text-sm text-primary-foreground/60">Active Students</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-primary-foreground">150+</p>
                <p className="text-xs sm:text-sm text-primary-foreground/60">Expert Courses</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-primary-foreground">875K</p>
                <p className="text-xs sm:text-sm text-primary-foreground/60">Lessons Completed</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
