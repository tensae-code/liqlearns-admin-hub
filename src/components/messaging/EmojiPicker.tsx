import { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EmojiPicker = ({ onEmojiSelect, className }: EmojiPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setShowPicker(false);
  };

  return (
    <div className={cn("relative", className)} ref={pickerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPicker(!showPicker)}
        className="shrink-0"
        type="button"
      >
        <Smile className="w-5 h-5 text-muted-foreground" />
      </Button>

      {showPicker && (
        <div className="absolute bottom-12 right-0 z-50 shadow-xl rounded-lg overflow-hidden">
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="auto"
            previewPosition="none"
            skinTonePosition="none"
            maxFrequentRows={2}
            perLine={8}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
