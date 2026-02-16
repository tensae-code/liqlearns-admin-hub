import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useStreakAnimation } from '@/hooks/useStreakAnimation';
import { useStudyTime } from '@/hooks/useStudyTime';
import { useMyEnrollments } from '@/hooks/useCourses';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AICoach from '@/components/dashboard/AICoach';
import StudyTimeTracker from '@/components/dashboard/StudyTimeTracker';
import AcquiredSkillsList from '@/components/dashboard/AcquiredSkillsList';
import StreakGiftAnimation from '@/components/streak/StreakGiftAnimation';
import StatsPopupCard from '@/components/dashboard/StatsPopupCard';
import GradingSystem from '@/components/dashboard/GradingSystem';
import ClanPopup from '@/components/dashboard/ClanPopup';
import { useClans } from '@/hooks/useClans';

import NewsFeedWidget from '@/components/dashboard/NewsFeedWidget';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  Shield,
  ShoppingCart
} from 'lucide-react';

import { STAT_GRADIENTS } from '@/lib/theme';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { profile, updateStreak } = useProfile();
  const { myClans } = useClans();
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useMyEnrollments();
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

  const badgeCounts = { personal: 2, skill: 1, course: 2 };
  const totalBadges = badgeCounts.personal + badgeCounts.skill + badgeCounts.course;

  const stats = [
    { icon: BookOpen, label: 'Lessons', value: '24', gradient: STAT_GRADIENTS[0], clickable: false, isBadgeCard: false },
    { icon: Award, label: 'Badges', value: totalBadges.toString(), gradient: STAT_GRADIENTS[1], clickable: true, popupType: 'badges' as const, isBadgeCard: true },
    { icon: Star, label: 'XP', value: profile?.xp_points?.toLocaleString() || '0', gradient: STAT_GRADIENTS[2], clickable: true, popupType: 'xp' as const, isBadgeCard: false },
    { icon: Flame, label: 'Streak', value: profile?.current_streak?.toString() || '0', gradient: STAT_GRADIENTS[3], clickable: true, popupType: 'streak' as const, isBadgeCard: false },
    { icon: Sparkles, label: 'Aura', value: '1,250', gradient: 'from-violet-500 to-purple-600', clickable: true, popupType: 'aura' as const, isBadgeCard: false },
  ];

  // Use real enrolled courses
  const displayCourses = enrollments.slice(0, 3).map(enrollment => ({
    id: enrollment.course_id,
    title: enrollment.course?.title || 'Untitled Course',
    progress: enrollment.calculated_progress || 0,
    lessons: enrollment.course?.total_lessons || 0,
    icon: enrollment.thumbnail_emoji || '📖',
    category: enrollment.course?.category || 'General',
  }));

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
          {myClans.length > 0 && (
            <div 
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20 cursor-pointer hover:border-violet-500/40 transition-all"
              onClick={() => setShowClanPopup(true)}
            >
              <Shield className="w-5 h-5 text-violet-500" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">{myClans[0].name}</span>
                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">Clan • {myClans.length} joined</span>
              </div>
            </div>
          )}
          {myClans.length === 0 && (
            <div 
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border cursor-pointer hover:border-violet-500/40 transition-all"
              onClick={() => setShowClanPopup(true)}
            >
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Join a Clan</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid - Colorful Gradient Cards - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl p-4 ${
              stat.isBadgeCard
                ? 'bg-gradient-to-br from-pink-500 via-violet-500 to-emerald-500'
                : `bg-gradient-to-br ${stat.gradient}`
            } text-white shadow-lg ${stat.clickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => stat.clickable && stat.popupType && setActivePopup(stat.popupType)}
            whileHover={stat.clickable ? { y: -2 } : {}}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
            {stat.isBadgeCard ? (
              <>
                <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wider mb-2">Badges</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex flex-col items-center">
                    <span className="w-10 h-10 rounded-full bg-pink-400/90 flex items-center justify-center text-lg shadow-lg ring-2 ring-white/30">🌅</span>
                    <span className="text-[9px] mt-1 opacity-70">Personal</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="w-10 h-10 rounded-full bg-blue-400/90 flex items-center justify-center text-lg shadow-lg ring-2 ring-white/30">🔥</span>
                    <span className="text-[9px] mt-1 opacity-70">Skill</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="w-10 h-10 rounded-full bg-emerald-400/90 flex items-center justify-center text-lg shadow-lg ring-2 ring-white/30">🎯</span>
                    <span className="text-[9px] mt-1 opacity-70">Course</span>
                  </div>
                </div>
                <p className="text-[10px] opacity-60 mt-1.5 text-center">Tap for details</p>
              </>
            ) : (
              <>
                <stat.icon className="w-6 h-6 mb-2 opacity-90" />
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs opacity-80">{stat.label}</p>
                {stat.clickable && (
                  <p className="text-[10px] opacity-60 mt-1">Tap for details</p>
                )}
              </>
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
            {enrollmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))
            ) : displayCourses.length > 0 ? (
              displayCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  className="bg-card rounded-xl p-4 md:p-5 border border-border hover:border-accent/30 hover:shadow-elevated transition-all cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <span className="text-2xl md:text-3xl">{course.icon}</span>
                    <span className="text-[10px] md:text-xs font-medium text-muted-foreground px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded-full">
                      {course.category}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1 md:mb-2 group-hover:text-accent transition-colors text-sm md:text-base line-clamp-1">
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
              ))
            ) : (
              // No enrolled courses - show enroll card
              <motion.div
                className="bg-card rounded-xl p-4 md:p-5 border border-dashed border-accent/50 hover:border-accent hover:shadow-elevated transition-all cursor-pointer group col-span-full md:col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => navigate('/marketplace')}
              >
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">
                    Enroll into a Course
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Browse our marketplace and start learning today!
                  </p>
                  <Button variant="hero" size="sm" className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Browse Courses
                  </Button>
                </div>
              </motion.div>
            )}
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

      {/* Grading System */}
      <div className="mt-4 md:mt-6">
        <GradingSystem />
      </div>

      {/* News Feed */}
      <div className="mt-4 md:mt-6">
        <NewsFeedWidget />
      </div>

      {/* Achievements - moved to after quests */}

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
      <ClanPopup 
        isOpen={showClanPopup}
        onClose={() => setShowClanPopup(false)}
      />

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
