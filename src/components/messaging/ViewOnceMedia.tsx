import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaOptions {
  viewOnce?: boolean;
  saveInChat?: boolean;
  repeat?: boolean;
  blur?: boolean;
}

interface ViewOnceMediaProps {
  type: 'image' | 'video';
  url: string;
  options?: MediaOptions;
  isSender: boolean;
  onViewed?: () => void;
  hasBeenViewed?: boolean;
}

const ViewOnceMedia = ({
  type,
  url,
  options = {},
  isSender,
  onViewed,
  hasBeenViewed = false,
}: ViewOnceMediaProps) => {
  const [revealed, setRevealed] = useState(false);
  const [viewed, setViewed] = useState(hasBeenViewed);
  
  const isBlurred = options.blur && !revealed;
  const isViewOnce = options.viewOnce;

  // If view once and already viewed, show placeholder
  if (isViewOnce && viewed && !isSender) {
    return (
      <div className="w-[200px] h-[150px] rounded-2xl bg-muted flex flex-col items-center justify-center gap-2">
        <EyeOff className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Media expired</p>
      </div>
    );
  }

  const handleReveal = () => {
    setRevealed(true);
    
    if (isViewOnce && !isSender) {
      // Mark as viewed after a delay
      setTimeout(() => {
        setViewed(true);
        onViewed?.();
      }, 3000); // Auto-hide after 3 seconds
    }
  };

  const handleHide = () => {
    if (!isViewOnce) {
      setRevealed(false);
    }
  };

  return (
    <div className="relative max-w-[280px] rounded-2xl overflow-hidden">
      {/* Media content */}
      <div className={cn(
        "transition-all duration-300",
        isBlurred && "blur-xl"
      )}>
        {type === 'image' ? (
          <img 
            src={url} 
            alt="Media" 
            className="w-full h-auto"
          />
        ) : (
          <video 
            src={url} 
            className="w-full h-auto"
            loop={options.repeat}
            controls={revealed}
            autoPlay={revealed}
            muted={!revealed}
          />
        )}
      </div>

      {/* Blur overlay with reveal button */}
      <AnimatePresence>
        {isBlurred && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={handleReveal}
            >
              {type === 'video' ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Tap to view
            </Button>
            {isViewOnce && (
              <p className="text-xs text-white/70 mt-2">View once</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View once indicator for sender */}
      {isViewOnce && isSender && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {viewed ? 'Opened' : 'View once'}
        </div>
      )}

      {/* Loop indicator */}
      {options.repeat && type === 'video' && (
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
          Loop
        </div>
      )}

      {/* Tap to hide for non-view-once blurred media */}
      {revealed && options.blur && !isViewOnce && (
        <button
          onClick={handleHide}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ViewOnceMedia;
