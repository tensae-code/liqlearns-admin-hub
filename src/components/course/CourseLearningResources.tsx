import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  ClipboardList,
  Send,
  ArrowLeft,
  Play,
  Trophy,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getGradient } from '@/lib/theme';
import AssignmentSubmissionModal from './AssignmentSubmissionModal';
import { supabase } from '@/integrations/supabase/client';
import GamePlayer from '@/components/games/GamePlayer';
import type { GameTemplate } from '@/hooks/useGameTemplates';
import type { GameConfig } from '@/lib/gameTypes';
import { GAME_TYPES } from '@/lib/gameTypes';

interface LearningResource {
  id: string;
  name: string;
  icon: React.ElementType;
  gradientIndex: number;
  count: number;
  unlocked: boolean;
  requiredModule: number;
  isAssignment?: boolean;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  instructions: string;
  submissionTypes: ('text' | 'file' | 'audio' | 'video')[];
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
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showGames, setShowGames] = useState(false);
  const [gameTemplates, setGameTemplates] = useState<GameTemplate[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [activeGame, setActiveGame] = useState<GameTemplate | null>(null);

  // Fetch game templates for this course
  useEffect(() => {
    const fetchGames = async () => {
      if (!courseId) return;
      setLoadingGames(true);
      const { data, error } = await supabase
        .from('game_templates')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('created_at');
      if (!error && data) {
        setGameTemplates(data.map(d => ({ ...d, config: (d.config || {}) as GameConfig })) as GameTemplate[]);
      }
      setLoadingGames(false);
    };
    fetchGames();
  }, [courseId]);

  // Mock assignments for this course
  const courseAssignments: Assignment[] = [
    {
      id: 'a1',
      title: 'Week 1: Basic Greetings Essay',
      course: 'Amharic Basics for Beginners',
      dueDate: '2024-01-25T23:59:00',
      instructions: 'Write a short essay (200-300 words) introducing yourself in Amharic. Include greetings, your name, where you are from, and what you hope to learn.',
      submissionTypes: ['text', 'file']
    },
    {
      id: 'a2',
      title: 'Pronunciation Practice',
      course: 'Amharic Basics for Beginners',
      dueDate: '2024-01-28T23:59:00',
      instructions: 'Record yourself saying the 10 greeting phrases from this module. Speak clearly and try to match the pronunciation from the lesson.',
      submissionTypes: ['audio', 'video']
    }
  ];

  const handleSubmit = (assignmentId: string, submission: { type: string; content: string; fileUrl?: string }) => {
    console.log('Submitted:', assignmentId, submission);
  };

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
          const isAssignment = resource.isAssignment;
          
          return (
            <motion.button
              key={resource.id}
              className={cn(
                'relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all',
                isLocked 
                  ? 'bg-muted/50 border-border cursor-not-allowed opacity-60'
                  : isAssignment
                    ? 'bg-primary/5 border-primary/30 hover:border-primary hover:shadow-md cursor-pointer group'
                    : 'bg-card border-border hover:border-accent/30 hover:shadow-md cursor-pointer group'
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileHover={!isLocked ? { scale: 1.05 } : {}}
              whileTap={!isLocked ? { scale: 0.98 } : {}}
              onClick={() => !isLocked && handleResourceClick(resource)}
              disabled={isLocked}
            >
              {isAssignment && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              )}
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

      {/* Assignment Submission Modal */}
      <AssignmentSubmissionModal
        open={submissionModalOpen}
        onOpenChange={setSubmissionModalOpen}
        assignment={selectedAssignment}
        onSubmit={handleSubmit}
      />
    </motion.div>
  );
};

export default CourseLearningResources;
