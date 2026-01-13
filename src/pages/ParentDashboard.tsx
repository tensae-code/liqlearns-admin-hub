import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useParentChildren } from '@/hooks/useParentChildren';
import AddChildModal from '@/components/parent/AddChildModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Users, 
  BookOpen, 
  Clock, 
  Trophy,
  Shield,
  ChevronRight,
  Star,
  Flame,
  Calendar,
  Bell,
  Eye,
  Lock,
  Plus,
  Award,
  TrendingUp,
  Settings,
  UserPlus
} from 'lucide-react';

// Define the four gradients used across the app
const STAT_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400'
];

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { children, loading: childrenLoading, searchChildByUsername, addChild } = useParentChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [controls, setControls] = useState({
    timeLimit: true,
    contentFilter: true,
    studyRoomAccess: false,
    weeklyReports: true,
  });

  // Select first child by default when children load
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find(c => c.id === selectedChildId);

  const childStats = selectedChild ? [
    { label: 'Total XP', value: selectedChild.xp_points.toLocaleString(), icon: Star, gradient: STAT_GRADIENTS[0] },
    { label: 'Current Streak', value: `${selectedChild.current_streak} days`, icon: Flame, gradient: STAT_GRADIENTS[3] },
    { label: 'Courses', value: '3', icon: BookOpen, gradient: STAT_GRADIENTS[1] },
    { label: 'Badges Earned', value: '8', icon: Award, gradient: STAT_GRADIENTS[2] },
  ] : [];

  const recentActivity = [
    { type: 'lesson', title: 'Completed "Amharic Alphabets"', time: '2 hours ago', xp: 50 },
    { type: 'badge', title: 'Earned "Quick Learner" badge', time: '5 hours ago', xp: 100 },
    { type: 'quiz', title: 'Scored 95% on vocabulary quiz', time: '1 day ago', xp: 75 },
    { type: 'streak', title: 'Extended learning streak to 12 days', time: '1 day ago', xp: 25 },
    { type: 'lesson', title: 'Started "Numbers in Amharic"', time: '2 days ago', xp: 20 },
  ];

  const enrolledCourses = [
    { id: '1', title: 'Kids Amharic Fun', progress: 65, lessonsComplete: 20, totalLessons: 30, timeSpent: '8h 30m' },
    { id: '2', title: 'Ethiopian Stories', progress: 40, lessonsComplete: 6, totalLessons: 15, timeSpent: '3h 15m' },
    { id: '3', title: 'Numbers & Counting', progress: 85, lessonsComplete: 17, totalLessons: 20, timeSpent: '5h 45m' },
  ];

  const weeklyReport = {
    lessonsCompleted: 12,
    timeSpent: '4h 30m',
    xpEarned: 450,
    quizzesTaken: 3,
    avgScore: 92,
  };

  const handleControlToggle = (key: keyof typeof controls) => {
    setControls(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      toast.success(`${key === 'timeLimit' ? 'Daily time limit' : 
        key === 'contentFilter' ? 'Content filter' :
        key === 'studyRoomAccess' ? 'Study room access' : 
        'Weekly reports'} ${newState[key] ? 'enabled' : 'disabled'}`);
      return newState;
    });
  };

  return (
    <DashboardLayout>
      {/* Add Child Modal */}
      <AddChildModal
        open={addChildModalOpen}
        onOpenChange={setAddChildModalOpen}
        onSearch={searchChildByUsername}
        onAddChild={addChild}
      />

      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">
              Parent Dashboard 👨‍👩‍👧‍👦
            </h1>
            <p className="text-muted-foreground">Monitor your child's learning progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setAddChildModalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Child</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Child Selector */}
      <motion.div
        className="flex gap-4 mb-6 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {childrenLoading ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card min-w-[200px]">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ) : children.length === 0 ? (
          <button
            onClick={() => setAddChildModalOpen(true)}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border bg-card hover:border-accent/50 transition-all min-w-[200px]"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Add a child</p>
              <p className="text-sm text-muted-foreground">Link an account</p>
            </div>
          </button>
        ) : (
          children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all min-w-[200px] ${
                selectedChildId === child.id
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-card hover:border-accent/30'
              }`}
            >
              <Avatar className={`h-12 w-12 ${
                selectedChildId === child.id ? 'ring-2 ring-accent ring-offset-2' : ''
              }`}>
                {child.avatar_url && <AvatarImage src={child.avatar_url} />}
                <AvatarFallback className={`text-lg font-bold ${
                  selectedChildId === child.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {child.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium text-foreground">
                  {child.nickname || child.full_name}
                </p>
                <p className="text-sm text-muted-foreground">@{child.username}</p>
              </div>
            </button>
          ))
        )}
      </motion.div>

      {/* No Child Selected State */}
      {!selectedChild && children.length === 0 && !childrenLoading && (
        <motion.div
          className="text-center py-12 bg-card rounded-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            No children linked yet
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Link your child's account to monitor their learning progress, set parental controls, and stay updated on their achievements.
          </p>
          <Button onClick={() => setAddChildModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Your First Child
          </Button>
        </motion.div>
      )}

      {/* Stats Grid - Only show if child selected */}
      {selectedChild && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {childStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
                <stat.icon className="w-5 h-5 md:w-6 md:h-6 mb-2 opacity-90" />
                <p className="text-xl md:text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Course Progress */}
            <motion.div
              className="lg:col-span-2 bg-card rounded-xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  <h2 className="font-display font-semibold text-foreground">Enrolled Courses</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="divide-y divide-border">
                {enrolledCourses.map((course) => (
                  <div 
                    key={course.id} 
                    className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-foreground">{course.title}</h3>
                      <Badge className="bg-accent/10 text-accent border-accent/30">
                        {course.progress}% complete
                      </Badge>
                    </div>
                    <Progress value={course.progress} className="h-2 mb-3" />
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.lessonsComplete}/{course.totalLessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.timeSpent}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Weekly Report */}
            <motion.div
              className="bg-card rounded-xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="p-4 border-b border-border flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <h2 className="font-display font-semibold text-foreground">Weekly Report</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lessons Completed</span>
                  <span className="font-bold text-foreground">{weeklyReport.lessonsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Time Spent</span>
                  <span className="font-bold text-foreground">{weeklyReport.timeSpent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">XP Earned</span>
                  <span className="font-bold text-gold">{weeklyReport.xpEarned}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quizzes Taken</span>
                  <span className="font-bold text-foreground">{weeklyReport.quizzesTaken}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-bold text-success">{weeklyReport.avgScore}%</span>
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => toast.info('Detailed weekly report coming soon!')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Report
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity & Parental Controls */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Activity */}
            <motion.div
              className="bg-card rounded-xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                <h2 className="font-display font-semibold text-foreground">Recent Activity</h2>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'badge' ? 'bg-gold/10 text-gold' :
                      activity.type === 'streak' ? 'bg-streak/10 text-streak' :
                      'bg-accent/10 text-accent'
                    }`}>
                      {activity.type === 'badge' ? <Award className="w-5 h-5" /> :
                       activity.type === 'streak' ? <Flame className="w-5 h-5" /> :
                       activity.type === 'quiz' ? <Trophy className="w-5 h-5" /> :
                       <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <span className="text-sm text-gold font-medium">+{activity.xp} XP</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Parental Controls */}
            <motion.div
              className="bg-card rounded-xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <h2 className="font-display font-semibold text-foreground">Parental Controls</h2>
              </div>
              <div className="divide-y divide-border">
                {[
                  { key: 'timeLimit' as const, label: 'Daily time limit', description: '2 hours per day', icon: Clock },
                  { key: 'contentFilter' as const, label: 'Content filter', description: 'Age-appropriate content only', icon: Eye },
                  { key: 'studyRoomAccess' as const, label: 'Study room access', description: 'Require approval to join', icon: Lock },
                  { key: 'weeklyReports' as const, label: 'Weekly progress reports', description: 'Email every Sunday', icon: Bell },
                ].map((control) => (
                  <div key={control.key} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <control.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{control.label}</p>
                        <p className="text-sm text-muted-foreground">{control.description}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={controls[control.key]} 
                      onCheckedChange={() => handleControlToggle(control.key)}
                    />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/settings')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  More Settings
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default ParentDashboard;
