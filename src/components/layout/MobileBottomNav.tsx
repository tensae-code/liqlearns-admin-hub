import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  Menu,
  GraduationCap,
  BarChart3,
  Shield,
  Baby,
  HeadphonesIcon,
  User,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  Mail,
  Briefcase,
  Swords,
  Globe,
  Trophy,
  ShoppingBag,
  MessageSquare,
  Calendar,
  Library,
  Percent,
  Lightbulb,
  ClipboardCheck,
  FolderTree,
  Bot,
  Wallet,
  Crown,
  Megaphone,
  Flame,
  Star,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavEntry {
  icon: LucideIcon;
  label: string;
  description: string;
  path: string;
}

// ── Role-specific configs: first 4 = bottom tabs, rest = More drawer ──
const getBottomTabs = (role: string | null): NavEntry[] => {
  switch (role) {
    case 'ceo':
      return [
        { icon: LayoutDashboard, label: 'Overview', description: 'Dashboard', path: '/ceo' },
        { icon: BarChart3, label: 'Analytics', description: 'Platform metrics', path: '/ceo/analytics' },
        { icon: Users, label: 'Team', description: 'Manage staff', path: '/ceo/team' },
        { icon: FileText, label: 'Reports', description: 'Business reports', path: '/ceo/reports' },
      ];
    case 'admin':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Admin overview', path: '/admin' },
        { icon: Users, label: 'Users', description: 'Manage accounts', path: '/admin?tab=users' },
        { icon: Library, label: 'Courses', description: 'Browse content', path: '/admin?tab=courses' },
        { icon: Shield, label: 'Moderation', description: 'Review reports', path: '/admin?tab=moderation' },
      ];
    case 'support':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Support overview', path: '/support' },
        { icon: MessageSquare, label: 'Tickets', description: 'Open requests', path: '/support/tickets' },
        { icon: Users, label: 'Users', description: 'User lookup', path: '/support/users' },
        { icon: Mail, label: 'Messages', description: 'Communications', path: '/messages' },
      ];
    case 'teacher':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Teaching overview', path: '/teacher' },
        { icon: Library, label: 'Courses', description: 'My courses', path: '/teacher?tab=courses' },
        { icon: Users, label: 'Students', description: 'View learners', path: '/teacher?tab=students' },
        { icon: BarChart3, label: 'Earnings', description: 'Revenue stats', path: '/teacher?tab=earnings' },
      ];
    case 'parent':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Family overview', path: '/parent' },
        { icon: Baby, label: 'Children', description: 'Manage kids', path: '/parent/children' },
        { icon: BarChart3, label: 'Progress', description: 'Learning stats', path: '/parent/progress' },
        { icon: Mail, label: 'Messages', description: 'Communications', path: '/messages' },
      ];
    case 'enterprise':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Enterprise overview', path: '/enterprise' },
        { icon: Users, label: 'Team', description: 'Manage members', path: '/enterprise/team' },
        { icon: Library, label: 'Courses', description: 'Training content', path: '/courses' },
        { icon: BarChart3, label: 'Analytics', description: 'Reports & insights', path: '/enterprise/analytics' },
      ];
    default: // student
      return [
        { icon: LayoutDashboard, label: 'Home', description: 'Your overview', path: '/dashboard' },
        { icon: BookOpen, label: 'Courses', description: 'Browse & learn', path: '/courses' },
        { icon: Mail, label: 'Messages', description: 'Chat', path: '/messages' },
        { icon: Swords, label: 'Battles', description: 'Challenge others', path: '/battles' },
      ];
  }
};

