import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
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
  Settings
} from 'lucide-react';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [selectedChild, setSelectedChild] = useState('child1');

  const children = [
    { id: 'child1', name: 'Abebe', age: 10, avatar: 'A', xp: 2450, streak: 12, courses: 3 },
    { id: 'child2', name: 'Sara', age: 8, avatar: 'S', xp: 1820, streak: 7, courses: 2 },
  ];

  const selectedChildData = children.find(c => c.id === selectedChild)!;

  const childStats = [
    { label: 'Total XP', value: selectedChildData.xp.toLocaleString(), icon: Star, color: 'text-gold', bg: 'bg-gold/10' },
    { label: 'Current Streak', value: `${selectedChildData.streak} days`, icon: Flame, color: 'text-streak', bg: 'bg-streak/10' },
    { label: 'Courses', value: selectedChildData.courses, icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Badges Earned', value: '8', icon: Award, color: 'text-success', bg: 'bg-success/10' },
  ];

  const recentActivity = [
    { type: 'lesson', title: 'Completed "Amharic Alphabets"', time: '2 hours ago', xp: 50 },
    { type: 'badge', title: 'Earned "Quick Learner" badge', time: '5 hours ago', xp: 100 },
    { type: 'quiz', title: 'Scored 95% on vocabulary quiz', time: '1 day ago', xp: 75 },
    { type: 'streak', title: 'Extended learning streak to 12 days', time: '1 day ago', xp: 25 },
    { type: 'lesson', title: 'Started "Numbers in Amharic"', time: '2 days ago', xp: 20 },
  ];

  const enrolledCourses = [
    { title: 'Kids Amharic Fun', progress: 65, lessonsComplete: 20, totalLessons: 30, timeSpent: '8h 30m' },
    { title: 'Ethiopian Stories', progress: 40, lessonsComplete: 6, totalLessons: 15, timeSpent: '3h 15m' },
    { title: 'Numbers & Counting', progress: 85, lessonsComplete: 17, totalLessons: 20, timeSpent: '5h 45m' },
  ];

  const weeklyReport = {
    lessonsCompleted: 12,
    timeSpent: '4h 30m',
    xpEarned: 450,
    quizzesTaken: 3,
    avgScore: 92,
  };

  const parentalControls = [
    { label: 'Daily time limit', description: '2 hours per day', enabled: true },
    { label: 'Content filter', description: 'Age-appropriate content only', enabled: true },
    { label: 'Study room access', description: 'Require approval to join', enabled: false },
    { label: 'Weekly progress reports', description: 'Email every Sunday', enabled: true },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
              Parent Dashboard 👨‍👩‍👧‍👦
            </h1>
            <p className="text-muted-foreground">Monitor your child's learning progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/parent')}>
              <Plus className="w-4 h-4" />
              Add Child
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
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelectedChild(child.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all min-w-[200px] ${
              selectedChild === child.id
                ? 'border-accent bg-accent/5'
                : 'border-border bg-card hover:border-accent/30'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
              selectedChild === child.id
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {child.avatar}
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{child.name}</p>
              <p className="text-sm text-muted-foreground">{child.age} years old</p>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {childStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-card rounded-xl p-4 border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
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
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {enrolledCourses.map((course, i) => (
              <div key={i} className="p-4">
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
            <Button className="w-full" variant="outline">
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
            {parentalControls.map((control, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {i === 0 ? <Clock className="w-5 h-5 text-muted-foreground" /> :
                     i === 1 ? <Eye className="w-5 h-5 text-muted-foreground" /> :
                     i === 2 ? <Lock className="w-5 h-5 text-muted-foreground" /> :
                     <Bell className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{control.label}</p>
                    <p className="text-sm text-muted-foreground">{control.description}</p>
                  </div>
                </div>
                <Switch checked={control.enabled} />
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <Button className="w-full" variant="outline">
              <Shield className="w-4 h-4 mr-2" />
              More Settings
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
