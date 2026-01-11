import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { 
  Search, 
  User,
  LogOut,
  Settings,
  Menu,
  LayoutDashboard,
  Users,
  HeadphonesIcon,
  MessageSquare,
  Ticket,
  Clock,
  CheckCircle,
  HelpCircle
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

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/support' },
  { icon: Ticket, label: 'Tickets', path: '/support' },
  { icon: Users, label: 'User Lookup', path: '/support' },
  { icon: MessageSquare, label: 'Live Chat', path: '/support' },
  { icon: HelpCircle, label: 'Knowledge Base', path: '/help' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const SupportNavbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      navigate(`/support?search=${encodeURIComponent(searchQuery)}`);
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
           (itemPath !== '/support' && location.pathname.startsWith(itemPath));
  };

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-cyan-900/95 via-teal-800/95 to-cyan-900/95 backdrop-blur-lg border-b border-cyan-500/20">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-cyan-200 hover:bg-cyan-500/20">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-cyan-900 to-cyan-950 border-cyan-500/20">
              <SheetHeader className="p-4 border-b border-cyan-500/20">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                    <HeadphonesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-display font-bold text-cyan-200">Support Hub</span>
                    <p className="text-xs text-cyan-400">Help Center</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* User Info */}
              <div className="p-4 border-b border-cyan-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12 ring-2 ring-cyan-500/30">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-medium text-cyan-200 truncate">{profile?.full_name || user?.email?.split('@')[0] || 'Agent'}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      Support Agent
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-cyan-500/10 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-cyan-200">12</p>
                    <p className="text-[10px] text-cyan-400">Open</p>
                  </div>
                  <div className="bg-cyan-500/10 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-cyan-200">48</p>
                    <p className="text-[10px] text-cyan-400">Resolved</p>
                  </div>
                  <div className="bg-cyan-500/10 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-cyan-200">4.8</p>
                    <p className="text-[10px] text-cyan-400">Rating</p>
                  </div>
                </div>
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
                              ? 'bg-cyan-500 text-white font-medium'
                              : 'text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200'
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
              <div className="p-3 border-t border-cyan-500/20">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
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

          <Link to="/support" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
              <HeadphonesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-cyan-200">Support</span>
          </Link>
        </div>

        {/* Desktop Title */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
            <HeadphonesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-display font-bold text-cyan-200">Support Hub</span>
            <p className="text-xs text-cyan-400">Help Center</p>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
            <Input
              type="search"
              placeholder="Search tickets, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-cyan-500/10 border-cyan-500/20 text-cyan-200 placeholder:text-cyan-400 focus:bg-cyan-500/20 focus:border-cyan-500/40"
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9 text-cyan-200 hover:bg-cyan-500/20"
            onClick={() => navigate('/support')}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0 ring-2 ring-cyan-500/30">
                <Avatar className="h-9 w-9 md:h-10 md:w-10">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white font-semibold text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-cyan-900 border-cyan-500/20">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[140px] text-cyan-200">
                    {profile?.full_name || 'Agent'}
                  </span>
                  <span className="text-xs text-cyan-400">Support Agent</span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-cyan-500/20" />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="text-cyan-300 focus:bg-cyan-500/20 focus:text-cyan-200">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-cyan-300 focus:bg-cyan-500/20 focus:text-cyan-200">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-cyan-500/20" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
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

export default SupportNavbar;
