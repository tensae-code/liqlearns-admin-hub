import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Star,
  Flame,
  Trophy,
  Award,
  BookOpen,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Edit,
  Share2,
  Settings,
  TrendingUp,
  Medal,
  Crown,
  Sparkles
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  const stats = [
    { label: 'Total XP', value: profile?.xp_points?.toLocaleString() || '0', icon: Star, color: 'text-gold' },
    { label: 'Aura Points', value: '3,200', icon: Sparkles, color: 'text-accent' },
    { label: 'Day Streak', value: profile?.current_streak?.toString() || '0', icon: Flame, color: 'text-streak' },
    { label: 'Rank', value: '#42', icon: Trophy, color: 'text-primary' },
  ];

  const achievements = [
    { title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', earned: true },
    { title: 'Week Warrior', description: '7-day streak', icon: '🔥', earned: (profile?.longest_streak || 0) >= 7 },
    { title: 'Vocabulary Master', description: 'Learn 500 words', icon: '📚', earned: true },
    { title: 'Social Butterfly', description: 'Join 5 study rooms', icon: '🦋', earned: true },
    { title: 'Quiz Champion', description: 'Score 100% on 10 quizzes', icon: '🏆', earned: false },
    { title: 'Month Master', description: '30-day streak', icon: '⭐', earned: (profile?.longest_streak || 0) >= 30 },
  ];

  const badges = [
    { name: 'Listening Expert', level: 3, icon: '🎧', color: 'bg-accent/10 text-accent' },
    { name: 'Reading Pro', level: 4, icon: '📖', color: 'bg-gold/10 text-gold' },
    { name: 'Early Adopter', level: 1, icon: '🌟', color: 'bg-success/10 text-success' },
    { name: 'Community Helper', level: 2, icon: '🤝', color: 'bg-primary/10 text-primary' },
  ];

  const skills = [
    { name: 'Listening', level: 3, progress: 65 },
    { name: 'Reading', level: 4, progress: 80 },
    { name: 'Writing', level: 2, progress: 45 },
    { name: 'Speaking', level: 2, progress: 35 },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <motion.div
          className="relative bg-gradient-hero rounded-2xl p-6 mb-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-white/20">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
              <AvatarFallback className="bg-white/20 text-primary-foreground text-3xl font-bold">
                {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-primary-foreground/70 mb-3">@{profile?.username || user?.email?.split('@')[0]?.toLowerCase() || 'user'}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-primary-foreground/70">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Ethiopia
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Joined Jan 2024
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" /> 24 Courses
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="glass" size="sm">
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
              <Button variant="glass" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Rank Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
            <Crown className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-primary-foreground">Pro Learner</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-card rounded-xl p-4 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Skills Progress */}
          <motion.div
            className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h2 className="font-display font-semibold text-foreground">Skills Progress</h2>
            </div>

            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{skill.name}</span>
                    <span className="text-sm text-muted-foreground">Level {skill.level} • {skill.progress}%</span>
                  </div>
                  <Progress value={skill.progress} className="h-2" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Medal className="w-5 h-5 text-gold" />
              <h2 className="font-display font-semibold text-foreground">Badges</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.name}
                  className={`p-3 rounded-xl ${badge.color} text-center`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <p className="text-xs font-medium mt-1">{badge.name}</p>
                  <p className="text-xs opacity-70">Level {badge.level}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div
          className="mt-6 bg-card rounded-xl border border-border p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              <h2 className="font-display font-semibold text-foreground">Achievements</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {achievements.filter(a => a.earned).length}/{achievements.length} earned
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.title}
                className={`p-4 rounded-xl text-center transition-all ${
                  achievement.earned
                    ? 'bg-gold/10 border border-gold/30'
                    : 'bg-muted/50 border border-border opacity-50'
                }`}
              >
                <span className="text-3xl">{achievement.icon}</span>
                <p className="text-xs font-medium text-foreground mt-2">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
