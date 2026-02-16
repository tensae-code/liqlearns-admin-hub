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
  Zap,
  Brain,
  GraduationCap,
  Sparkles,
  Award,
  Layers,
  ShieldCheck,
  Gem,
  Crown
} from 'lucide-react';

type BadgeCategory = 'personal' | 'skill' | 'course';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  progress?: number;
  target?: number;
  category: BadgeCategory;
}

const categoryStyles: Record<BadgeCategory, {
  bg: string;
  border: string;
  iconBg: string;
  iconText: string;
  starColor: string;
}> = {
  personal: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-400/30',
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-400',
    iconText: 'text-white',
    starColor: 'text-pink-400 fill-pink-400',
  },
  skill: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/30',
    iconBg: 'bg-gradient-to-br from-violet-500 to-indigo-400',
    iconText: 'text-white',
    starColor: 'text-violet-400 fill-violet-400',
  },
  course: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/30',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-400',
    iconText: 'text-white',
    starColor: 'text-emerald-400 fill-emerald-400',
  },
};

const achievements: Achievement[] = [
  // Personal badges
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: <BookOpen className="w-5 h-5" />,
    earned: true,
    category: 'personal',
  },
  {
    id: '2',
    title: 'Week Warrior',
    description: '7-day learning streak',
    icon: <Flame className="w-5 h-5" />,
    earned: true,
    category: 'personal',
  },
  {
    id: '3',
    title: 'Social Butterfly',
    description: 'Join 3 study rooms',
    icon: <Users className="w-5 h-5" />,
    earned: false,
    progress: 2,
    target: 3,
    category: 'personal',
  },
  {
    id: '4',
    title: 'Dedicated',
    description: 'Study for 10 hours total',
    icon: <Clock className="w-5 h-5" />,
    earned: true,
    category: 'personal',
  },
  // Skill badges
  {
    id: '5',
    title: 'Skill Seeker',
    description: 'Unlock your first skill',
    icon: <Brain className="w-5 h-5" />,
    earned: true,
    category: 'skill',
  },
  {
    id: '6',
    title: 'Level Up',
    description: 'Reach Level 3 in any skill',
    icon: <Layers className="w-5 h-5" />,
    earned: false,
    progress: 2,
    target: 3,
    category: 'skill',
  },
  {
    id: '7',
    title: 'Mastery Path',
    description: 'Master 5 skill levels',
    icon: <Gem className="w-5 h-5" />,
    earned: false,
    progress: 1,
    target: 5,
    category: 'skill',
  },
  {
    id: '8',
    title: 'Skill Champion',
    description: 'Max out a full skill tree',
    icon: <Crown className="w-5 h-5" />,
    earned: false,
    progress: 0,
    target: 1,
    category: 'skill',
  },
  // Course badges
  {
    id: '9',
    title: 'Course Pioneer',
    description: 'Enroll in your first course',
    icon: <GraduationCap className="w-5 h-5" />,
    earned: true,
    category: 'course',
  },
  {
    id: '10',
    title: 'Quiz Master',
    description: 'Score 100% on 5 quizzes',
    icon: <Target className="w-5 h-5" />,
    earned: false,
    progress: 3,
    target: 5,
    category: 'course',
  },
  {
    id: '11',
    title: 'Speed Learner',
    description: 'Complete 10 lessons in one day',
    icon: <Zap className="w-5 h-5" />,
    earned: false,
    progress: 4,
    target: 10,
    category: 'course',
  },
  {
    id: '12',
    title: 'Course Graduate',
    description: 'Complete 3 full courses',
    icon: <ShieldCheck className="w-5 h-5" />,
    earned: false,
    progress: 1,
    target: 3,
    category: 'course',
  },
];

const categoryLabels: Record<BadgeCategory, { label: string; icon: React.ReactNode }> = {
  personal: { label: 'Personal', icon: <Sparkles className="w-3.5 h-3.5" /> },
  skill: { label: 'Skills', icon: <Brain className="w-3.5 h-3.5" /> },
  course: { label: 'Courses', icon: <Award className="w-3.5 h-3.5" /> },
};

const AchievementsSection = () => {
  const earnedCount = achievements.filter(a => a.earned).length;
  const categories: BadgeCategory[] = ['personal', 'skill', 'course'];

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

      {/* Featured badges - one from each category */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {categories.map((cat) => {
          const featured = achievements.find(a => a.category === cat && a.earned);
          if (!featured) return null;
          const styles = categoryStyles[cat];
          return (
            <motion.div
              key={cat}
              className="flex flex-col items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${styles.iconBg} flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-background`}
                style={{ boxShadow: `0 0 20px hsl(var(--accent) / 0.3)` }}
              >
                <div className="text-white scale-150">{featured.icon}</div>
              </div>
              <p className="text-xs font-semibold mt-1.5 text-foreground">{featured.title}</p>
              <span className={`text-[10px] font-medium ${styles.starColor}`}>{categoryLabels[cat].label}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const catAchievements = achievements.filter(a => a.category === cat);
          const catInfo = categoryLabels[cat];
          const styles = categoryStyles[cat];

          return (
            <div key={cat}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`${styles.iconBg} ${styles.iconText} w-5 h-5 rounded-md flex items-center justify-center`}>
                  {catInfo.icon}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {catInfo.label}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {catAchievements.map((achievement, i) => (
                  <motion.div
                    key={achievement.id}
                    className={`relative p-3 rounded-xl border text-center transition-all ${
                      achievement.earned
                        ? `${styles.bg} ${styles.border}`
                        : 'bg-muted/30 border-border opacity-60'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      achievement.earned
                        ? `${styles.iconBg} ${styles.iconText}`
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
                        <Star className={`w-4 h-4 ${styles.starColor}`} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AchievementsSection;
