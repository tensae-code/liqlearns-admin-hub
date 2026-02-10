import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Grid3X3, Brain, GripVertical, TextCursorInput, Search, 
  Pencil, Mic, Timer, CircleCheck, Gamepad2,
  Link, FolderInput, ListOrdered, Layers, ToggleLeft,
  MousePointerClick, Hash, CircleDot, Shuffle, Tag,
  HelpCircle, Images, Keyboard
} from 'lucide-react';
import { GAME_TYPES } from '@/lib/gameTypes';
import type { GameTemplate } from '@/hooks/useGameTemplates';
import BingoPlayer from './BingoPlayer';
import MemoryPlayer from './MemoryPlayer';
import DragDropPlayer from './DragDropPlayer';
import FillBlanksPlayer from './FillBlanksPlayer';
import WordSearchPlayer from './WordSearchPlayer';
import TracingPlayer from './TracingPlayer';
import RecordingPlayer from './RecordingPlayer';
import TimerChallengePlayer from './TimerChallengePlayer';
import QuizPlayer from './QuizPlayer';
import MatchingPlayer from './MatchingPlayer';
import SortingPlayer from './SortingPlayer';
import SequencingPlayer from './SequencingPlayer';
import FlashcardsPlayer from './FlashcardsPlayer';
import TrueFalsePlayer from './TrueFalsePlayer';
import HotspotPlayer from './HotspotPlayer';
import CrosswordPlayer from './CrosswordPlayer';
import SpinWheelPlayer from './SpinWheelPlayer';
import HangmanPlayer from './HangmanPlayer';
import SentenceBuilderPlayer from './SentenceBuilderPlayer';
import OddOneOutPlayer from './OddOneOutPlayer';
import WordUnscramblePlayer from './WordUnscramblePlayer';
import LabelingPlayer from './LabelingPlayer';
import RiddlePlayer from './RiddlePlayer';
import PictureSequencePlayer from './PictureSequencePlayer';
import TypeRacerPlayer from './TypeRacerPlayer';

const ICON_MAP: Record<string, React.ElementType> = {
  Grid3X3, Brain, GripVertical, TextCursorInput, Search,
  Pencil, Mic, Timer, CircleCheck, Link, FolderInput,
  ListOrdered, Layers, ToggleLeft, MousePointerClick, Hash, CircleDot,
  Shuffle, Tag, HelpCircle, Images, Keyboard,
};

interface GamePlayerProps {
  template: GameTemplate;
  onComplete?: (score: number, maxScore: number) => void;
}

const GamePlayer = ({ template, onComplete }: GamePlayerProps) => {
  const gameType = GAME_TYPES.find(t => t.id === template.type);
  const Icon = gameType ? (ICON_MAP[gameType.icon] || Gamepad2) : Gamepad2;

  const renderPlayer = () => {
    switch (template.type) {
      case 'bingo':
        return <BingoPlayer config={template.config} onComplete={onComplete} />;
      case 'memory':
        return <MemoryPlayer config={template.config} onComplete={onComplete} />;
      case 'drag_drop':
        return <DragDropPlayer config={template.config} onComplete={onComplete} />;
      case 'fill_blanks':
        return <FillBlanksPlayer config={template.config} onComplete={onComplete} />;
      case 'word_search':
        return <WordSearchPlayer config={template.config} onComplete={onComplete} />;
      case 'tracing':
        return <TracingPlayer config={template.config} onComplete={onComplete} />;
      case 'recording':
        return <RecordingPlayer config={template.config} onComplete={onComplete} />;
      case 'timer_challenge':
        return <TimerChallengePlayer config={template.config} onComplete={onComplete} />;
      case 'quiz':
        return <QuizPlayer config={template.config} onComplete={onComplete} />;
      case 'matching':
        return <MatchingPlayer config={template.config} onComplete={onComplete} />;
      case 'sorting':
        return <SortingPlayer config={template.config} onComplete={onComplete} />;
      case 'sequencing':
        return <SequencingPlayer config={template.config} onComplete={onComplete} />;
      case 'flashcards':
        return <FlashcardsPlayer config={template.config} onComplete={onComplete} />;
      case 'true_false':
        return <TrueFalsePlayer config={template.config} onComplete={onComplete} />;
      case 'hotspot':
        return <HotspotPlayer config={template.config} onComplete={onComplete} />;
      case 'crossword':
        return <CrosswordPlayer config={template.config} onComplete={onComplete} />;
      case 'spin_wheel':
        return <SpinWheelPlayer config={template.config} onComplete={onComplete} />;
      case 'hangman':
        return <HangmanPlayer config={template.config} onComplete={onComplete} />;
      case 'sentence_builder':
        return <SentenceBuilderPlayer config={template.config} onComplete={onComplete} />;
      case 'odd_one_out':
        return <OddOneOutPlayer config={template.config} onComplete={onComplete} />;
      case 'word_unscramble':
        return <WordUnscramblePlayer config={template.config} onComplete={onComplete} />;
      case 'labeling':
        return <LabelingPlayer config={template.config} onComplete={onComplete} />;
      case 'riddle':
        return <RiddlePlayer config={template.config} onComplete={onComplete} />;
      case 'picture_sequence':
        return <PictureSequencePlayer config={template.config} onComplete={onComplete} />;
      case 'type_racer':
        return <TypeRacerPlayer config={template.config} onComplete={onComplete} />;
      default:
        return <p className="text-center text-muted-foreground py-8">Unknown game type</p>;
    }
  };

  return (
    <motion.div
      className="bg-card rounded-xl border border-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0',
          gameType?.color || 'from-gray-400 to-gray-500'
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{template.title}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
              {gameType?.name || template.type}
            </Badge>
            {template.level && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                {template.level}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <div className="px-4 pt-3">
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
      )}

      {/* Game content */}
      <div className="p-4">
        {renderPlayer()}
      </div>
    </motion.div>
  );
};

export default GamePlayer;
