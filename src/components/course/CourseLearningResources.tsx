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

  // Resources specific to this course
  const resources: LearningResource[] = [
    { id: 'assignments', name: 'Assignments', icon: ClipboardList, gradientIndex: 0, count: courseAssignments.length, unlocked: true, requiredModule: 0, isAssignment: true },
    { id: 'books', name: 'Books', icon: BookOpen, gradientIndex: 1, count: 24, unlocked: true, requiredModule: 0 },
    { id: 'vocabulary', name: 'Vocabulary', icon: Languages, gradientIndex: 2, count: 156, unlocked: true, requiredModule: 0 },
    { id: 'notes', name: 'Notes', icon: FileText, gradientIndex: 3, count: 42, unlocked: true, requiredModule: 1 },
    { id: 'exercise', name: 'Exercises', icon: PenTool, gradientIndex: 0, count: 89, unlocked: completedModules >= 1, requiredModule: 1 },
    { id: 'stories', name: 'Stories', icon: BookMarked, gradientIndex: 1, count: 18, unlocked: completedModules >= 2, requiredModule: 2 },
    { id: 'games', name: 'Games', icon: Gamepad2, gradientIndex: 2, count: gameTemplates.length, unlocked: true, requiredModule: 0 },
    { id: 'videos', name: 'Videos', icon: Video, gradientIndex: 3, count: 67, unlocked: completedModules >= 2, requiredModule: 2 },
    { id: 'music', name: 'Music', icon: Music, gradientIndex: 0, count: 45, unlocked: completedModules >= 3, requiredModule: 3 },
    { id: 'live', name: 'Live Sessions', icon: Radio, gradientIndex: 1, count: 5, unlocked: completedModules >= 4, requiredModule: 4 },
    { id: 'audiobooks', name: 'Audiobooks', icon: Headphones, gradientIndex: 2, count: 28, unlocked: completedModules >= 3, requiredModule: 3 },
    { id: 'translator', name: 'Translator', icon: Globe, gradientIndex: 3, count: 1, unlocked: true, requiredModule: 0 },
    { id: 'movies', name: 'Movies', icon: Film, gradientIndex: 0, count: 12, unlocked: completedModules >= 5, requiredModule: 5 },
  ];

  const handleResourceClick = (resource: LearningResource) => {
    if (resource.id === 'games' && gameTemplates.length > 0) {
      setShowGames(true);
    } else if (resource.isAssignment && courseAssignments.length > 0) {
      setSelectedAssignment(courseAssignments[0]);
      setSubmissionModalOpen(true);
    } else {
      onResourceClick?.(resource);
    }
  };

  const getGameTypeInfo = (typeId: string) => {
    return GAME_TYPES.find(g => g.id === typeId);
  };

  const activeGameIndex = activeGame ? gameTemplates.findIndex(g => g.id === activeGame.id) : -1;

  const goToNextGame = () => {
    if (activeGameIndex < gameTemplates.length - 1) {
      setActiveGame(gameTemplates[activeGameIndex + 1]);
    }
  };

  const goToPrevGame = () => {
    if (activeGameIndex > 0) {
      setActiveGame(gameTemplates[activeGameIndex - 1]);
    }
  };

  // If playing a game
  if (activeGame) {
    return (
      <motion.div
        className="bg-card rounded-xl border border-border p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setActiveGame(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Games
          </Button>
          <h3 className="text-lg font-display font-semibold text-foreground flex-1 truncate">{activeGame.title}</h3>
          <span className="text-xs text-muted-foreground shrink-0">{activeGameIndex + 1}/{gameTemplates.length}</span>
        </div>
        <GamePlayer template={activeGame} onComplete={(score, maxScore) => {
          console.log('Game completed:', score, '/', maxScore);
        }} />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={goToPrevGame} disabled={activeGameIndex <= 0}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button size="sm" onClick={goToNextGame} disabled={activeGameIndex >= gameTemplates.length - 1}>
            Next <Play className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // If showing game list
  if (showGames) {
    return (
      <motion.div
        className="bg-card rounded-xl border border-border p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setShowGames(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h3 className="text-lg font-display font-semibold text-foreground">
            Games ({gameTemplates.length})
          </h3>
        </div>

        {loadingGames ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : gameTemplates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No games available for this course yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {gameTemplates.map((game, i) => {
              const typeInfo = getGameTypeInfo(game.type);
              return (
                <motion.button
                  key={game.id}
                  onClick={() => setActiveGame(game)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-accent/30 hover:shadow-md transition-all text-left group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br',
                    typeInfo?.color || 'from-accent to-accent/60'
                  )}>
                    <Gamepad2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{game.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {typeInfo?.name || game.type} • {game.level || 'All levels'}
                    </p>
                    {game.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{game.description}</p>
                    )}
                  </div>
                  <Play className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

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
