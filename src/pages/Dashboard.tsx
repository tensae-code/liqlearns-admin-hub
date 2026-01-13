import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useStreakAnimation } from '@/hooks/useStreakAnimation';
import { useStudyTime } from '@/hooks/useStudyTime';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AICoach from '@/components/dashboard/AICoach';
import StudyTimeTracker from '@/components/dashboard/StudyTimeTracker';
import AcquiredSkillsList from '@/components/dashboard/AcquiredSkillsList';
import StreakGiftAnimation from '@/components/streak/StreakGiftAnimation';
import StatsPopupCard from '@/components/dashboard/StatsPopupCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Trophy, 
  Flame, 
  Target,
  Clock,
  ChevronRight,
  Star,
  Award,
  Play,
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar
} from 'lucide-react';

import { STAT_GRADIENTS } from '@/lib/theme';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { profile, updateStreak } = useProfile();
  const navigate = useNavigate();
  const {
    totalTodaySeconds,
    isStreakEligible,
    formatTime,
    STREAK_REQUIREMENT_SECONDS,
    streakProgress,
  } = useStudyTime();
  
  // Stats popup state
  const [activePopup, setActivePopup] = useState<'streak' | 'xp' | 'badges' | 'aura' | null>(null);
  const [showClanPopup, setShowClanPopup] = useState(false);
  
  // Streak animation hook
  const { showAnimation, closeAnimation, triggerAnimation } = useStreakAnimation(
    profile?.current_streak || 0,
    user?.id
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect underage users to kids dashboard
  useEffect(() => {
    if (profile && profile.birthday) {
      const birthDate = new Date(profile.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 16) {
        navigate('/dashboard/kids');
      }
    }
  }, [profile, navigate]);

  // Update streak on dashboard load
  useEffect(() => {
    if (user && profile) {
      updateStreak();
    }
  }, [user, profile?.id]);

  // Dynamic quests based on actual activity
  const quests = useMemo(() => {
    const studyMinutes = Math.floor(totalTodaySeconds / 60);
    const studyGoalMet = studyMinutes >= 30;
    
    return [
      { 
        id: 'study-room', 
        title: 'Study for 30 minutes', 
        xp: 100, 
        completed: studyGoalMet,
        progress: Math.min(studyMinutes, 30),
        target: 30,
        unit: 'min'
      },
      { 
        id: 'daily-quiz', 
        title: 'Complete daily quiz', 
        xp: 50, 
        completed: false,
        progress: 0,
        target: 1,
        unit: 'quiz'
      },
      { 
        id: 'video-lesson', 
        title: 'Watch a video lesson', 
        xp: 30, 
        completed: false,
        progress: 0,
        target: 1,
        unit: 'video'
      },
      { 
        id: 'flashcards', 
        title: 'Practice flashcards (15 cards)', 
        xp: 25, 
        completed: false,
        progress: 0,
        target: 15,
        unit: 'cards'
      },
      { 
        id: 'streak', 
        title: 'Maintain your streak', 
        xp: 75, 
        completed: isStreakEligible,
        progress: isStreakEligible ? 1 : 0,
        target: 1,
        unit: 'day'
      },
    ];
  }, [totalTodaySeconds, isStreakEligible]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');

  const stats = [
    { icon: BookOpen, label: 'Lessons', value: '24', gradient: STAT_GRADIENTS[0], clickable: false },
    { icon: Award, label: 'Badges', value: '5', gradient: STAT_GRADIENTS[1], clickable: true, popupType: 'badges' as const },
    { icon: Star, label: 'XP', value: profile?.xp_points?.toLocaleString() || '0', gradient: STAT_GRADIENTS[2], clickable: true, popupType: 'xp' as const },
    { icon: Flame, label: 'Streak', value: profile?.current_streak?.toString() || '0', gradient: STAT_GRADIENTS[3], clickable: true, popupType: 'streak' as const },
    { icon: Sparkles, label: 'Aura', value: '1,250', gradient: 'from-violet-500 to-purple-600', clickable: true, popupType: 'aura' as const },
  ];

  const courses = [
    { title: 'Amharic Basics', progress: 65, lessons: 24, icon: '📚', category: 'Language' },
    { title: 'Ethiopian Culture', progress: 30, lessons: 18, icon: '🏛️', category: 'Culture' },
    { title: 'Web Development', progress: 80, lessons: 32, icon: '💻', category: 'Technology' },
  ];

  const completedCount = quests.filter(q => q.completed).length;
  const totalXP = quests.filter(q => q.completed).reduce((sum, q) => sum + q.xp, 0);

  return (
    <DashboardLayout>
      {/* Welcome Header */}
      <motion.div
        className="mb-4 md:mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
              Good morning! 👋
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">Continue your learning journey — {formattedDate}</p>
          </div>
          <div 
            className="hidden md:flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20 cursor-pointer hover:border-violet-500/40 transition-all"
            onClick={() => setShowClanPopup(true)}
          >
            <span className="text-sm font-bold text-foreground">Eliteforce</span>
            <span className="text-[10px] text-violet-600 font-medium">Leader • Clan</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Colorful Gradient Cards - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.clickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => stat.clickable && stat.popupType && setActivePopup(stat.popupType)}
            whileHover={stat.clickable ? { y: -2 } : {}}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
            <stat.icon className="w-6 h-6 mb-2 opacity-90" />
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs opacity-80">{stat.label}</p>
            {stat.clickable && (
              <p className="text-[10px] opacity-60 mt-1">Tap for details</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Quest - Now with real tracking */}
        <motion.div
          className="lg:col-span-1 bg-card rounded-xl border border-border p-4 md:p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-display font-semibold text-foreground">Today's Quest</h2>
            <div className="text-sm text-muted-foreground">
              {completedCount}/{quests.length}
            </div>
          </div>

          <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
            {quests.map((quest) => (
              <motion.div
                key={quest.id}
                className={`p-2.5 md:p-3 rounded-lg border transition-all ${
                  quest.completed 
                    ? 'border-success/30 bg-success/5' 
                    : 'border-border'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  {quest.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs md:text-sm block ${quest.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {quest.title}
                    </span>
                    {!quest.completed && quest.target > 1 && (
                      <div className="mt-1">
                        <Progress 
                          value={(quest.progress / quest.target) * 100} 
                          className="h-1.5"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {quest.progress}/{quest.target} {quest.unit}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${quest.completed ? 'text-success' : 'text-gold'}`}>
                    +{quest.xp} XP
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {totalXP > 0 && (
            <div className="p-2.5 md:p-3 rounded-lg bg-gold/10 border border-gold/30">
              <p className="text-xs md:text-sm text-foreground">
                🎉 You've earned <strong className="text-gold">{totalXP} XP</strong> today!
              </p>
            </div>
          )}
        </motion.div>

        {/* Continue Learning */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-display font-semibold text-foreground">Continue Learning</h2>
            <Button variant="ghost" size="sm" className="text-xs md:text-sm" onClick={() => navigate('/courses')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {courses.map((course, i) => (
              <motion.div
                key={course.title}
                className="bg-card rounded-xl p-4 md:p-5 border border-border hover:border-accent/30 hover:shadow-elevated transition-all cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => navigate('/courses')}
              >
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <span className="text-2xl md:text-3xl">{course.icon}</span>
                  <span className="text-[10px] md:text-xs font-medium text-muted-foreground px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded-full">
                    {course.category}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1 md:mb-2 group-hover:text-accent transition-colors text-sm md:text-base">
                  {course.title}
                </h3>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{course.lessons} lessons</span>
                </div>
                <div className="w-full h-1.5 md:h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] md:text-xs text-muted-foreground">{course.progress}% complete</span>
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-accent">
                    <Play className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Daily Goal Banner */}
      <motion.div
        className="mt-4 md:mt-6 p-4 md:p-6 rounded-2xl bg-gradient-hero text-primary-foreground relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="font-display font-semibold text-base md:text-lg mb-1">Daily Study Goal</h3>
            <p className="text-primary-foreground/70 text-sm md:text-base">
              {isStreakEligible 
                ? '🔥 Goal complete! Your streak is secured!' 
                : `Study ${formatTime(STREAK_REQUIREMENT_SECONDS - totalTodaySeconds)} more to keep your streak!`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-gold/30 flex items-center justify-center">
              <div className="text-center">
                <Flame className={`w-4 h-4 md:w-6 md:h-6 mx-auto ${isStreakEligible ? 'text-gold' : 'text-primary-foreground/50'}`} />
                <span className="text-xs md:text-sm font-bold">{Math.round(streakProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Acquired Skills List */}
      <div className="mt-4 md:mt-6">
        <AcquiredSkillsList onViewAll={() => navigate('/quest')} />
      </div>

      {/* Study Time Tracker */}
      <div className="mt-4 md:mt-6">
        <StudyTimeTracker />
      </div>

      {/* Stats Popup Cards */}
      <StatsPopupCard
        type="streak"
        isOpen={activePopup === 'streak'}
        onClose={() => setActivePopup(null)}
        data={{
          currentStreak: profile?.current_streak || 0,
          longestStreak: profile?.longest_streak || 0,
        }}
      />
      <StatsPopupCard
        type="xp"
        isOpen={activePopup === 'xp'}
        onClose={() => setActivePopup(null)}
        data={{
          xpPoints: profile?.xp_points || 0,
          level: 5,
        }}
      />
      <StatsPopupCard
        type="badges"
        isOpen={activePopup === 'badges'}
        onClose={() => setActivePopup(null)}
        data={{}}
      />
      <StatsPopupCard
        type="aura"
        isOpen={activePopup === 'aura'}
        onClose={() => setActivePopup(null)}
        data={{
          xpPoints: 1250,
        }}
      />

      {/* Clan Popup */}
      {showClanPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          onClick={() => setShowClanPopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed z-[100] w-[90%] max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
            style={{ top: '15%', left: '30%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold">Your Clan</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setShowClanPopup(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-2">
                  <span className="text-2xl">⚔️</span>
                </div>
                <h4 className="text-xl font-bold text-foreground">Eliteforce</h4>
                <p className="text-sm text-muted-foreground">You are the Leader</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-foreground">12</p>
                  <p className="text-[10px] text-muted-foreground">Members</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-gold">5,400</p>
                  <p className="text-[10px] text-muted-foreground">Clan XP</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-accent">#3</p>
                  <p className="text-[10px] text-muted-foreground">Rank</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                  View Clan
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                  Manage your clan in Profile → Clan Settings
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Streak Gift Animation */}
      <StreakGiftAnimation 
        currentStreak={profile?.current_streak || 0}
        show={showAnimation}
        onClose={closeAnimation}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
