import { ReactNode, useState, createContext, useContext, useEffect } from 'react';
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

const DESKTOP_BREAKPOINT = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true
  );

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    window.addEventListener('resize', check);
    check();
    return () => window.removeEventListener('resize', check);
  }, []);

  return isDesktop;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { userRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDesktop = useIsDesktop();

  const renderNavbar = () => {
    switch (userRole) {
      case 'ceo': return <CEONavbar />;
      case 'admin': return <AdminNavbar />;
      case 'support': return <SupportNavbar />;
      case 'teacher': return <TeacherNavbar />;
      case 'parent': return <ParentNavbar />;
      case 'enterprise': return <EnterpriseNavbar />;
      default: return <StudentNavbar />;
    }
  };

  return (
    <SidebarContext.Provider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Desktop Sidebar - JS-based detection */}
        {isDesktop && <DashboardSidebar onCollapseChange={setSidebarCollapsed} />}
        
        {/* Main content area */}
        <div 
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isDesktop ? (sidebarCollapsed ? 'ml-16' : 'ml-56') : ''}`}
        >
          {/* Role-specific Navbar */}
          <div className="shrink-0">
            {renderNavbar()}
          </div>
          
          {/* Page content */}
          <main className={`flex-1 overflow-y-auto ${isDesktop ? '' : 'pb-20'}`}>
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
        
        {/* Mobile/Tablet Bottom Navigation */}
        {!isDesktop && <MobileBottomNav />}
      </div>
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;
