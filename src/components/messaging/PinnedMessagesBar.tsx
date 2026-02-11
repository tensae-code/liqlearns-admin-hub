import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const safeIndex = Math.min(currentIndex, pinnedMessages.length - 1);
  const currentPin = pinnedMessages[safeIndex];
  const hasMultiple = pinnedMessages.length > 1;

  const handleUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? pinnedMessages.length - 1 : prev - 1));
  };

  const handleDown = (e: React.MouseEvent) => {
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
      if (safeIndex >= pinnedMessages.length - 1 && safeIndex > 0) {
        setCurrentIndex(safeIndex - 1);
      }
    }
  };

  const previewText = currentPin.content
    ? `${currentPin.senderName ? currentPin.senderName + ': ' : ''}${currentPin.content}`
    : 'Pinned message';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border bg-accent/10 shrink-0"
    >
      <div className="flex items-center h-9 px-2 gap-1">
        {/* Up/Down navigation */}
        {hasMultiple && (
          <div className="flex flex-col shrink-0 -space-y-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-5 p-0"
              onClick={handleUp}
            >
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-5 p-0"
              onClick={handleDown}
            >
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        )}

        {/* Pin icon + clickable content */}
        <button
          onClick={handleClick}
          className="flex-1 flex items-center gap-1.5 min-w-0 hover:bg-accent/20 rounded px-1.5 py-0.5 transition-colors"
        >
          <Pin className="w-3.5 h-3.5 text-primary shrink-0 rotate-45" />
          <AnimatePresence mode="wait">
            <motion.span
              key={currentPin.message_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="text-xs text-foreground/80 truncate"
            >
              {hasMultiple && (
                <span className="text-muted-foreground mr-1">
                  {safeIndex + 1}/{pinnedMessages.length}
                </span>
              )}
              {previewText}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Close / Unpin button */}
        {canUnpin && onUnpin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
            onClick={handleUnpin}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default PinnedMessagesBar;
