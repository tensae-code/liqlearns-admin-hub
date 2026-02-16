import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { 
  BookOpen, 
  Search, 
  User,
  LogOut,
  Settings,
  LayoutDashboard,
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


const StudentNavbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

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

  const isItemActive = (itemPath: string) => {
    return location.pathname === itemPath || 
           (itemPath !== '/dashboard' && location.pathname.startsWith(itemPath) && itemPath !== '/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-orange-300/95 via-amber-200/95 to-orange-300/95 backdrop-blur-lg border-b border-orange-400/30">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-white">Liqlearns</span>
          </Link>
        </div>

        {/* Desktop - Hub Name */}
        <div className="hidden md:flex items-center">
          <span className="text-lg font-display font-bold text-orange-800">Liqlearns</span>
        </div>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-600" />
            <Input
              type="search"
              placeholder="Search courses, lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/90 border-orange-400 text-orange-900 placeholder:text-orange-500 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-400/50"
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-orange-800 hover:bg-orange-400/30"
            onClick={() => navigate('/courses')}
          >
            <Search className="h-5 w-5" />
          </Button>
          {/* Theme Toggle */}
          <ThemeToggle />

          <NotificationBell />

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
            <DropdownMenuContent align="end" className="w-56 bg-orange-600 border-orange-400/20">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-400 text-white text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[140px] text-white">
                    {profile?.full_name || 'Student'}
                  </span>
                  <span className="text-xs text-orange-200">Learner</span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-orange-400/20" />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="text-orange-200 focus:bg-orange-500/20 focus:text-white cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-orange-200 focus:bg-orange-500/20 focus:text-white cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-orange-400/20" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-300 focus:text-red-200 focus:bg-red-500/10 cursor-pointer">
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

export default StudentNavbar;