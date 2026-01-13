import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
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
  Library,
  Shield,
  Baby,
  BarChart3,
  FileText,
  Mail,
  Trophy,
  X
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
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
    default: // student - max 10 items
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: GraduationCap, label: 'Quest', path: '/quest' },
        { icon: Users, label: 'Study Rooms', path: '/study-rooms' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: Calendar, label: 'Events', path: '/events' },
        { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
        { icon: MessageSquare, label: 'Community', path: '/community' },
        { icon: Trophy, label: 'Profile', path: '/profile' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];
  }
};

const DashboardSidebar = ({ className, onCollapseChange }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, userRole } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = getNavItemsForRole(userRole);

  const isItemActive = (itemPath: string) => {
    return location.pathname === itemPath;
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Logo Button - Always visible */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed top-4 left-4 z-50 w-12 h-12 rounded-xl shadow-lg',
          'bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center',
          'hover:scale-110 transition-transform'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          rotate: isOpen ? 0 : 0,
          boxShadow: [
            '0 0 15px rgba(249, 115, 22, 0.3)',
            '0 0 25px rgba(249, 115, 22, 0.5)',
            '0 0 15px rgba(249, 115, 22, 0.3)'
          ]
        }}
        transition={{ 
          boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <BookOpen className="w-5 h-5 text-white" />
        )}
      </motion.button>

      {/* Nav Menu - Appears on logo click */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Container */}
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              className="fixed top-20 left-4 z-50 flex flex-col gap-2 max-h-[80vh] overflow-y-auto"
            >
              {/* Nav Items */}
              {navItems.map((item, index) => {
                const isActive = isItemActive(item.path);
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleNavClick(item.path)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all',
                      'backdrop-blur-xl border',
                      isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white border-orange-400/50 shadow-orange-500/30' 
                        : 'bg-white/10 dark:bg-white/5 border-white/20 text-foreground hover:bg-white/20'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                );
              })}

              {/* Sign Out Button */}
              <motion.button
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ delay: navItems.length * 0.03 }}
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all backdrop-blur-xl border bg-red-500/20 border-red-300/30 text-red-600 dark:text-red-400 hover:bg-red-500/30 mt-2"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Sign Out</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
