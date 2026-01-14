import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppearance } from '@/hooks/useAppearance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  ShoppingBag,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Star,
  Briefcase,
  Library,
  Shield,
  Baby,
  BarChart3,
  FileText,
  UserCheck,
  Mail,
  Trophy,
  Flame
} from 'lucide-react';
import SidebarRankCard from '@/components/dashboard/SidebarRankCard';

interface SidebarProps {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  description: string;
  path: string;
  roles?: string[];
}

// Role-specific navigation configurations
const getNavItemsForRole = (role: string | null): NavItem[] => {
  switch (role) {
    case 'ceo':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & insights', path: '/ceo' },
        { icon: BarChart3, label: 'Analytics', description: 'Platform metrics', path: '/ceo/analytics' },
        { icon: Users, label: 'Team', description: 'Manage staff', path: '/ceo/team' },
        { icon: Library, label: 'Courses', description: 'Browse content', path: '/courses' },
        { icon: FileText, label: 'Reports', description: 'Business reports', path: '/ceo/reports' },
        { icon: Mail, label: 'Messages', description: 'Team chat', path: '/messages' },
        { icon: HelpCircle, label: 'Help', description: 'Get support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'admin':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Admin overview', path: '/admin' },
        { icon: Users, label: 'Users', description: 'Manage accounts', path: '/admin/users' },
        { icon: Library, label: 'Courses', description: 'Browse content', path: '/courses' },
        { icon: Shield, label: 'Moderation', description: 'Review reports', path: '/admin/moderation' },
        { icon: BarChart3, label: 'Reports', description: 'System reports', path: '/admin/reports' },
        { icon: Mail, label: 'Messages', description: 'Communications', path: '/messages' },
        { icon: HelpCircle, label: 'Help', description: 'Get support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'support':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Support overview', path: '/support' },
        { icon: MessageSquare, label: 'Tickets', description: 'Open requests', path: '/support/tickets' },
        { icon: Users, label: 'Users', description: 'User lookup', path: '/support/users' },
        { icon: Mail, label: 'Messages', description: 'Communications', path: '/messages' },
        { icon: HelpCircle, label: 'Help', description: 'Resources', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'teacher':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Teaching overview', path: '/teacher' },
        { icon: Library, label: 'My Courses', description: 'Manage content', path: '/teacher/courses' },
        { icon: Users, label: 'Students', description: 'View learners', path: '/teacher/students' },
        { icon: BarChart3, label: 'Earnings', description: 'Revenue stats', path: '/teacher/earnings' },
        { icon: Calendar, label: 'Events', description: 'Scheduled events', path: '/events' },
        { icon: Mail, label: 'Messages', description: 'Student chat', path: '/messages' },
        { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community' },
        { icon: HelpCircle, label: 'Help', description: 'Get support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    case 'parent':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Family overview', path: '/parent' },
        { icon: Baby, label: 'My Children', description: 'Manage kids', path: '/parent/children' },
        { icon: BarChart3, label: 'Progress', description: 'Learning stats', path: '/parent/progress' },
        { icon: Mail, label: 'Messages', description: 'Communications', path: '/messages' },
        { icon: HelpCircle, label: 'Help', description: 'Get support', path: '/help' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
    default: // student - max 10 items
      return [
        { icon: LayoutDashboard, label: 'Dashboard', description: 'Your overview', path: '/dashboard' },
        { icon: Briefcase, label: 'Business', description: 'Referrals & earnings', path: '/business' },
        { icon: Library, label: 'Courses', description: 'Browse & learn', path: '/courses' },
        { icon: GraduationCap, label: 'Quest', description: 'Daily challenges', path: '/quest' },
        { icon: Users, label: 'Study Rooms', description: 'Learn together', path: '/study-rooms' },
        { icon: Mail, label: 'Messages', description: 'Chat with friends', path: '/messages' },
        { icon: Calendar, label: 'Events', description: 'Upcoming events', path: '/events' },
        { icon: ShoppingBag, label: 'Marketplace', description: 'Spend rewards', path: '/marketplace' },
        { icon: MessageSquare, label: 'Community', description: 'Discussions', path: '/community' },
        { icon: Settings, label: 'Settings', description: 'Preferences', path: '/settings' },
      ];
  }
};

// Role hub names
const getRoleHubName = (role: string | null): string => {
  switch (role) {
    case 'ceo': return 'CEO Hub';
    case 'admin': return 'Admin Hub';
    case 'support': return 'Support Hub';
    case 'teacher': return 'Teacher Hub';
    case 'parent': return 'Parent Hub';
    default: return 'Learning Hub';
  }
};

const DashboardSidebar = ({ className, onCollapseChange }: SidebarProps) => {
  const { sidebarCollapsed, toggleSidebarCollapsed } = useAppearance();
  
  // Sync with parent on mount and when setting changes
  useEffect(() => {
    onCollapseChange?.(sidebarCollapsed);
  }, [sidebarCollapsed, onCollapseChange]);
  
  const setCollapsed = (value: boolean) => {
    toggleSidebarCollapsed(value);
  };
  
  const collapsed = sidebarCollapsed;
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, userRole } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get nav items for user role
  const navItems = getNavItemsForRole(userRole);

  const getRoleLabel = () => {
    switch (userRole) {
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      case 'admin': return 'Admin';
      case 'ceo': return 'CEO';
      case 'support': return 'Support';
      default: return 'Student';
    }
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'teacher': return 'bg-accent/10 text-accent';
      case 'parent': return 'bg-success/10 text-success';
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'ceo': return 'bg-gold/10 text-gold';
      case 'support': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Check if current path matches exactly (prevent multiple highlights)
  const isItemActive = (itemPath: string) => {
    // Exact match only to prevent multiple highlights
    return location.pathname === itemPath;
  };

  // iOS glassmorphism effect for nav items
  const getNavItemColors = (isActive: boolean) => {
    if (isActive) {
      return 'bg-white/70 backdrop-blur-md text-orange-600 font-semibold shadow-lg border border-white/50';
    }
    return 'bg-white/30 backdrop-blur-sm text-orange-800 hover:bg-white/50 hover:text-orange-900 border border-white/20';
  };

  const NavItemComponent = ({ item, index }: { item: NavItem; index: number }) => {
    const isActive = isItemActive(item.path);
    
    const handleNavClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };
    
    const linkContent = (
      <Link
        to={item.path}
        onClick={handleNavClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full',
          getNavItemColors(isActive),
          collapsed && 'justify-center px-2'
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium leading-tight">{item.label}</span>
            <span className="text-[10px] text-orange-600/70 leading-tight truncate">{item.description}</span>
          </div>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <div>
              <div>{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  // Lighter orange gradient with darker text
  const getSidebarGradient = () => {
    return 'bg-gradient-to-b from-orange-300 via-amber-200 to-orange-300';
  };

  const getSidebarTextColor = () => {
    return 'text-orange-900';
  };

  const getSidebarMutedColor = () => {
    return 'text-orange-700';
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-orange-300/50 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-56',
        getSidebarGradient(),
        className
      )}
    >
      {/* Logo with Collapse Button */}
      <div className="px-3 py-3 border-b border-orange-400/30">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          <Link 
            to="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 w-10 h-10">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className={cn('text-xl font-display font-bold', getSidebarTextColor())}>LiqLearns</span>
            )}
          </Link>
          
          {/* Collapse Button next to logo text */}
          {!collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-orange-700 hover:text-orange-900 hover:bg-white/40 backdrop-blur-sm rounded-lg"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse</TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {/* Expand button when collapsed - below logo */}
        {collapsed && (
          <div className="mt-2 flex justify-center">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-orange-700 hover:text-orange-900 hover:bg-white/40 backdrop-blur-sm rounded-lg"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto', collapsed ? 'p-2' : 'p-3')}>
        <ul className="space-y-2">
          {navItems.map((item, index) => (
            <li key={`${item.path}-${index}`}>
              <NavItemComponent item={item} index={index} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Sign Out Only */}
      <div className={cn('border-t border-orange-400/30', collapsed ? 'p-2' : 'p-3')}>
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-500/20"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign Out</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-500/20"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Sign Out</span>
          </Button>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
