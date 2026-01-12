import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Settings,
  Zap,
  Flame,
  GraduationCap,
  MapPin,
  BookOpen,
  Pin,
  Eye,
} from 'lucide-react';

interface DisplaySettings {
  showXP: boolean;
  showStreak: boolean;
  showEducation: boolean;
  showCountry: boolean;
  showStudyTitle: boolean;
  showPinCount: boolean;
  blurBackground: boolean;
}

interface RoomSettingsSheetProps {
  displaySettings: DisplaySettings;
  onUpdateDisplaySetting: (key: keyof DisplaySettings, value: boolean) => void;
  trigger?: React.ReactNode;
}

const RoomSettingsSheet = ({
  displaySettings,
  onUpdateDisplaySetting,
  trigger,
}: RoomSettingsSheetProps) => {
  const displayToggles = [
    { key: 'showXP' as const, label: 'XP Points', icon: Zap, description: 'Show XP points on participant cards' },
    { key: 'showStreak' as const, label: 'Streak', icon: Flame, description: 'Show streak count' },
    { key: 'showEducation' as const, label: 'Education Level', icon: GraduationCap, description: 'Show education level' },
    { key: 'showCountry' as const, label: 'Country', icon: MapPin, description: 'Show country flag/name' },
    { key: 'showStudyTitle' as const, label: 'Study Topic', icon: BookOpen, description: 'Show what others are studying' },
    { key: 'showPinCount' as const, label: 'Pin Count', icon: Pin, description: 'Show how many people pinned this user' },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Room Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Video Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Video Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <Label htmlFor="blurBackground" className="text-sm font-medium cursor-pointer">
                    Blur Background
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Apply blur effect to your video background
                  </p>
                </div>
                <Switch
                  id="blurBackground"
                  checked={displaySettings.blurBackground}
                  onCheckedChange={(checked) => onUpdateDisplaySetting('blurBackground', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Pin className="w-4 h-4" />
              Display Settings
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Choose what information to show for each participant
            </p>
            <div className="space-y-2">
              {displayToggles.map(({ key, label, icon: Icon, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  </div>
                  <Switch
                    id={key}
                    checked={displaySettings[key]}
                    onCheckedChange={(checked) => onUpdateDisplaySetting(key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RoomSettingsSheet;
