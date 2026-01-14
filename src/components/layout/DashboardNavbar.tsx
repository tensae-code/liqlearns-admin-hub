import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { STAT_GRADIENTS } from '@/lib/theme';
import { 
  BookOpen, 
  Search, 
  User,
  LogOut,
  Settings,
  Menu,
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  ShoppingBag,
  MessageSquare,
  HelpCircle,
  Trophy,
  Briefcase,
  Library,
  Shield,
  Baby,
  BarChart3,
  FileText,
  HeadphonesIcon,
  Flame,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

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
        { icon: HeadphonesIcon, label: 'Tickets', path: '/support' },
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
        { icon: Briefcase, label: 'Business', path: '/business' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: GraduationCap, label: 'Quest', path: '/quest' },
        { icon: Users, label: 'Study Rooms', path: '/study-rooms' },
        { icon: Calendar, label: 'Events', path: '/events' },
        { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
        { icon: MessageSquare, label: 'Community', path: '/community' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
  }
};

const DashboardNavbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, userRole } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = getNavItemsForRole(userRole);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleBadge = () => {
    const roleLabels: Record<string, string> = {
      ceo: 'CEO',
      admin: 'Admin',
      teacher: 'Teacher',
      support: 'Support',
      parent: 'Parent',
      student: 'Student'
    };
    return roleLabels[userRole || 'student'] || 'Student';
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'teacher': return `bg-gradient-to-r ${STAT_GRADIENTS[1]} text-white`;
      case 'parent': return `bg-gradient-to-r ${STAT_GRADIENTS[2]} text-white`;
      case 'admin': return `bg-gradient-to-r ${STAT_GRADIENTS[1]} text-white`;
      case 'ceo': return `bg-gradient-to-r ${STAT_GRADIENTS[3]} text-white`;
      case 'support': return `bg-gradient-to-r ${STAT_GRADIENTS[0]} text-white`;
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/ceo' && location.pathname === '/ceo') return true;
    if (itemPath !== '/ceo' && location.pathname.startsWith(itemPath) && itemPath !== '/') return true;
    return location.pathname === itemPath;
  };

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-primary/95 via-accent/95 to-primary/95 backdrop-blur-lg border-b border-primary/20 dark:from-primary/80 dark:via-accent/80 dark:to-primary/80">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary/20">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-primary to-primary/90 dark:from-primary/90 dark:to-primary/80 border-primary/20">
              <SheetHeader className="p-4 border-b border-primary-foreground/20">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <span className="text-xl font-display font-bold text-primary-foreground">LiqLearns</span>
                </SheetTitle>
              </SheetHeader>

              {/* User Info */}
              <div className="p-4 border-b border-orange-400/20">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-400 text-white font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-medium text-white truncate">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', getRoleBadgeColor())}>
                      {getRoleBadge()}
                    </span>
                  </div>
                </div>
                {(userRole === 'student' || !userRole) && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-amber-200">
                      <Star className="w-4 h-4" />
                      <span className="font-medium">1,250 XP</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-200">
                      <Flame className="w-4 h-4" />
                      <span className="font-medium">7 day</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Items */}
              <div className="flex-1 p-3 overflow-y-auto">
                <ul className="space-y-1">
                  {navItems.map((item, index) => {
                    const isActive = isItemActive(item.path);
                    return (
                      <li key={`${item.path}-${index}`}>
                        <Link
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                            isActive
                              ? 'bg-orange-500 text-white font-medium'
                              : 'text-orange-200 hover:bg-orange-500/20 hover:text-white'
                          )}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Sign Out */}
              <div className="p-3 border-t border-orange-400/20">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-300 hover:text-red-200 hover:bg-red-500/10"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-white">LiqLearns</span>
          </Link>
        </div>

        {/* Desktop Title */}
        <Link to="/dashboard" className="hidden md:flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white">LiqLearns</span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-300" />
            <Input
              type="search"
              placeholder="Search courses, lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-orange-500/20 border-orange-400/20 text-white placeholder:text-orange-300 focus:bg-orange-500/30 focus:border-orange-400/40"
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-white hover:bg-orange-500/20"
            onClick={() => navigate('/courses')}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0 ring-2 ring-orange-400/30">
                <Avatar className="h-9 w-9 md:h-10 md:w-10">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-400 text-white font-semibold text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                  <AvatarFallback className="bg-gradient-accent text-accent-foreground text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[140px] text-foreground">
                    {profile?.full_name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">{getRoleBadge()}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;