import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ChevronRight, 
  X, 
  BookOpen, 
  Gamepad2, 
  Video, 
  Trophy, 
  Star, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'lesson' | 'game' | 'video' | 'achievement' | 'streak' | 'quiz';
  title: string;
  description: string;
  xp: number;
  aura?: number;
  time: string;
}

const activities: Activity[] = [
  { id: '1', type: 'lesson', title: 'Completed Amharic Lesson 5', description: 'Basic Greetings', xp: 50, aura: 10, time: '10 min ago' },
  { id: '2', type: 'game', title: 'Won Memory Match', description: 'Vocabulary Challenge', xp: 30, time: '25 min ago' },
  { id: '3', type: 'achievement', title: 'Earned Badge', description: 'First Week Champion', xp: 100, aura: 25, time: '1 hour ago' },
  { id: '4', type: 'video', title: 'Watched Tutorial', description: 'Ethiopian Culture', xp: 20, time: '2 hours ago' },
  { id: '5', type: 'streak', title: 'Streak Extended!', description: '7 days in a row', xp: 75, aura: 15, time: '3 hours ago' },
  { id: '6', type: 'quiz', title: 'Quiz Completed', description: 'Reading Comprehension', xp: 45, time: '5 hours ago' },
  { id: '7', type: 'lesson', title: 'Completed Writing Exercise', description: 'Amharic Alphabet', xp: 35, time: 'Yesterday' },
  { id: '8', type: 'game', title: 'Flashcard Practice', description: '50 cards reviewed', xp: 25, time: 'Yesterday' },
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'lesson': return BookOpen;
    case 'game': return Gamepad2;
    case 'video': return Video;
    case 'achievement': return Trophy;
    case 'streak': return Flame;
    case 'quiz': return CheckCircle2;
    default: return Star;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'lesson': return 'text-accent bg-accent/10';
    case 'game': return 'text-destructive bg-destructive/10';
    case 'video': return 'text-primary bg-primary/10';
    case 'achievement': return 'text-gold bg-gold/10';
    case 'streak': return 'text-streak bg-streak/10';
    case 'quiz': return 'text-success bg-success/10';
    default: return 'text-muted-foreground bg-muted';
  }
};

const RecentActivity = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.div
        className="bg-card rounded-xl border border-border p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="font-display font-semibold text-foreground">Recent Activity</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(true)}>
            See More <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {activities.slice(0, 4).map((activity, i) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <motion.div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClass)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-success">+{activity.xp} XP</span>
                  {activity.aura && (
                    <p className="text-xs text-gold">+{activity.aura} Aura</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* See More Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col border border-border shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <h2 className="font-display font-bold text-foreground">Activity History</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-success/10 text-center">
                  <p className="text-xl font-bold text-success">{activities.reduce((sum, a) => sum + a.xp, 0)}</p>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
                <div className="p-3 rounded-lg bg-gold/10 text-center">
                  <p className="text-xl font-bold text-gold">{activities.filter(a => a.aura).reduce((sum, a) => sum + (a.aura || 0), 0)}</p>
                  <p className="text-xs text-muted-foreground">Aura Earned</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10 text-center">
                  <p className="text-xl font-bold text-accent">{activities.length}</p>
                  <p className="text-xs text-muted-foreground">Activities</p>
                </div>
              </div>

              {/* Activity List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {activities.map((activity, i) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);
                  
                  return (
                    <motion.div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant="outline" className="text-success border-success/30 mb-1">
                          +{activity.xp} XP
                        </Badge>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RecentActivity;
