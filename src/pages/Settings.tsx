import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAppearance } from '@/hooks/useAppearance';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Palette,
  LogOut,
  Camera,
  Save,
  ChevronRight,
  Loader2,
  Upload,
  Trash2
} from 'lucide-react';

const settingSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const Settings = () => {
  const { user, signOut } = useAuth();
  const { profile, refetch } = useProfile();
  const { darkMode, reduceAnimations, compactView, toggleDarkMode, toggleReduceAnimations, toggleCompactView } = useAppearance();
  const [activeSection, setActiveSection] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    bio: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    streakReminder: true,
    newContent: false,
    community: true,
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Avatar updated successfully!');
      refetch();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    setUploading(true);

    try {
      // Delete from storage
      const oldPath = profile.avatar_url.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Avatar removed');
      refetch();
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const updates: any = {};
      if (formData.fullName) updates.full_name = formData.fullName;
      if (formData.username) updates.username = formData.username;
      if (formData.phone) updates.phone = formData.phone;
      if (formData.bio) updates.bio = formData.bio;

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <nav className="space-y-1">
            {settingSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span>{section.label}</span>
                <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${
                  activeSection === section.id ? 'rotate-90' : ''
                }`} />
              </button>
            ))}
          </nav>

          <Separator className="my-4" />

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </motion.div>

        {/* Content */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeSection === 'profile' && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Profile Settings</h2>
              
              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-border">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Avatar" />}
                    <AvatarFallback className="bg-gradient-hero text-primary-foreground text-2xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    {profile?.avatar_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRemoveAvatar}
                        disabled={uploading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported: JPEG, PNG, WebP, GIF (max 5MB)
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="Enter your full name" 
                    defaultValue={profile?.full_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Enter your username" 
                    defaultValue={profile?.username || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    placeholder="Enter your phone number" 
                    defaultValue={profile?.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input 
                    id="bio" 
                    placeholder="Tell us about yourself" 
                    defaultValue={profile?.bio || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  onClick={handleSaveProfile}
                  className="bg-gradient-accent text-accent-foreground hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                {[
                  { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
                  { key: 'push', label: 'Push Notifications', description: 'Receive notifications on your device' },
                  { key: 'streakReminder', label: 'Streak Reminders', description: 'Get reminded to maintain your streak' },
                  { key: 'newContent', label: 'New Content Alerts', description: 'Be notified when new courses are added' },
                  { key: 'community', label: 'Community Updates', description: 'Get updates from community posts' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Privacy & Security</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-foreground mb-4">Password</h3>
                  <Button variant="outline">Change Password</Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Profile Visibility</h3>
                    <p className="text-sm text-muted-foreground">Make your profile visible to others</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Show on Leaderboard</h3>
                    <p className="text-sm text-muted-foreground">Display your rank on public leaderboards</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'subscription' && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Subscription</h2>
              
              <div className="p-4 rounded-lg bg-gradient-accent text-accent-foreground mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Current Plan</p>
                    <h3 className="text-2xl font-display font-bold">Free Trial</h3>
                  </div>
                  <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
                    Upgrade
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Upgrade to unlock premium features including unlimited courses, offline access, and more.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline">View Plans</Button>
                  <Button variant="ghost">Manage Billing</Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'language' && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Language Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Interface Language</Label>
                  <select className="w-full p-2 rounded-lg border border-border bg-background text-foreground">
                    <option>English</option>
                    <option>አማርኛ (Amharic)</option>
                  </select>
                </div>
                
                <div>
                  <Label className="mb-2 block">Learning Language</Label>
                  <select className="w-full p-2 rounded-lg border border-border bg-background text-foreground">
                    <option>አማርኛ (Amharic)</option>
                    <option>ትግርኛ (Tigrinya)</option>
                    <option>ኦሮምኛ (Oromo)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">Appearance</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Dark Mode</h3>
                    <p className="text-sm text-muted-foreground">Switch to dark theme</p>
                  </div>
                  <Switch 
                    checked={darkMode}
                    onCheckedChange={toggleDarkMode}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Reduce Animations</h3>
                    <p className="text-sm text-muted-foreground">Minimize motion effects</p>
                  </div>
                  <Switch 
                    checked={reduceAnimations}
                    onCheckedChange={toggleReduceAnimations}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Compact View</h3>
                    <p className="text-sm text-muted-foreground">Show more content with less spacing</p>
                  </div>
                  <Switch 
                    checked={compactView}
                    onCheckedChange={toggleCompactView}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
