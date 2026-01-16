import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Shield,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Globe,
  Users,
  Coins,
  Gift,
  Clock,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformControlsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlatformControls = ({ open, onOpenChange }: PlatformControlsProps) => {
  const [activeTab, setActiveTab] = useState('security');
  
  // Security Settings
  const [screenshotProtection, setScreenshotProtection] = useState(true);
  const [screenRecordingBlocked, setScreenRecordingBlocked] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkOpacity, setWatermarkOpacity] = useState([30]);
  const [deviceLimit, setDeviceLimit] = useState(3);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  
  // Content Settings
  const [autoModeration, setAutoModeration] = useState(true);
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [imageModeration, setImageModeration] = useState(true);
  const [minAgeForDMs, setMinAgeForDMs] = useState(13);
  
  // Engagement Settings
  const [dailyBonusEnabled, setDailyBonusEnabled] = useState(true);
  const [dailyBonusAmount, setDailyBonusAmount] = useState(10);
  const [streakBonusEnabled, setStreakBonusEnabled] = useState(true);
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(true);
  const [referralBonusAmount, setReferralBonusAmount] = useState(50);

  const handleSave = () => {
    toast.success('Platform settings updated!', {
      description: 'Changes will take effect immediately.'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-accent" />
            Platform Controls
          </DialogTitle>
          <DialogDescription>
            Configure platform-wide security, content moderation, and engagement settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Engagement</span>
            </TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4 text-destructive" />
                Screenshot & Recording Protection
              </h3>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Block Screenshots</Label>
                    <p className="text-sm text-muted-foreground">
                      Prevent users from taking screenshots of course content
                    </p>
                  </div>
                  <Switch
                    checked={screenshotProtection}
                    onCheckedChange={setScreenshotProtection}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Block Screen Recording</Label>
                    <p className="text-sm text-muted-foreground">
                      Prevent screen recording of video content
                    </p>
                  </div>
                  <Switch
                    checked={screenRecordingBlocked}
                    onCheckedChange={setScreenRecordingBlocked}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">User Watermark</Label>
                      <p className="text-sm text-muted-foreground">
                        Add username watermark to content (helps track leaks)
                      </p>
                    </div>
                    <Switch
                      checked={watermarkEnabled}
                      onCheckedChange={setWatermarkEnabled}
                    />
                  </div>
                  
                  {watermarkEnabled && (
                    <div className="pl-4 border-l-2 border-accent/30">
                      <Label className="text-sm">Watermark Opacity: {watermarkOpacity}%</Label>
                      <Slider
                        value={watermarkOpacity}
                        onValueChange={setWatermarkOpacity}
                        min={10}
                        max={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-foreground flex items-center gap-2 pt-4">
                <Smartphone className="w-4 h-4 text-accent" />
                Device & Session Settings
              </h3>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label className="font-medium">Device Limit per Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum devices that can be logged in simultaneously
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={deviceLimit}
                      onChange={(e) => setDeviceLimit(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">devices</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-logout after inactivity period
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={5}
                      max={120}
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>
              </div>

              {/* Status Summary */}
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center gap-2 text-success mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Content Protection Active</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Screenshots, recordings, and unauthorized access are being blocked.
                  Watermarks identify content if leaked.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gold" />
                Content Moderation
              </h3>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">AI Auto-Moderation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically review and flag inappropriate content
                    </p>
                  </div>
                  <Switch
                    checked={autoModeration}
                    onCheckedChange={setAutoModeration}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Profanity Filter</Label>
                    <p className="text-sm text-muted-foreground">
                      Block inappropriate language in messages and posts
                    </p>
                  </div>
                  <Switch
                    checked={profanityFilter}
                    onCheckedChange={setProfanityFilter}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Image Moderation</Label>
                    <p className="text-sm text-muted-foreground">
                      Scan uploaded images for inappropriate content
                    </p>
                  </div>
                  <Switch
                    checked={imageModeration}
                    onCheckedChange={setImageModeration}
                  />
                </div>
              </div>

              <h3 className="font-semibold text-foreground flex items-center gap-2 pt-4">
                <Users className="w-4 h-4 text-accent" />
                Age Restrictions
              </h3>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label className="font-medium">Minimum Age for Direct Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Users below this age cannot send or receive DMs (only group chats with parental approval)
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={10}
                      max={18}
                      value={minAgeForDMs}
                      onChange={(e) => setMinAgeForDMs(parseInt(e.target.value) || 13)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">years old</span>
                  </div>
                </div>

                <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg">
                  <p className="text-sm text-gold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    COPPA Compliance: Users under 13 require parental consent
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Coins className="w-4 h-4 text-gold" />
                Aura Points & Rewards
              </h3>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Daily Login Bonus</Label>
                    <p className="text-sm text-muted-foreground">
                      Give aura points for daily logins
                    </p>
                  </div>
                  <Switch
                    checked={dailyBonusEnabled}
                    onCheckedChange={setDailyBonusEnabled}
                  />
                </div>

                {dailyBonusEnabled && (
                  <div className="pl-4 border-l-2 border-gold/30 space-y-2">
                    <Label className="text-sm">Daily Bonus Amount</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={dailyBonusAmount}
                        onChange={(e) => setDailyBonusAmount(parseInt(e.target.value) || 10)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">aura points</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Streak Bonuses</Label>
                    <p className="text-sm text-muted-foreground">
                      Bonus rewards for maintaining learning streaks
                    </p>
                  </div>
                  <Switch
                    checked={streakBonusEnabled}
                    onCheckedChange={setStreakBonusEnabled}
                  />
                </div>
              </div>

              <h3 className="font-semibold text-foreground flex items-center gap-2 pt-4">
                <Users className="w-4 h-4 text-success" />
                Referral Program
              </h3>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Enable Referral Rewards</Label>
                    <p className="text-sm text-muted-foreground">
                      Reward users for inviting friends
                    </p>
                  </div>
                  <Switch
                    checked={referralBonusEnabled}
                    onCheckedChange={setReferralBonusEnabled}
                  />
                </div>

                {referralBonusEnabled && (
                  <div className="pl-4 border-l-2 border-success/30 space-y-2">
                    <Label className="text-sm">Referral Bonus (per successful referral)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={10}
                        max={500}
                        value={referralBonusAmount}
                        onChange={(e) => setReferralBonusAmount(parseInt(e.target.value) || 50)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">aura points</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="p-4 bg-gold/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gold">45K</p>
                  <p className="text-xs text-muted-foreground">Points Given Today</p>
                </div>
                <div className="p-4 bg-success/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-success">1.2K</p>
                  <p className="text-xs text-muted-foreground">Referrals This Month</p>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-accent">78%</p>
                  <p className="text-xs text-muted-foreground">Streak Retention</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-accent">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformControls;
