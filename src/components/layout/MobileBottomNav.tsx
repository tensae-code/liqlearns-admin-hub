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
  HeadphonesIcon
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
          { icon: BarChart3, label: 'Analytics', path: '/ceo' },
          { icon: Users, label: 'Team', path: '/ceo' },
          { icon: Settings, label: 'Settings', path: '/settings' },
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
          { icon: GraduationCap, label: 'Quest', path: '/quest' },
          { icon: Users, label: 'Community', path: '/community' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path + item.label}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]',
                isActive
                  ? 'text-accent'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-accent')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground min-w-[60px]">
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle className="text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user?.email?.split('@')[0] || 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole || 'Student'}</p>
                  </div>
                </div>
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-2">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <Users className="w-5 h-5 text-muted-foreground" />
                <span>Profile</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span>Settings</span>
              </Link>
              <Link
                to="/help"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <HeadphonesIcon className="w-5 h-5 text-muted-foreground" />
                <span>Help & Support</span>
              </Link>
              <div className="pt-2 border-t border-border mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    signOut();
                    setDrawerOpen(false);
                  }}
                >
                  Sign Out
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
