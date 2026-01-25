import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Eye, Save, Repeat, EyeOff, Send } from 'lucide-react';

export interface MediaOptions {
  viewOnce?: boolean;
  saveInChat?: boolean;
  repeat?: boolean;
  blur?: boolean;
}

interface MediaOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (options: MediaOptions) => void;
  fileName?: string;
  isImage?: boolean;
  isVideo?: boolean;
}

const MediaOptionsModal = ({
  open,
  onOpenChange,
  onConfirm,
  fileName,
  isImage = false,
  isVideo = false,
}: MediaOptionsModalProps) => {
  const [viewOnce, setViewOnce] = useState(false);
  const [blur, setBlur] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const handleConfirm = () => {
    onConfirm({
      viewOnce,
      saveInChat: !viewOnce,
      repeat: isVideo ? repeat : undefined,
      blur,
    });
    // Reset state
    setViewOnce(false);
    setBlur(false);
    setRepeat(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Media Options</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File name preview */}
          {fileName && (
            <p className="text-sm text-muted-foreground truncate">
              {fileName}
            </p>
          )}

          {/* View Once Option */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="viewOnce" className="text-sm font-medium">
                  View Once
                </Label>
                <p className="text-xs text-muted-foreground">
                  Media disappears after viewing
                </p>
              </div>
            </div>
            <Switch
              id="viewOnce"
              checked={viewOnce}
              onCheckedChange={setViewOnce}
            />
          </div>

          {/* Blur Option */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="blur" className="text-sm font-medium">
                  Blur Media
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recipient must tap to reveal
                </p>
              </div>
            </div>
            <Switch
              id="blur"
              checked={blur}
              onCheckedChange={setBlur}
            />
          </div>

          {/* Repeat Option - Only for videos */}
          {isVideo && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="repeat" className="text-sm font-medium">
                    Loop Video
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Video plays in a loop
                  </p>
                </div>
              </div>
              <Switch
                id="repeat"
                checked={repeat}
                onCheckedChange={setRepeat}
              />
            </div>
          )}

          {/* Info text */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              {viewOnce 
                ? "This media will only be viewable once and won't be saved in the chat history."
                : "This media will be saved in the chat and can be viewed anytime."
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Send className="w-4 h-4" />
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaOptionsModal;
