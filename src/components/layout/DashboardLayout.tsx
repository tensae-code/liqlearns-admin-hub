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
import EnterpriseNavbar from './navbars/EnterpriseNavbar';

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
      case 'enterprise':
        return <EnterpriseNavbar />;
      default:
        return <StudentNavbar />;
    }
  };

  return (
    <SidebarContext.Provider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DashboardSidebar onCollapseChange={setSidebarCollapsed} />
        </div>
        
        {/* Main content area - adjusts based on sidebar state */}
        <div 
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'}`}
        >
          {/* Role-specific Navbar - sticky */}
          <div className="shrink-0">
            {renderNavbar()}
          </div>
          
          {/* Page content - scrollable */}
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
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
