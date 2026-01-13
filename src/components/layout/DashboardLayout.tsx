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
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950/20 to-slate-950 relative overflow-hidden">
        {/* Cosmic background elements */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Nebula glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          
          {/* Stars */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent),
                              radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent),
                              radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent),
                              radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.3), transparent),
                              radial-gradient(1px 1px at 230px 80px, rgba(255,255,255,0.25), transparent),
                              radial-gradient(2px 2px at 300px 200px, rgba(255,255,255,0.35), transparent),
                              radial-gradient(1px 1px at 400px 150px, rgba(255,255,255,0.2), transparent),
                              radial-gradient(2px 2px at 500px 90px, rgba(255,255,255,0.3), transparent),
                              radial-gradient(1px 1px at 600px 250px, rgba(255,255,255,0.4), transparent),
                              radial-gradient(2px 2px at 700px 180px, rgba(255,255,255,0.25), transparent)`,
            backgroundSize: '800px 400px'
          }} />
        </div>
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
