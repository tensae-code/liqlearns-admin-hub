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
  Trophy,
  Flame,
  Star,
  Briefcase,
  Library,
  Shield,
  Baby,
  BarChart3,
  FileText,
  UserCheck
} from 'lucide-react';

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
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    case 'admin':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: Shield, label: 'Moderation', path: '/admin' },
        { icon: BarChart3, label: 'Reports', path: '/admin' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    case 'support':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/support' },
        { icon: MessageSquare, label: 'Tickets', path: '/support' },
        { icon: Users, label: 'Users', path: '/support' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    case 'teacher':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
        { icon: Library, label: 'My Courses', path: '/teacher' },
        { icon: Users, label: 'Students', path: '/teacher' },
        { icon: BarChart3, label: 'Earnings', path: '/teacher' },
        { icon: Calendar, label: 'Events', path: '/events' },
        { icon: MessageSquare, label: 'Community', path: '/community' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    case 'parent':
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/parent' },
        { icon: Baby, label: 'My Children', path: '/parent' },
        { icon: BarChart3, label: 'Progress', path: '/parent' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
    default: // student
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: GraduationCap, label: 'Quest', path: '/quest' },
        { icon: Users, label: 'Study Rooms', path: '/study-rooms' },
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
    const isSpecialRole = userRole && userRole !== 'student';
    if (isActive) {
      if (isSpecialRole) {
        return 'bg-white/20 text-white font-medium';
      }
      // For student role, use accent colors that work in both light and dark
      return 'bg-accent text-accent-foreground font-medium';
    }
    if (isSpecialRole) {
      return 'text-white/70 hover:bg-white/10 hover:text-white';
    }
    return 'text-muted-foreground hover:bg-muted hover:text-foreground';
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

  // Get sidebar gradient based on role
  const getSidebarGradient = () => {
    switch (userRole) {
      case 'ceo': return 'bg-gradient-to-b from-amber-950/90 via-amber-900/80 to-amber-950/90';
      case 'admin': return 'bg-gradient-to-b from-red-950/90 via-red-900/80 to-red-950/90';
      case 'support': return 'bg-gradient-to-b from-blue-950/90 via-blue-900/80 to-blue-950/90';
      case 'teacher': return 'bg-gradient-to-b from-purple-950/90 via-purple-900/80 to-purple-950/90';
      case 'parent': return 'bg-gradient-to-b from-green-950/90 via-green-900/80 to-green-950/90';
      default: return 'bg-card';
    }
  };

  const getSidebarTextColor = () => {
    return userRole && userRole !== 'student' ? 'text-white/90' : 'text-foreground';
  };

  const getSidebarMutedColor = () => {
    return userRole && userRole !== 'student' ? 'text-white/60' : 'text-muted-foreground';
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
        getSidebarGradient(),
        className
      )}
    >
      {/* Logo */}
      <div className={cn('p-3 border-b border-white/10', collapsed && 'flex justify-center')}>
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-3"
        >
          <div className={cn(
            'rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0',
            collapsed ? 'w-10 h-10' : 'w-10 h-10'
          )}>
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className={cn('text-xl font-display font-bold', getSidebarTextColor())}>LiqLearns</span>
          )}
        </button>
      </div>

      {/* User Stats - Collapsed shows avatar only */}
      <div className={cn('border-b border-white/10', collapsed ? 'p-2' : 'p-4')}>
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-accent text-accent-foreground font-semibold text-sm">
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
                <AvatarFallback className="bg-gradient-accent text-accent-foreground font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className={cn('font-medium truncate', getSidebarTextColor())}>{user?.email?.split('@')[0] || 'User'}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', getRoleBadgeColor())}>
                  {getRoleLabel()}
                </span>
              </div>
            </div>
            {(userRole === 'student' || !userRole) && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gold">
                  <Star className="w-4 h-4" />
                  <span className="font-medium">1,250 XP</span>
                </div>
                <div className="flex items-center gap-1 text-streak">
                  <Flame className="w-4 h-4" />
                  <span className="font-medium">7 day</span>
                </div>
              </div>
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

      {/* Footer */}
      <div className={cn('border-t border-white/10', collapsed ? 'p-2' : 'p-3')}>
        {collapsed ? (
          <div className="flex flex-col gap-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('w-full', userRole && userRole !== 'student' ? 'text-white/70 hover:text-white hover:bg-white/10' : '')}
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start',
                userRole && userRole !== 'student' 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20' 
                  : 'text-destructive hover:text-destructive hover:bg-destructive/10'
              )}
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Sign Out</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn('w-full mt-2', userRole && userRole !== 'student' ? 'text-white/70 hover:text-white hover:bg-white/10' : '')}
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
