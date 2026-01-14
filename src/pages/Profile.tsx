import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  Sparkles,
  Headphones,
  MessageSquare,
  Users,
  Shield,
  Briefcase,
  Swords,
  UserPlus,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const mockClans = [
  { id: 1, name: 'Eliteforce', members: 48, level: 12, isOpen: true },
  { id: 2, name: 'Night Owls', members: 32, level: 8, isOpen: true },
  { id: 3, name: 'Study Squad', members: 65, level: 15, isOpen: false },
  { id: 4, name: 'Rising Stars', members: 24, level: 6, isOpen: true },
];

const Profile = () => {
  const { user, userRole } = useAuth();
  const { profile, loading } = useProfile();
  const [showJoinClan, setShowJoinClan] = useState(false);
  const [clanSearch, setClanSearch] = useState('');
  const [userClan, setUserClan] = useState<{ name: string; role: string } | null>(null);

  const filteredClans = mockClans.filter(c => 
    c.name.toLowerCase().includes(clanSearch.toLowerCase())
  );

  const handleJoinClan = (clan: typeof mockClans[0]) => {
    if (!clan.isOpen) {
      toast.error('This clan is invite-only');
      return;
    }
    setUserClan({ name: clan.name, role: 'Member' });
    setShowJoinClan(false);
    toast.success(`Joined ${clan.name}!`, { description: 'Welcome to the clan!' });
  };

  // Role-specific stats
  const getRoleStats = () => {
    switch (userRole) {
      case 'support':
        return [
          { label: 'Tickets Resolved', value: '248', icon: Headphones, color: 'text-success' },
          { label: 'Avg Response', value: '2.5h', icon: MessageSquare, color: 'text-accent' },
          { label: 'Satisfaction', value: '98%', icon: Star, color: 'text-gold' },
          { label: 'This Week', value: '34', icon: TrendingUp, color: 'text-primary' },
        ];
      case 'teacher':
        return [
          { label: 'Total Students', value: '1,248', icon: Users, color: 'text-accent' },
          { label: 'Active Courses', value: '8', icon: BookOpen, color: 'text-primary' },
          { label: 'Avg. Rating', value: '4.8', icon: Star, color: 'text-gold' },
          { label: 'Revenue', value: '45.2K', icon: TrendingUp, color: 'text-success' },
        ];
      case 'admin':
        return [
          { label: 'Users Managed', value: '5.2K', icon: Users, color: 'text-accent' },
          { label: 'Actions Today', value: '42', icon: Shield, color: 'text-primary' },
          { label: 'Reports Handled', value: '156', icon: MessageSquare, color: 'text-gold' },
          { label: 'Uptime', value: '99.9%', icon: TrendingUp, color: 'text-success' },
        ];
      case 'ceo':
        return [
          { label: 'Total Users', value: '52.4K', icon: Users, color: 'text-accent' },
          { label: 'Revenue', value: '2.4M', icon: TrendingUp, color: 'text-success' },
          { label: 'Enterprises', value: '148', icon: Briefcase, color: 'text-gold' },
          { label: 'Growth', value: '+28%', icon: Star, color: 'text-primary' },
        ];
      case 'parent':
        return [
          { label: 'Children', value: '2', icon: Users, color: 'text-accent' },
          { label: 'Total Progress', value: '78%', icon: TrendingUp, color: 'text-success' },
          { label: 'Courses Enrolled', value: '6', icon: BookOpen, color: 'text-gold' },
          { label: 'Hours Learned', value: '124', icon: Star, color: 'text-primary' },
        ];
      default: // student
        return [
          { label: 'Total XP', value: profile?.xp_points?.toLocaleString() || '0', icon: Star, color: 'text-gold' },
          { label: 'Aura Points', value: '3,200', icon: Sparkles, color: 'text-accent' },
          { label: 'Day Streak', value: profile?.current_streak?.toString() || '0', icon: Flame, color: 'text-streak' },
          { label: 'Rank', value: '#42', icon: Trophy, color: 'text-primary' },
        ];
    }
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'support': return 'Support Agent';
      case 'teacher': return 'Instructor';
      case 'admin': return 'Administrator';
      case 'ceo': return 'CEO';
      case 'parent': return 'Parent';
      default: return 'Pro Learner';
    }
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'support': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'teacher': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'ceo': return 'bg-gold/10 text-gold border-gold/30';
      case 'parent': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-accent/10 text-accent border-accent/30';
    }
  };

  const stats = getRoleStats();

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
            <span className="text-sm font-medium text-primary-foreground">{getRoleTitle()}</span>
          </div>

          {/* Role Badge for non-students */}
          {userRole && userRole !== 'student' && (
            <Badge className={`absolute top-14 right-4 ${getRoleBadgeColor()}`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          )}
        </motion.div>

        {/* Clan Section */}
        <motion.div
          className="mb-6 p-4 rounded-xl bg-card border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Swords className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {userClan ? userClan.name : 'No Clan'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {userClan ? `${userClan.role} • Team up to earn bonus XP` : 'Join a clan to earn bonus XP'}
                </p>
              </div>
            </div>
            
            <Dialog open={showJoinClan} onOpenChange={setShowJoinClan}>
              <DialogTrigger asChild>
                <Button size="sm" variant={userClan ? "outline" : "default"} className={!userClan ? "bg-gradient-accent text-accent-foreground" : ""}>
                  {userClan ? (
                    <>
                      <Settings className="w-4 h-4 mr-1" />
                      Manage
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Join Clan
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Find a Clan</DialogTitle>
                  <DialogDescription>Join a clan to earn bonus XP and compete together</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clans..."
                      value={clanSearch}
                      onChange={(e) => setClanSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredClans.map((clan) => (
                      <div
                        key={clan.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {clan.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{clan.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {clan.members} members • Level {clan.level}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={clan.isOpen ? "default" : "outline"}
                          onClick={() => handleJoinClan(clan)}
                          disabled={!clan.isOpen}
                          className={clan.isOpen ? "bg-violet-600 hover:bg-violet-700" : ""}
                        >
                          {clan.isOpen ? 'Join' : 'Invite Only'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
