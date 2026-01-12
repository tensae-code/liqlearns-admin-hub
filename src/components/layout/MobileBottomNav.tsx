import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  Menu,
  GraduationCap,
  BarChart3,
  Shield,
  Baby,
  HeadphonesIcon,
  User,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  Mail
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const MobileBottomNav = () => {
  const location = useLocation();
  const { userRole, signOut, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getNavItems = () => {
    switch (userRole) {
      case 'ceo':
        return [
          { icon: LayoutDashboard, label: 'Overview', path: '/ceo' },
          { icon: BarChart3, label: 'Analytics', path: '/ceo/analytics' },
          { icon: Users, label: 'Team', path: '/ceo/team' },
          { icon: FileText, label: 'Reports', path: '/ceo/reports' },
        ];
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: Users, label: 'Users', path: '/admin' },
          { icon: BookOpen, label: 'Courses', path: '/admin' },
          { icon: Shield, label: 'Moderation', path: '/admin' },
        ];
      case 'support':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/support' },
          { icon: HeadphonesIcon, label: 'Tickets', path: '/support' },
          { icon: Users, label: 'Users', path: '/support' },
          { icon: Settings, label: 'Settings', path: '/settings' },
        ];
      case 'teacher':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
          { icon: BookOpen, label: 'Courses', path: '/teacher' },
          { icon: Users, label: 'Students', path: '/teacher' },
          { icon: BarChart3, label: 'Earnings', path: '/teacher' },
        ];
      case 'parent':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/parent' },
          { icon: Baby, label: 'Children', path: '/parent' },
          { icon: BarChart3, label: 'Progress', path: '/parent' },
          { icon: Settings, label: 'Settings', path: '/settings' },
        ];
      default: // student
        return [
          { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
          { icon: BookOpen, label: 'Courses', path: '/courses' },
          { icon: Mail, label: 'Messages', path: '/messages' },
          { icon: Users, label: 'Community', path: '/community' },
        ];
    }
  };

  const navItems = getNavItems();

  // Check if current path matches the item path (exact match for CEO dashboard, startsWith for sub-routes)
  const isItemActive = (itemPath: string) => {
    // Exact match for main dashboard routes
    if (itemPath === '/ceo' || itemPath === '/admin' || itemPath === '/support' || 
        itemPath === '/teacher' || itemPath === '/parent' || itemPath === '/dashboard') {
      return location.pathname === itemPath;
    }
    // For sub-routes, use exact match
    return location.pathname === itemPath;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around px-1 py-1.5 pb-safe">
        {navItems.map((item) => {
          const isActive = isItemActive(item.path);
          return (
            <Link
              key={item.path + item.label}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[56px]',
                isActive
                  ? 'bg-accent/10'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'w-6 h-6 flex items-center justify-center rounded-lg transition-all',
                isActive && 'bg-accent text-accent-foreground'
              )}>
                <item.icon className={cn('w-4 h-4', isActive ? 'text-accent-foreground' : 'text-muted-foreground')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-accent' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-muted-foreground min-w-[56px] hover:bg-muted/50 transition-all">
              <div className="w-6 h-6 flex items-center justify-center">
                <Menu className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium">More</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-left">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-gold/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-gold flex items-center justify-center text-white font-bold text-lg">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-base">{user?.email?.split('@')[0] || 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole || 'Student'} Account</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-1">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">Profile</span>
                  <p className="text-xs text-muted-foreground">View and edit your profile</p>
                </div>
              </Link>
              <Link
                to="/courses"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">Courses</span>
                  <p className="text-xs text-muted-foreground">Browse all courses</p>
                </div>
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">Settings</span>
                  <p className="text-xs text-muted-foreground">App preferences & security</p>
                </div>
              </Link>
              <Link
                to="/help"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">Help & Support</span>
                  <p className="text-xs text-muted-foreground">FAQs and contact support</p>
                </div>
              </Link>
              <div className="pt-3 mt-2 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-12 rounded-xl"
                  onClick={() => {
                    signOut();
                    setDrawerOpen(false);
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mr-3">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">Sign Out</span>
                    <p className="text-xs opacity-70">Log out of your account</p>
                  </div>
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
