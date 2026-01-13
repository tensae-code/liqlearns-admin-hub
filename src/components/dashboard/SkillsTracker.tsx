import { motion } from 'framer-motion';
import { Headphones, BookOpen, Pen, Mic, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAT_GRADIENTS } from '@/lib/theme';

interface Skill {
  name: string;
  icon: React.ElementType;
  level: number;
  progress: number;
  gradient: string;
}

const skills: Skill[] = [
  { name: 'Listening', icon: Headphones, level: 3, progress: 65, gradient: STAT_GRADIENTS[0] },
  { name: 'Reading', icon: BookOpen, level: 4, progress: 80, gradient: STAT_GRADIENTS[1] },
  { name: 'Writing', icon: Pen, level: 2, progress: 45, gradient: STAT_GRADIENTS[2] },
  { name: 'Speaking', icon: Mic, level: 2, progress: 35, gradient: STAT_GRADIENTS[3] },
];

const SkillsTracker = () => {
  const overallLevel = Math.floor(skills.reduce((sum, s) => sum + s.level, 0) / skills.length);
  const overallProgress = Math.floor(skills.reduce((sum, s) => sum + s.progress, 0) / skills.length);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="font-display font-semibold text-foreground">Skills Progress</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          Level {overallLevel} • {overallProgress}% overall
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {skills.map((skill, i) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white',
                skill.gradient
              )}>
                <skill.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{skill.name}</p>
                <p className="text-xs text-muted-foreground">Level {skill.level}</p>
              </div>
              <span className="text-sm font-bold text-foreground">
                {skill.progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r', skill.gradient)}
                initial={{ width: 0 }}
                animate={{ width: `${skill.progress}%` }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Progress Ring */}
      <div className="flex items-center justify-center pt-4 border-t border-border">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-accent"
              initial={{ strokeDasharray: '0 251.2' }}
              animate={{ strokeDasharray: `${overallProgress * 2.512} 251.2` }}
              transition={{ delay: 0.5, duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-display font-bold text-foreground">{overallProgress}%</span>
            <span className="text-xs text-muted-foreground">Complete</span>
          </div>
        </div>
        <div className="ml-6">
          <p className="text-sm font-medium text-foreground mb-1">Great progress!</p>
          <p className="text-xs text-muted-foreground">
            Focus on <span className="text-streak font-medium">Speaking</span> to level up faster
          </p>
        </div>
      </div>
    </div>
  );
};

export default SkillsTracker;
