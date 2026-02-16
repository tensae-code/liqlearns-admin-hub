import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { STAT_GRADIENTS } from '@/lib/theme';
import { useOptionalLiveKitContext } from '@/contexts/LiveKitContext';
import { 
  BookOpen, 
  Search, 
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Phone,
  PhoneOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/theme-toggle';


const DashboardNavbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut, userRole } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const liveKitContext = useOptionalLiveKitContext();

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

  const isInCall = liveKitContext?.callState?.status === 'connected';
  const callParticipantCount = isInCall ? (liveKitContext?.remoteParticipants?.length ?? 0) + 1 : 0;

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-primary via-primary/90 to-primary backdrop-blur-lg border-b border-primary-foreground/10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-primary-foreground">LiqLearns</span>
          </Link>
        </div>

        {/* Desktop Title */}
        <Link to="/dashboard" className="hidden md:flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-primary-foreground">LiqLearns</span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
            <Input
              type="search"
              placeholder="Search courses, lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:bg-primary-foreground/15 focus:border-primary-foreground/30"
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Ongoing Call Indicator - Telegram style */}
          {isInCall && (
            <button
              onClick={() => {
                // Navigate to messages if not already there
                if (location.pathname !== '/messages') {
                  navigate('/messages');
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 border border-success/30 hover:bg-success/30 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Phone className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-success hidden sm:inline">
                {callParticipantCount}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  liveKitContext?.endCall();
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-destructive/20"
                title="End call"
              >
                <PhoneOff className="w-3 h-3 text-destructive" />
              </button>
            </button>
          )}
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10"
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
              <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0 ring-2 ring-primary-foreground/30">
                <Avatar className="h-9 w-9 md:h-10 md:w-10">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                  <AvatarFallback className="bg-gradient-accent text-accent-foreground font-semibold text-sm">
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