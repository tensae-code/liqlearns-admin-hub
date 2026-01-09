import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Trophy, 
  Flame, 
  Target,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const courses = [
    { title: 'Amharic Basics', progress: 65, lessons: 24, image: '📚' },
    { title: 'Business English', progress: 30, lessons: 18, image: '💼' },
    { title: 'Web Development', progress: 80, lessons: 32, image: '💻' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        {/* Welcome Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Flame, label: 'Day Streak', value: '7', color: 'text-streak', bg: 'bg-streak/10' },
            { icon: Star, label: 'Total XP', value: '1,250', color: 'text-gold', bg: 'bg-gold/10' },
            { icon: BookOpen, label: 'Courses', value: '3', color: 'text-accent', bg: 'bg-accent/10' },
            { icon: Trophy, label: 'Badges', value: '5', color: 'text-success', bg: 'bg-success/10' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-card rounded-xl p-4 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Continue Learning */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold text-foreground">Continue Learning</h2>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {courses.map((course, i) => (
              <motion.div
                key={course.title}
                className="bg-card rounded-xl p-5 border border-border hover:border-accent/30 hover:shadow-elevated transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div className="text-4xl mb-4">{course.image}</div>
                <h3 className="font-display font-semibold text-foreground mb-2">{course.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{course.lessons} lessons</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{course.progress}% complete</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Daily Goal */}
        <motion.div
          className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg mb-1">Daily Goal</h3>
              <p className="text-primary-foreground/70">Complete 2 more lessons to earn bonus XP!</p>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-8 h-8 text-gold" />
              <span className="text-2xl font-bold">3/5</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
