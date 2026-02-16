import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Library, Users, Calendar, ShoppingBag, MessageSquare,
  HelpCircle, Settings, GraduationCap, Briefcase, Shield, Baby, BarChart3,
  Percent, FileText, UserCheck, Mail, Trophy, Lightbulb, ClipboardCheck,
  FolderTree, Bot, Wallet, Crown, Swords, Megaphone, Globe, BookOpen,
  Flame, Star, HeadphonesIcon,
  type LucideIcon,
} from 'lucide-react';

interface SearchItem {
  icon: LucideIcon;
  label: string;
  description: string;
  path: string;
  group: string;
  keywords?: string[];
}

const getAllSearchItems = (role: string | null): SearchItem[] => {
  const common: SearchItem[] = [
    { icon: Settings, label: 'Settings', description: 'Account preferences', path: '/settings', group: 'General', keywords: ['account', 'preferences', 'theme', 'appearance', 'password', 'notifications'] },
    { icon: Mail, label: 'Messages', description: 'Chat & conversations', path: '/messages', group: 'General', keywords: ['chat', 'dm', 'inbox', 'conversations'] },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance', path: '/help', group: 'General', keywords: ['faq', 'support', 'contact'] },
    { icon: Globe, label: 'World Map', description: 'See friends globally', path: '/map', group: 'Social', keywords: ['globe', 'location', 'friends'] },
    { icon: Swords, label: 'Battles', description: 'Challenge others', path: '/battles', group: 'Social', keywords: ['fight', 'challenge', 'pvp', 'compete'] },
    { icon: Shield, label: 'Clans', description: 'Join a team', path: '/clans', group: 'Social', keywords: ['team', 'group', 'guild'] },
  ];

  const roleItems: Record<string, SearchItem[]> = {
    student: [
      { icon: LayoutDashboard, label: 'Dashboard', description: 'Your overview', path: '/dashboard', group: 'Navigation', keywords: ['home', 'overview'] },
      { icon: Library, label: 'Courses', description: 'Browse & learn', path: '/courses', group: 'Learning', keywords: ['classes', 'lessons', 'education'] },
      { icon: Trophy, label: 'Skills', description: 'Skill tree', path: '/skills', group: 'Learning', keywords: ['abilities', 'progress'] },
      { icon: GraduationCap, label: 'Quest', description: 'Daily challenges', path: '/quest', group: 'Learning', keywords: ['daily', 'challenge', 'mission'] },
      { icon: Users, label: 'Study Rooms', description: 'Learn together', path: '/study-rooms', group: 'Social', keywords: ['collaborate', 'group study'] },
      { icon: Calendar, label: 'Events', description: 'Upcoming events', path: '/events', group: 'General', keywords: ['schedule', 'calendar'] },
      { icon: ShoppingBag, label: 'Marketplace', description: 'Spend rewards', path: '/marketplace', group: 'General', keywords: ['shop', 'store', 'buy'] },
      { icon: Briefcase, label: 'Business', description: 'Earn rewards', path: '/business', group: 'General', keywords: ['referral', 'earn', 'money'] },
      { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community', group: 'Social', keywords: ['forum', 'posts', 'social'] },
    ],
    ceo: [
      { icon: LayoutDashboard, label: 'CEO Dashboard', description: 'Overview & insights', path: '/ceo', group: 'Navigation', keywords: ['home', 'overview'] },
      { icon: Megaphone, label: 'Announcements', description: 'Platform updates', path: '/ceo?tab=announcements', group: 'Management', keywords: ['news', 'broadcast'] },
      { icon: Crown, label: 'Subscriptions', description: 'User plans', path: '/ceo?tab=subscriptions', group: 'Management', keywords: ['plans', 'billing'] },
      { icon: Percent, label: 'Commissions', description: 'Group rates', path: '/ceo?tab=commissions', group: 'Finance', keywords: ['rates', 'earnings'] },
      { icon: Lightbulb, label: 'Skills', description: 'Skill approvals', path: '/ceo?tab=skills', group: 'Management', keywords: ['approve', 'abilities'] },
      { icon: Shield, label: 'Platform Controls', description: 'Platform settings', path: '/ceo?tab=controls', group: 'Management', keywords: ['admin', 'control'] },
      { icon: FolderTree, label: 'Categories', description: 'Course categories', path: '/ceo?tab=categories', group: 'Management', keywords: ['organize', 'taxonomy'] },
      { icon: BarChart3, label: 'Analytics', description: 'Platform metrics', path: '/ceo/analytics', group: 'Reports', keywords: ['data', 'metrics', 'stats'] },
      { icon: Users, label: 'Team', description: 'Manage staff', path: '/ceo/team', group: 'Management', keywords: ['staff', 'employees'] },
      { icon: FileText, label: 'Reports', description: 'Business reports', path: '/ceo/reports', group: 'Reports', keywords: ['documents', 'summary'] },
      { icon: Bot, label: 'AI Management', description: 'Configure AI', path: '/ceo/ai', group: 'Management', keywords: ['artificial intelligence', 'bot'] },
      { icon: UserCheck, label: 'User Control', description: 'Manage users', path: '/ceo/users', group: 'Management', keywords: ['accounts', 'members'] },
      { icon: Wallet, label: 'Finance', description: 'Revenue & expenses', path: '/ceo/finance', group: 'Finance', keywords: ['money', 'revenue', 'budget'] },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Admin Dashboard', description: 'Admin overview', path: '/admin', group: 'Navigation', keywords: ['home', 'overview'] },
      { icon: Users, label: 'Users', description: 'Manage accounts', path: '/admin?tab=users', group: 'Management', keywords: ['accounts', 'members'] },
      { icon: Library, label: 'Courses', description: 'Browse content', path: '/admin?tab=courses', group: 'Management', keywords: ['classes', 'content'] },
      { icon: ClipboardCheck, label: 'Approvals', description: 'Pending content', path: '/admin?tab=approvals', group: 'Management', keywords: ['review', 'pending'] },
      { icon: Lightbulb, label: 'Skills', description: 'Skill suggestions', path: '/admin?tab=skills', group: 'Management', keywords: ['abilities'] },
      { icon: Shield, label: 'Moderation', description: 'Review reports', path: '/admin?tab=moderation', group: 'Management', keywords: ['reports', 'flagged'] },
      { icon: BarChart3, label: 'Reports', description: 'System reports', path: '/admin?tab=reports', group: 'Reports', keywords: ['analytics', 'data'] },
    ],
    teacher: [
      { icon: LayoutDashboard, label: 'Teacher Dashboard', description: 'Teaching overview', path: '/teacher', group: 'Navigation', keywords: ['home', 'overview'] },
      { icon: Library, label: 'My Courses', description: 'Manage content', path: '/teacher?tab=courses', group: 'Teaching', keywords: ['classes', 'content'] },
      { icon: FileText, label: 'Assignments', description: 'Grade & review', path: '/teacher?tab=assignments', group: 'Teaching', keywords: ['homework', 'grading'] },
      { icon: Users, label: 'Students', description: 'View learners', path: '/teacher?tab=students', group: 'Teaching', keywords: ['learners', 'class'] },
      { icon: BarChart3, label: 'Earnings', description: 'Revenue stats', path: '/teacher?tab=earnings', group: 'Finance', keywords: ['income', 'money'] },
      { icon: Briefcase, label: 'Business', description: 'Earn rewards', path: '/business', group: 'General', keywords: ['referral'] },
      { icon: Calendar, label: 'Events', description: 'Scheduled events', path: '/events', group: 'General', keywords: ['schedule', 'calendar'] },
      { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community', group: 'Social', keywords: ['forum', 'posts'] },
    ],
    parent: [
      { icon: LayoutDashboard, label: 'Parent Dashboard', description: 'Family overview', path: '/parent', group: 'Navigation', keywords: ['home', 'overview'] },
      { icon: Baby, label: 'My Children', description: 'Manage kids', path: '/parent/children', group: 'Family', keywords: ['kids', 'child'] },
      { icon: BarChart3, label: 'Progress', description: 'Learning stats', path: '/parent/progress', group: 'Family', keywords: ['grades', 'performance'] },
      { icon: Briefcase, label: 'Business', description: 'Earn rewards', path: '/business', group: 'General', keywords: ['referral'] },
      { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community', group: 'Social', keywords: ['forum', 'posts'] },
    ],
    enterprise: [
      { icon: LayoutDashboard, label: 'Enterprise Dashboard', description: 'Enterprise overview', path: '/enterprise', group: 'Navigation', keywords: ['home', 'overview'] },
      { icon: Users, label: 'Team', description: 'Manage members', path: '/enterprise/team', group: 'Management', keywords: ['staff', 'employees'] },
      { icon: Library, label: 'Courses', description: 'Training content', path: '/courses', group: 'Learning', keywords: ['classes', 'training'] },
      { icon: GraduationCap, label: 'Learning Paths', description: 'Training programs', path: '/enterprise/paths', group: 'Learning', keywords: ['programs', 'curriculum'] },
      { icon: BarChart3, label: 'Analytics', description: 'Reports & insights', path: '/enterprise/analytics', group: 'Reports', keywords: ['data', 'metrics'] },
      { icon: Briefcase, label: 'Business', description: 'Earn rewards', path: '/business', group: 'General', keywords: ['referral'] },
      { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community', group: 'Social', keywords: ['forum', 'posts'] },
    ],
    support: [
      { icon: LayoutDashboard, label: 'Support Dashboard', description: 'Support overview', path: '/support', group: 'Navigation', keywords: ['home', 'overview'] },
      { icon: HeadphonesIcon, label: 'Tickets', description: 'Open requests', path: '/support/tickets', group: 'Support', keywords: ['requests', 'issues'] },
      { icon: Users, label: 'Users', description: 'User lookup', path: '/support/users', group: 'Support', keywords: ['accounts', 'members'] },
      { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community', group: 'Social', keywords: ['forum', 'posts'] },
    ],
  };

  return [...(roleItems[role || 'student'] || roleItems.student), ...common];
};

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [search, setSearch] = useState('');

  const items = useMemo(() => getAllSearchItems(userRole), [userRole]);

  // Group items
  const grouped = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    items.forEach(item => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, [items]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages, settings, features..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(grouped).map(([group, groupItems], idx) => (
          <CommandGroup key={group} heading={group}>
            {groupItems.map(item => (
              <CommandItem
                key={item.path}
                value={`${item.label} ${item.description} ${item.keywords?.join(' ') || ''}`}
                onSelect={() => handleSelect(item.path)}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearchDialog;
