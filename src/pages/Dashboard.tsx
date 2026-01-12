import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useStreakAnimation } from '@/hooks/useStreakAnimation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Leaderboard from '@/components/dashboard/Leaderboard';
import AICoach from '@/components/dashboard/AICoach';
import CircularSkillRing from '@/components/dashboard/CircularSkillRing';
import AuraPointsPanel from '@/components/dashboard/AuraPointsPanel';
import StreakTracker from '@/components/dashboard/StreakTracker';
import LearningResources from '@/components/dashboard/LearningResources';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickAccessButton from '@/components/quick-access/QuickAccessButton';
import StreakGiftAnimation from '@/components/streak/StreakGiftAnimation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  Headphones,
  Pen,
  Mic,
  Video,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { profile, updateStreak } = useProfile();
  const navigate = useNavigate();
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  
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

  // Update streak on dashboard load
  useEffect(() => {
    if (user && profile) {
      updateStreak();
    }
  }, [user, profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = [
    { icon: BookOpen, label: 'Lessons', value: '24', gradient: 'from-orange-500 to-amber-400' },
    { icon: Award, label: 'Badges', value: '5', gradient: 'from-purple-500 to-pink-400' },
    { icon: Star, label: 'XP', value: profile?.xp_points?.toLocaleString() || '0', gradient: 'from-emerald-500 to-teal-400' },
    { icon: Flame, label: 'Streak', value: profile?.current_streak?.toString() || '0', gradient: 'from-red-500 to-orange-400' },
  ];

  const quests = [
    { id: '1', title: 'Complete daily quiz', xp: 50 },
    { id: '2', title: 'Watch a video lesson', xp: 30 },
    { id: '3', title: 'Practice flashcards', xp: 25 },
    { id: '4', title: 'Read course materials', xp: 20 },
    { id: '5', title: 'Join a study room', xp: 40 },
  ];

  const courses = [
    { title: 'Amharic Basics', progress: 65, lessons: 24, icon: '📚', category: 'Language' },
    { title: 'Ethiopian Culture', progress: 30, lessons: 18, icon: '🏛️', category: 'Culture' },
    { title: 'Web Development', progress: 80, lessons: 32, icon: '💻', category: 'Technology' },
  ];

  const toggleQuest = (id: string) => {
    setCompletedQuests(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const completedCount = completedQuests.length;
  const totalXP = quests.filter(q => completedQuests.includes(q.id)).reduce((sum, q) => sum + q.xp, 0);

  return (
    <DashboardLayout>
      {/* Welcome Header */}
      <motion.div
        className="mb-4 md:mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
          Good morning, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Learner'}! 👋
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">Continue your learning journey today</p>
      </motion.div>

      {/* Stats Grid - Colorful Gradient Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
            <stat.icon className="w-6 h-6 mb-2 opacity-90" />
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs opacity-80">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Quest */}
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
            {quests.map((quest) => {
              const isCompleted = completedQuests.includes(quest.id);
              return (
                <label
                  key={quest.id}
                  className={`flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg border cursor-pointer transition-all ${
                    isCompleted 
                      ? 'border-success/30 bg-success/5' 
                      : 'border-border hover:border-accent/30'
                  }`}
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleQuest(quest.id)}
                    className={isCompleted ? 'border-success text-success' : ''}
                  />
                  <span className={`flex-1 text-xs md:text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {quest.title}
                  </span>
                  <span className={`text-xs font-medium ${isCompleted ? 'text-success' : 'text-gold'}`}>
                    +{quest.xp} XP
                  </span>
                </label>
              );
            })}
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
            <Button variant="ghost" size="sm" className="text-xs md:text-sm">
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
            <h3 className="font-display font-semibold text-base md:text-lg mb-1">Daily Goal</h3>
            <p className="text-primary-foreground/70 text-sm md:text-base">
              Complete {5 - completedCount} more quests to earn bonus XP!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-gold/30 flex items-center justify-center">
              <div className="text-center">
                <Target className="w-4 h-4 md:w-6 md:h-6 text-gold mx-auto" />
                <span className="text-xs md:text-sm font-bold">{completedCount}/5</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Learning Tools */}
      <motion.div
        className="mt-4 md:mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-base md:text-lg font-display font-semibold text-foreground mb-3 md:mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: Video, label: 'Video Lessons', count: 45, color: 'text-accent', bg: 'bg-accent/10' },
            { icon: Headphones, label: 'Audio Guides', count: 23, color: 'text-gold', bg: 'bg-gold/10' },
            { icon: FileText, label: 'Study Notes', count: 67, color: 'text-success', bg: 'bg-success/10' },
            { icon: Target, label: 'Practice Quiz', count: 12, color: 'text-streak', bg: 'bg-streak/10' },
          ].map((tool, i) => (
            <div
              key={tool.label}
              className="bg-card rounded-xl p-3 md:p-4 border border-border hover:border-accent/30 hover:shadow-soft transition-all cursor-pointer flex items-center gap-3 md:gap-4"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${tool.bg} flex items-center justify-center flex-shrink-0`}>
                <tool.icon className={`w-5 h-5 md:w-6 md:h-6 ${tool.color}`} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm md:text-base truncate">{tool.label}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{tool.count} available</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Skills Progress - Circular Rings */}
      <motion.div
        className="mt-4 md:mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <h2 className="text-base md:text-lg font-display font-semibold text-foreground mb-3 md:mb-4">Skills Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <CircularSkillRing name="Listening" icon={<Headphones className="w-full h-full" />} progress={65} color="text-accent" bgColor="bg-accent/10" label="Great" />
          <CircularSkillRing name="Reading" icon={<BookOpen className="w-full h-full" />} progress={80} color="text-gold" bgColor="bg-gold/10" label="Bravo" />
          <CircularSkillRing name="Writing" icon={<Pen className="w-full h-full" />} progress={45} color="text-success" bgColor="bg-success/10" label="Fair" />
          <CircularSkillRing name="Speaking" icon={<Mic className="w-full h-full" />} progress={35} color="text-streak" bgColor="bg-streak/10" label="Keep Going" />
        </div>
      </motion.div>

      {/* Aura Points & Streak */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
        <AuraPointsPanel auraPoints={profile?.xp_points || 2450} level={5} nextLevelPoints={3000} />
        <StreakTracker 
          currentStreak={profile?.current_streak || 7} 
          longestStreak={profile?.longest_streak || 45} 
          weekProgress={[true, true, true, true, true, true, false]} 
          onStreakClick={triggerAnimation}
        />
      </div>

      {/* Learning Resources - 12 Types */}
      <div className="mt-4 md:mt-6">
        <LearningResources userLevel={5} />
      </div>

      {/* Leaderboard & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
        <Leaderboard />
        <RecentActivity />
      </div>

      {/* AI Coach */}
      <AICoach />

      {/* Quick Access Button (includes Daily Bonus) */}
      <QuickAccessButton />

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
