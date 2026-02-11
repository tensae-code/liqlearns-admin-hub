import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

interface MessageSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MessageSettingsModal = ({ open, onOpenChange }: MessageSettingsModalProps) => {
  const [fontSize, setFontSize] = useState(14);
  const [showStatus, setShowStatus] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
  const [acceptFromNonFriends, setAcceptFromNonFriends] = useState(true);
  const [messagesBeforeAccept, setMessagesBeforeAccept] = useState(3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Message Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Font Size: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={10}
              max={22}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${fontSize}px` }}>
              Preview text
            </p>
          </div>

          <Separator />

          {/* Display toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-status" className="text-sm">Show online status</Label>
              <Switch id="show-status" checked={showStatus} onCheckedChange={setShowStatus} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-activity" className="text-sm">Show activity (typing, in chat)</Label>
              <Switch id="show-activity" checked={showActivity} onCheckedChange={setShowActivity} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-avatar" className="text-sm">Show profile pictures</Label>
              <Switch id="show-avatar" checked={showAvatar} onCheckedChange={setShowAvatar} />
            </div>
          </div>

          <Separator />

          {/* Privacy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="accept-non-friends" className="text-sm">Accept messages from non-friends</Label>
              <Switch id="accept-non-friends" checked={acceptFromNonFriends} onCheckedChange={setAcceptFromNonFriends} />
            </div>
            {acceptFromNonFriends && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Messages before auto-accept: {messagesBeforeAccept}
                </Label>
                <Slider
                  value={[messagesBeforeAccept]}
                  onValueChange={([v]) => setMessagesBeforeAccept(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageSettingsModal;
