import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  Users, 
  Star, 
  Clock,
  Target,
  Zap
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  progress?: number;
  target?: number;
}

const achievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: <BookOpen className="w-5 h-5" />,
    earned: true,
  },
  {
    id: '2',
    title: 'Week Warrior',
    description: '7-day learning streak',
    icon: <Flame className="w-5 h-5" />,
    earned: true,
  },
  {
    id: '3',
    title: 'Social Butterfly',
    description: 'Join 3 study rooms',
    icon: <Users className="w-5 h-5" />,
    earned: false,
    progress: 2,
    target: 3,
  },
  {
    id: '4',
    title: 'Quiz Master',
    description: 'Score 100% on 5 quizzes',
    icon: <Target className="w-5 h-5" />,
    earned: false,
    progress: 3,
    target: 5,
  },
  {
    id: '5',
    title: 'Speed Learner',
    description: 'Complete 10 lessons in one day',
    icon: <Zap className="w-5 h-5" />,
    earned: false,
    progress: 4,
    target: 10,
  },
  {
    id: '6',
    title: 'Dedicated',
    description: 'Study for 10 hours total',
    icon: <Clock className="w-5 h-5" />,
    earned: true,
  },
];

const AchievementsSection = () => {
  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-4 md:p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" />
          <h2 className="text-base md:text-lg font-display font-semibold text-foreground">Achievements</h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          {earnedCount}/{achievements.length} earned
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {achievements.map((achievement, i) => (
          <motion.div
            key={achievement.id}
            className={`relative p-3 rounded-xl border text-center transition-all ${
              achievement.earned
                ? 'bg-gold/10 border-gold/30'
                : 'bg-muted/30 border-border opacity-60'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
              achievement.earned
                ? 'bg-gold text-gold-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {achievement.icon}
            </div>
            <p className={`text-xs font-medium mb-0.5 ${
              achievement.earned ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {achievement.title}
            </p>
            {!achievement.earned && achievement.progress !== undefined && achievement.target && (
              <p className="text-[10px] text-muted-foreground">
                {achievement.progress}/{achievement.target}
              </p>
            )}
            {achievement.earned && (
              <div className="absolute -top-1 -right-1">
                <Star className="w-4 h-4 text-gold fill-gold" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AchievementsSection;
