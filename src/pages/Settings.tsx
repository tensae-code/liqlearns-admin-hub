import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  ChevronRight
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
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    streakReminder: true,
    newContent: false,
    community: true,
  });

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
              
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-gradient-accent text-accent-foreground text-2xl">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{user?.email?.split('@')[0] || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Photo
                  </Button>
                </div>
              </div>

              {/* Form */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Enter your full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="Enter your username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="Enter your phone number" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" placeholder="Tell us about yourself" />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90">
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
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Reduce Animations</h3>
                    <p className="text-sm text-muted-foreground">Minimize motion effects</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Compact View</h3>
                    <p className="text-sm text-muted-foreground">Show more content with less spacing</p>
                  </div>
                  <Switch />
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
