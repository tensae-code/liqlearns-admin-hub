import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Languages, 
  FileText, 
  PenTool, 
  BookMarked, 
  Gamepad2, 
  Video, 
  Music, 
  Radio, 
  Headphones, 
  Globe, 
  Film,
  Lock,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getGradient } from '@/lib/theme';

interface LearningResource {
  id: string;
  name: string;
  icon: React.ElementType;
  gradientIndex: number;
  count: number;
  unlocked: boolean;
  requiredModule: number;
}

interface CourseLearningResourcesProps {
  courseId?: string;
  courseCategory?: string;
  completedModules?: number;
  onResourceClick?: (resource: LearningResource) => void;
}

const CourseLearningResources = ({ 
  courseId, 
  courseCategory = 'Language',
  completedModules = 2,
  onResourceClick 
}: CourseLearningResourcesProps) => {
  // Resources specific to this course - using gradient indices for consistent styling
  const resources: LearningResource[] = [
    { id: 'books', name: 'Books', icon: BookOpen, gradientIndex: 0, count: 24, unlocked: true, requiredModule: 0 },
    { id: 'vocabulary', name: 'Vocabulary', icon: Languages, gradientIndex: 1, count: 156, unlocked: true, requiredModule: 0 },
    { id: 'notes', name: 'Notes', icon: FileText, gradientIndex: 2, count: 42, unlocked: true, requiredModule: 1 },
    { id: 'exercise', name: 'Exercises', icon: PenTool, gradientIndex: 3, count: 89, unlocked: completedModules >= 1, requiredModule: 1 },
    { id: 'stories', name: 'Stories', icon: BookMarked, gradientIndex: 0, count: 18, unlocked: completedModules >= 2, requiredModule: 2 },
    { id: 'games', name: 'Games', icon: Gamepad2, gradientIndex: 1, count: 32, unlocked: completedModules >= 1, requiredModule: 1 },
    { id: 'videos', name: 'Videos', icon: Video, gradientIndex: 2, count: 67, unlocked: completedModules >= 2, requiredModule: 2 },
    { id: 'music', name: 'Music', icon: Music, gradientIndex: 3, count: 45, unlocked: completedModules >= 3, requiredModule: 3 },
    { id: 'live', name: 'Live Sessions', icon: Radio, gradientIndex: 0, count: 5, unlocked: completedModules >= 4, requiredModule: 4 },
    { id: 'audiobooks', name: 'Audiobooks', icon: Headphones, gradientIndex: 1, count: 28, unlocked: completedModules >= 3, requiredModule: 3 },
    { id: 'translator', name: 'Translator', icon: Globe, gradientIndex: 2, count: 1, unlocked: true, requiredModule: 0 },
    { id: 'movies', name: 'Movies', icon: Film, gradientIndex: 3, count: 12, unlocked: completedModules >= 5, requiredModule: 5 },
  ];

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground">Learning Resources</h3>
        <span className="text-xs text-muted-foreground">
          {resources.filter(r => r.unlocked).length}/{resources.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {resources.map((resource, i) => {
          const isLocked = !resource.unlocked;
          const ResourceIcon = resource.icon;
          
          return (
            <motion.button
              key={resource.id}
              className={cn(
                'relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all',
                isLocked 
                  ? 'bg-muted/50 border-border cursor-not-allowed opacity-60'
                  : 'bg-card border-border hover:border-accent/30 hover:shadow-md cursor-pointer group'
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileHover={!isLocked ? { scale: 1.05 } : {}}
              whileTap={!isLocked ? { scale: 0.98 } : {}}
              onClick={() => !isLocked && onResourceClick?.(resource)}
              disabled={isLocked}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-all',
                isLocked ? 'bg-muted' : `bg-gradient-to-br ${getGradient(resource.gradientIndex)}`,
                !isLocked && 'group-hover:scale-110'
              )}>
                {isLocked ? (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ResourceIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <span className={cn(
                'text-xs font-medium text-center',
                isLocked ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {resource.name}
              </span>
              {!isLocked && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {resource.count}
                </span>
              )}
              {isLocked && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Module {resource.requiredModule}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CourseLearningResources;
