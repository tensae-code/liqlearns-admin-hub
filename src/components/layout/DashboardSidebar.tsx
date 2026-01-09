import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Library
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navItems = [
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

const DashboardSidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-xl font-display font-bold text-foreground">LiqLearns</span>
          )}
        </Link>
      </div>

      {/* User Stats */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-accent text-accent-foreground font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-medium text-foreground truncate">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-xs text-muted-foreground">Student</p>
            </div>
          </div>
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
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-full mt-2"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
