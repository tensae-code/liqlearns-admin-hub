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
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningResource {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  count: number;
  unlocked: boolean;
  requiredLevel: number;
}

const resources: LearningResource[] = [
  { id: 'books', name: 'Books', icon: BookOpen, color: 'text-accent', bgColor: 'bg-accent/10', count: 24, unlocked: true, requiredLevel: 1 },
  { id: 'vocabulary', name: 'Vocabulary', icon: Languages, color: 'text-gold', bgColor: 'bg-gold/10', count: 156, unlocked: true, requiredLevel: 1 },
  { id: 'notes', name: 'Notes', icon: FileText, color: 'text-success', bgColor: 'bg-success/10', count: 42, unlocked: true, requiredLevel: 1 },
  { id: 'exercise', name: 'Exercises', icon: PenTool, color: 'text-streak', bgColor: 'bg-streak/10', count: 89, unlocked: true, requiredLevel: 2 },
  { id: 'stories', name: 'Stories', icon: BookMarked, color: 'text-primary', bgColor: 'bg-primary/10', count: 18, unlocked: true, requiredLevel: 2 },
  { id: 'games', name: 'Games', icon: Gamepad2, color: 'text-destructive', bgColor: 'bg-destructive/10', count: 32, unlocked: true, requiredLevel: 1 },
  { id: 'videos', name: 'Videos', icon: Video, color: 'text-accent', bgColor: 'bg-accent/10', count: 67, unlocked: true, requiredLevel: 3 },
  { id: 'music', name: 'Music', icon: Music, color: 'text-gold', bgColor: 'bg-gold/10', count: 45, unlocked: true, requiredLevel: 3 },
  { id: 'live', name: 'Live Sessions', icon: Radio, color: 'text-destructive', bgColor: 'bg-destructive/10', count: 5, unlocked: true, requiredLevel: 4 },
  { id: 'audiobooks', name: 'Audiobooks', icon: Headphones, color: 'text-success', bgColor: 'bg-success/10', count: 28, unlocked: true, requiredLevel: 3 },
  { id: 'translator', name: 'Translator', icon: Globe, color: 'text-primary', bgColor: 'bg-primary/10', count: 1, unlocked: true, requiredLevel: 2 },
  { id: 'movies', name: 'Movies', icon: Film, color: 'text-streak', bgColor: 'bg-streak/10', count: 12, unlocked: false, requiredLevel: 5 },
];

interface LearningResourcesProps {
  userLevel?: number;
  onResourceClick?: (resource: LearningResource) => void;
}

const LearningResources = ({ userLevel = 4, onResourceClick }: LearningResourcesProps) => {
  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-foreground">Learning Resources</h2>
        <span className="text-xs text-muted-foreground">12 types available</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {resources.map((resource, i) => {
          const isLocked = resource.requiredLevel > userLevel;
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
                isLocked ? 'bg-muted' : resource.bgColor,
                !isLocked && 'group-hover:scale-110'
              )}>
                {isLocked ? (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ResourceIcon className={cn('w-5 h-5', resource.color)} />
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
                  Lvl {resource.requiredLevel}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LearningResources;
