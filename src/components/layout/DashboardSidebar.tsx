import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  path: string;
  roles?: string[];
}

// Role-specific navigation configurations
const getNavItemsForRole = (role: string | null): NavItem[] => {
  switch (role) {
    case 'ceo':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/ceo' },
        { icon: BarChart3, label: 'Analytics', path: '/ceo/analytics' },
        { icon: Users, label: 'Team', path: '/ceo/team' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: FileText, label: 'Reports', path: '/ceo/reports' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    case 'admin':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: Shield, label: 'Moderation', path: '/admin/moderation' },
        { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    case 'support':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/support' },
        { icon: MessageSquare, label: 'Tickets', path: '/support/tickets' },
        { icon: Users, label: 'Users', path: '/support/users' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    case 'teacher':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
        { icon: Library, label: 'My Courses', path: '/teacher/courses' },
        { icon: Users, label: 'Students', path: '/teacher/students' },
        { icon: BarChart3, label: 'Earnings', path: '/teacher/earnings' },
        { icon: Calendar, label: 'Events', path: '/events' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: MessageSquare, label: 'Community', path: '/community' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    case 'parent':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/parent' },
        { icon: Baby, label: 'My Children', path: '/parent/children' },
        { icon: BarChart3, label: 'Progress', path: '/parent/progress' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    default: // student
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: GraduationCap, label: 'Quest', path: '/quest' },
        { icon: Users, label: 'Study Rooms', path: '/study-rooms' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: Calendar, label: 'Events', path: '/events' },
        { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
        { icon: MessageSquare, label: 'Community', path: '/community' },
        { icon: Briefcase, label: 'Business', path: '/business' },
        { icon: Trophy, label: 'Profile', path: '/profile' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
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
  const [collapsed, setCollapsedState] = useState(false);
  
  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    onCollapseChange?.(value);
  };
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

  const getNavItemColors = (isActive: boolean) => {
    if (isActive) {
      return 'bg-orange-500 text-white font-semibold shadow-sm';
    }
    return 'text-orange-800 hover:bg-orange-400/30 hover:text-orange-900';
  };

  const NavItemComponent = ({ item, index }: { item: NavItem; index: number }) => {
    const isActive = isItemActive(item.path);
    
    const linkContent = (
      <Link
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
          getNavItemColors(isActive),
          collapsed && 'justify-center px-2'
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
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
        collapsed ? 'w-16' : 'w-64',
        getSidebarGradient(),
        className
      )}
    >
      {/* Collapse Button at Top */}
      <div className={cn('p-2 flex', collapsed ? 'justify-center' : 'justify-end')}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-700 hover:text-orange-900 hover:bg-orange-400/30"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? 'Expand' : 'Collapse'}</TooltipContent>
        </Tooltip>
      </div>

      {/* Logo with Hub Name */}
      <div className={cn('px-3 pb-3 border-b border-orange-400/30', collapsed && 'flex justify-center')}>
        <Link 
          to="/dashboard"
          className="flex items-center gap-3"
        >
          <div className={cn(
            'rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0',
            collapsed ? 'w-10 h-10' : 'w-10 h-10'
          )}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className={cn('text-xl font-display font-bold', getSidebarTextColor())}>LiqLearns</span>
              <p className="text-xs text-orange-600">{getRoleHubName(userRole)}</p>
            </div>
          )}
        </Link>
      </div>

      {/* User Stats - Collapsed shows avatar only */}
      <div className={cn('border-b border-orange-400/30', collapsed ? 'p-2' : 'p-4')}>
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-400 text-white font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div>
                <p className="font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-400 text-white font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className={cn('font-medium truncate', getSidebarTextColor())}>{user?.email?.split('@')[0] || 'User'}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-700">
                  {getRoleLabel()}
                </span>
              </div>
            </div>
            {(userRole === 'student' || !userRole) && (
              <SidebarRankCard />
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto', collapsed ? 'p-2' : 'p-3')}>
        <ul className="space-y-1">
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
