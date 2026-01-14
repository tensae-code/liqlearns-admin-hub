import { motion } from 'framer-motion';
import { FileText, StickyNote, Trophy, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface GradeCard {
  label: string;
  grade: string;
  percentage: number;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  progressColor: string;
}

const GradingSystem = () => {
  const grades: GradeCard[] = [
    {
      label: 'Assignments',
      grade: 'A',
      percentage: 92,
      icon: FileText,
      bgColor: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      progressColor: 'bg-blue-500',
    },
    {
      label: 'Notes',
      grade: 'B+',
      percentage: 87,
      icon: StickyNote,
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressColor: 'bg-emerald-500',
    },
    {
      label: 'Quizzes',
      grade: 'A-',
      percentage: 90,
      icon: Trophy,
      bgColor: 'bg-violet-100 dark:bg-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      progressColor: 'bg-violet-500',
    },
    {
      label: 'Projects',
      grade: 'B',
      percentage: 85,
      icon: Target,
      bgColor: 'bg-orange-100 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      progressColor: 'bg-orange-500',
    },
  ];

  // Calculate overall grade
  const overallPercentage = grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length;
  const getLetterGrade = (pct: number) => {
    if (pct >= 90) return 'A';
    if (pct >= 87) return 'B+';
    if (pct >= 83) return 'B';
    if (pct >= 80) return 'B-';
    if (pct >= 77) return 'C+';
    if (pct >= 73) return 'C';
    return 'C-';
  };

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-accent" />
        <h2 className="text-base font-display font-semibold text-foreground">Grading System</h2>
      </div>

      {/* Grade Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {grades.map((grade, i) => (
          <motion.div
            key={grade.label}
            className={`${grade.bgColor} rounded-xl p-3 border border-transparent`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start justify-between mb-2">
              <grade.icon className={`w-5 h-5 ${grade.iconColor}`} />
              <span className={`text-lg font-bold ${grade.iconColor}`}>{grade.grade}</span>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{grade.label}</p>
            <p className={`text-xs ${grade.iconColor}`}>Grade: {grade.percentage}%</p>
            <div className="mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden">
              <div 
                className={`h-full ${grade.progressColor} rounded-full transition-all`}
                style={{ width: `${grade.percentage}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Grade */}
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Overall Course Grade</p>
            <p className="text-2xl font-bold text-foreground">{overallPercentage.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{getLetterGrade(overallPercentage)}+</p>
            <p className="text-xs text-muted-foreground">Above Average</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GradingSystem;