// Items that go in the "More" drawer – mirrors remaining desktop sidebar items per role
const getMoreItems = (role: string | null): NavEntry[] => {
  switch (role) {
    case 'ceo':
      return [
        { icon: Megaphone, label: 'Announcements', description: 'Platform updates', path: '/ceo?tab=announcements' },
        { icon: Crown, label: 'Subscriptions', description: 'User plans', path: '/ceo?tab=subscriptions' },
        { icon: Percent, label: 'Commissions', description: 'Group rates', path: '/ceo?tab=commissions' },
        { icon: Lightbulb, label: 'Skills', description: 'Skill approvals', path: '/ceo?tab=skills' },
        { icon: Shield, label: 'Controls', description: 'Platform controls', path: '/ceo?tab=controls' },
        { icon: FolderTree, label: 'Categories', description: 'Course categories', path: '/ceo?tab=categories' },
        { icon: Bot, label: 'AI Management', description: 'Configure AI', path: '/ceo/ai' },
        { icon: UserCheck, label: 'User Control', description: 'Manage users', path: '/ceo/users' },
        { icon: Wallet, label: 'Finance', description: 'Revenue & expenses', path: '/ceo/finance' },
        { icon: Mail, label: 'Messages', description: 'Team chat', path: '/messages' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'admin':
      return [
        { icon: ClipboardCheck, label: 'Approvals', description: 'Pending content', path: '/admin?tab=approvals' },
        { icon: Lightbulb, label: 'Skills', description: 'Skill suggestions', path: '/admin?tab=skills' },
        { icon: BarChart3, label: 'Reports', description: 'System reports', path: '/admin?tab=reports' },
        { icon: Mail, label: 'Messages', description: 'Communications', path: '/messages' },
        { icon: HelpCircle, label: 'Help', description: 'Get support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'support':
      return [
        { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community' },
        { icon: Swords, label: 'Battles', description: 'Challenge others', path: '/battles' },
        { icon: Shield, label: 'Clans', description: 'Join a team', path: '/clans' },
        { icon: Globe, label: 'World Map', description: 'See friends globally', path: '/map' },
        { icon: HelpCircle, label: 'Help', description: 'Resources', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'teacher':
      return [
        { icon: FileText, label: 'Assignments', description: 'Grade & review', path: '/teacher?tab=assignments' },
        { icon: Briefcase, label: 'Business', description: 'Earn rewards', path: '/business' },
        { icon: Swords, label: 'Battles', description: 'Clan wars', path: '/battles' },
        { icon: Shield, label: 'Clans', description: 'Manage clans', path: '/clans' },
        { icon: Globe, label: 'World Map', description: 'See friends globally', path: '/map' },
        { icon: Calendar, label: 'Events', description: 'Scheduled events', path: '/events' },
        { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community' },
        { icon: Mail, label: 'Messages', description: 'Student chat', path: '/messages' },
        { icon: HelpCircle, label: 'Help', description: 'Get support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'parent':
      return [
        { icon: Briefcase, label: 'Business', description: 'Earn rewards', path: '/business' },
        { icon: Swords, label: 'Battles', description: 'Challenge others', path: '/battles' },
        { icon: Shield, label: 'Clans', description: 'Join a team', path: '/clans' },
        { icon: Globe, label: 'World Map', description: 'See friends globally', path: '/map' },
        { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community' },
        { icon: HelpCircle, label: 'Help', description: 'Get support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'enterprise':
      return [
        { icon: GraduationCap, label: 'Learning Paths', description: 'Training programs', path: '/enterprise/paths' },
        { icon: Swords, label: 'Battles', description: 'Clan wars', path: '/battles' },
        { icon: Shield, label: 'Clans', description: 'Manage clans', path: '/clans' },
        { icon: Globe, label: 'World Map', description: 'See friends globally', path: '/map' },
        { icon: Briefcase, label: 'Business', description: 'Earn rewards', path: '/business' },
        { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community' },
        { icon: Mail, label: 'Messages', description: 'Team chat', path: '/messages' },
        { icon: HelpCircle, label: 'Help', description: 'Get support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    default: // student
      return [
        { icon: User, label: 'Profile', description: 'View and edit your profile', path: '/profile' },
        { icon: Briefcase, label: 'Business', description: 'Earn rewards & referrals', path: '/business' },
        { icon: Trophy, label: 'Skills', description: 'Skill tree & levels', path: '/skills' },
        { icon: GraduationCap, label: 'Quest', description: 'Daily challenges', path: '/quest' },
        { icon: Users, label: 'Study Rooms', description: 'Learn together', path: '/study-rooms' },
        { icon: Calendar, label: 'Events', description: 'Upcoming events', path: '/events' },
        { icon: ShoppingBag, label: 'Marketplace', description: 'Spend rewards', path: '/marketplace' },
        { icon: Shield, label: 'Clans', description: 'Join a team', path: '/clans' },
        { icon: Globe, label: 'World Map', description: 'See friends globally', path: '/map' },
        { icon: MessageSquare, label: 'Community', description: 'Discussions & posts', path: '/community' },
        { icon: HelpCircle, label: 'Help & Support', description: 'FAQs and contact support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'App preferences & security', path: '/settings' },
      ];
  }
};

// Color accent per role for the drawer items
const getRoleAccentColor = (role: string | null) => {
  switch (role) {
    case 'ceo': return 'text-gold';
    case 'admin': return 'text-destructive';
    case 'support': return 'text-primary';
    case 'teacher': return 'text-accent';
    case 'parent': return 'text-success';
    case 'enterprise': return 'text-blue-500';
    default: return 'text-accent';
  }
};

const MobileBottomNav = () => {
  const location = useLocation();
  const { userRole, signOut, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const bottomTabs = getBottomTabs(userRole);
  const moreItems = getMoreItems(userRole);

  const isItemActive = (itemPath: string) => {
    if (itemPath.includes('?')) {
      const [basePath, query] = itemPath.split('?');
      const params = new URLSearchParams(query);
      const tabValue = params.get('tab');
      const currentParams = new URLSearchParams(location.search);
      return location.pathname === basePath && currentParams.get('tab') === tabValue;
    }
    // Exact match for dashboard roots
    return location.pathname === itemPath;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/25 backdrop-blur-lg border-t border-white/10 dark:border-white/5 shadow-[0_-4px_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-1 py-1.5 pb-safe">
        {bottomTabs.map((item) => {
          const isActive = isItemActive(item.path);
          return (
            <Link
              key={item.path + item.label}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[56px]',
                isActive ? 'bg-accent/10' : 'hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'w-6 h-6 flex items-center justify-center rounded-lg transition-all',
                isActive && 'bg-accent text-accent-foreground'
              )}>
                <item.icon className={cn('w-4 h-4', isActive ? 'text-accent-foreground' : 'text-muted-foreground')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
                isActive ? 'text-accent' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-muted-foreground min-w-[56px] hover:bg-muted/50 transition-all">
              <div className="w-6 h-6 flex items-center justify-center">
                <Menu className="w-4 h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
              </div>
              <span className="text-[10px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">More</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh] flex flex-col">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-left">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-gold/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-gold flex items-center justify-center text-white font-bold text-lg">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-base">{user?.email?.split('@')[0] || 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole || 'Student'} Account</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-1 overflow-y-auto flex-1">
              {/* Profile link for non-student roles (student already has it in moreItems) */}
              {userRole && userRole !== 'student' && (
                <Link
                  to="/profile"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  onClick={() => setDrawerOpen(false)}
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">Profile</span>
                    <p className="text-xs text-muted-foreground">View and edit your profile</p>
                  </div>
                </Link>
              )}

              {/* Role-specific more items */}
              {moreItems.map((item) => (
                <Link
                  key={item.path + item.label}
                  to={item.path}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  onClick={() => setDrawerOpen(false)}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <item.icon className={cn('w-5 h-5', getRoleAccentColor(userRole))} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              ))}

              {/* Sign Out */}
              <div className="pt-3 mt-2 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-12 rounded-xl"
                  onClick={() => {
                    signOut();
                    setDrawerOpen(false);
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mr-3">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">Sign Out</span>
                    <p className="text-xs opacity-70">Log out of your account</p>
                  </div>
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
