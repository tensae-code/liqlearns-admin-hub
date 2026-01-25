import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PinnedMessage {
  id: string;
  message_id: string;
  content?: string;
  senderName?: string;
}

interface PinnedMessagesBarProps {
  pinnedMessages: PinnedMessage[];
  onNavigateToMessage: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  canUnpin?: boolean;
}

const PinnedMessagesBar = ({
  pinnedMessages,
  onNavigateToMessage,
  onUnpin,
  canUnpin = false,
}: PinnedMessagesBarProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pinnedMessages.length === 0) return null;

  const currentPin = pinnedMessages[currentIndex];
  const hasMultiple = pinnedMessages.length > 1;

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? pinnedMessages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === pinnedMessages.length - 1 ? 0 : prev + 1));
  };

  const handleClick = () => {
    onNavigateToMessage(currentPin.message_id);
  };

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnpin) {
      onUnpin(currentPin.message_id);
      if (currentIndex >= pinnedMessages.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border bg-accent/20 shrink-0"
    >
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/30 transition-colors"
      >
        <Pin className="w-4 h-4 text-accent shrink-0 rotate-45" />
        
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPin.message_id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {currentPin.senderName && (
                <p className="text-xs font-medium text-accent truncate">
                  {currentPin.senderName}
                </p>
              )}
              <p className="text-sm text-foreground/80 truncate">
                {currentPin.content || 'Pinned message'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {hasMultiple && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1}/{pinnedMessages.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNext}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        )}

        {canUnpin && onUnpin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
            onClick={handleUnpin}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </button>
    </motion.div>
  );
};

export default PinnedMessagesBar;
