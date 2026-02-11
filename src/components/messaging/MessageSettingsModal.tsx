import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useMessagingSettings } from '@/hooks/useMessagingSettings';

interface MessageSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MessageSettingsModal = ({ open, onOpenChange }: MessageSettingsModalProps) => {
  const { settings, updateSettings } = useMessagingSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Message Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Font Size: {settings.font_size}px</Label>
            <Slider
              value={[settings.font_size]}
              onValueChange={([v]) => updateSettings({ font_size: v })}
              min={10}
              max={22}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${settings.font_size}px` }}>
              Preview text
            </p>
          </div>

          <Separator />

          {/* Display toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-status" className="text-sm">Show online status</Label>
              <Switch id="show-status" checked={settings.show_status} onCheckedChange={(v) => updateSettings({ show_status: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-activity" className="text-sm">Show activity (typing, in chat)</Label>
              <Switch id="show-activity" checked={settings.show_activity} onCheckedChange={(v) => updateSettings({ show_activity: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-avatar" className="text-sm">Show profile pictures</Label>
              <Switch id="show-avatar" checked={settings.show_avatar} onCheckedChange={(v) => updateSettings({ show_avatar: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-name" className="text-sm">Show my name to others</Label>
              <Switch id="show-name" checked={settings.show_name} onCheckedChange={(v) => updateSettings({ show_name: v })} />
            </div>
          </div>

          <Separator />

          {/* Privacy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="accept-non-friends" className="text-sm">Accept messages from non-friends</Label>
              <Switch id="accept-non-friends" checked={settings.accept_non_friends} onCheckedChange={(v) => updateSettings({ accept_non_friends: v })} />
            </div>
            {settings.accept_non_friends && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Messages before auto-accept: {settings.messages_before_accept}
                </Label>
                <Slider
                  value={[settings.messages_before_accept]}
                  onValueChange={([v]) => updateSettings({ messages_before_accept: v })}
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
