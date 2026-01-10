import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularSkillRingProps {
  name: string;
  icon: React.ReactNode;
  progress: number;
  color: string;
  bgColor: string;
  label: string;
}

const CircularSkillRing = ({ name, icon, progress, color, bgColor, label }: CircularSkillRingProps) => {
  const circumference = 2 * Math.PI * 36; // radius = 36
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getLabel = () => {
    if (progress >= 80) return 'Great!';
    if (progress >= 60) return 'Bravo!';
    if (progress >= 40) return 'Fair';
    return 'Keep Going';
  };

  return (
    <motion.div
      className="flex flex-col items-center p-4 bg-card rounded-xl border border-border hover:border-accent/30 hover:shadow-lg transition-all cursor-pointer group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Circular Progress Ring */}
      <div className="relative w-20 h-20 mb-3">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted"
          />
          {/* Progress circle */}
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className={color}
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        {/* Icon in center */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          'rounded-full m-3',
          bgColor
        )}>
          <div className={cn('w-6 h-6', color.replace('text-', 'text-'))}>
            {icon}
          </div>
        </div>
      </div>

      {/* Skill name */}
      <h4 className="font-display font-semibold text-foreground text-sm mb-1">{name}</h4>
      
      {/* Progress percentage */}
      <div className="flex items-center gap-2">
        <span className={cn('text-lg font-bold', color)}>{progress}%</span>
      </div>
      
      {/* Label */}
      <span className={cn(
        'text-xs font-medium mt-1 px-2 py-0.5 rounded-full',
        progress >= 80 ? 'bg-success/10 text-success' :
        progress >= 60 ? 'bg-gold/10 text-gold' :
        progress >= 40 ? 'bg-accent/10 text-accent' :
        'bg-muted text-muted-foreground'
      )}>
        {getLabel()}
      </span>
    </motion.div>
  );
};

export default CircularSkillRing;
