import { 
  BookOpen, 
  Gamepad2, 
  Video, 
  Trophy, 
  Flame,
  CheckCircle2,
  Star
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'lesson' | 'game' | 'video' | 'achievement' | 'streak' | 'quiz' | 'xp' | 'badge' | 'course';
  title: string;
  message: string;
  xp?: number;
  aura?: number;
  time: string;
  read: boolean;
}

export const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'lesson': return BookOpen;
    case 'game': return Gamepad2;
    case 'video': return Video;
    case 'achievement': return Trophy;
    case 'streak': return Flame;
    case 'quiz': return CheckCircle2;
    case 'xp': return Trophy;
    case 'badge': return Star;
    case 'course': return BookOpen;
    default: return Star;
  }
};

export const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'lesson': return 'text-accent bg-accent/10';
    case 'game': return 'text-destructive bg-destructive/10';
    case 'video': return 'text-primary bg-primary/10';
    case 'achievement': return 'text-gold bg-gold/10';
    case 'streak': return 'text-streak bg-streak/10';
    case 'quiz': return 'text-success bg-success/10';
    case 'xp': return 'text-gold bg-gold/10';
    case 'badge': return 'text-accent bg-accent/10';
    case 'course': return 'text-success bg-success/10';
    default: return 'text-muted-foreground bg-muted';
  }
};
