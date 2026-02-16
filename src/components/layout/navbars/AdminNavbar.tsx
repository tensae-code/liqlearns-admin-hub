import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { 
  Search, 
  User,
  LogOut,
  Settings,
  BookOpen,
  AlertTriangle,
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
import GlobalSearchDialog from '@/components/layout/GlobalSearchDialog';

const AdminNavbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-gradient-to-r from-orange-300/95 via-amber-200/95 to-orange-300/95 backdrop-blur-lg border-b border-orange-400/30">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">Liqlearns</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center">
            <span className="text-lg font-display font-bold text-orange-800">Liqlearns</span>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 max-w-md mx-8 items-center gap-2 px-3 h-10 rounded-md bg-white/60 border border-orange-400 text-orange-500 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search everything...</span>
            <kbd className="ml-auto text-xs bg-orange-200/50 text-orange-700 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-orange-800 hover:bg-orange-400/30"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-9 w-9 text-orange-800 hover:bg-orange-400/30"
              onClick={() => navigate('/admin')}
            >
              <AlertTriangle className="h-5 w-5" />
            </Button>

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
                      {profile?.full_name || 'Admin'}
                    </span>
                    <span className="text-xs text-orange-200">Administrator</span>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-orange-400/20" />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="text-orange-200 focus:bg-orange-500/20 focus:text-white">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="text-orange-200 focus:bg-orange-500/20 focus:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-orange-400/20" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-300 focus:text-red-200 focus:bg-red-500/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default AdminNavbar;
