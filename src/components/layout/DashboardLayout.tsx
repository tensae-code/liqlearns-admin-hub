import { ReactNode, useState, createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from './DashboardSidebar';
import MobileBottomNav from './MobileBottomNav';
import CEONavbar from './navbars/CEONavbar';
import AdminNavbar from './navbars/AdminNavbar';
import SupportNavbar from './navbars/SupportNavbar';
import TeacherNavbar from './navbars/TeacherNavbar';
import ParentNavbar from './navbars/ParentNavbar';
import StudentNavbar from './navbars/StudentNavbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Create context for sidebar state
interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { userRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderNavbar = () => {
    switch (userRole) {
      case 'ceo':
        return <CEONavbar />;
      case 'admin':
        return <AdminNavbar />;
      case 'support':
        return <SupportNavbar />;
      case 'teacher':
        return <TeacherNavbar />;
      case 'parent':
        return <ParentNavbar />;
      default:
        return <StudentNavbar />;
    }
  };

  return (
    <SidebarContext.Provider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}>
      <div className="min-h-screen bg-gradient-to-br from-orange-300 via-orange-200 to-amber-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <DashboardSidebar onCollapseChange={setSidebarCollapsed} />
        </div>
        
        {/* Main content area - adjusts based on sidebar state */}
        <div 
          className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}
        >
          {/* Role-specific Navbar */}
          {renderNavbar()}
          
          {/* Page content */}
          <main className="pb-20 md:pb-0">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;
