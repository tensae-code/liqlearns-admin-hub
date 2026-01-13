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
      <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-950 to-slate-950 relative overflow-hidden">
        {/* Forest RPG background elements */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Forest canopy light rays */}
          <div className="absolute top-0 left-1/3 w-32 h-[60vh] bg-gradient-to-b from-emerald-400/10 via-emerald-400/5 to-transparent rotate-12 blur-xl" />
          <div className="absolute top-0 right-1/4 w-24 h-[50vh] bg-gradient-to-b from-lime-400/8 via-lime-400/3 to-transparent -rotate-6 blur-xl" />
          <div className="absolute top-0 left-1/2 w-20 h-[40vh] bg-gradient-to-b from-yellow-400/5 via-yellow-400/2 to-transparent rotate-3 blur-lg" />
          
          {/* Ambient forest glows */}
          <div className="absolute bottom-0 left-0 w-96 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-48 h-48 bg-green-400/5 rounded-full blur-2xl" />
          
          {/* Subtle firefly particles */}
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: `radial-gradient(2px 2px at 100px 150px, rgba(134,239,172,0.6), transparent),
                              radial-gradient(2px 2px at 300px 100px, rgba(167,243,208,0.4), transparent),
                              radial-gradient(1px 1px at 500px 300px, rgba(134,239,172,0.5), transparent),
                              radial-gradient(2px 2px at 700px 200px, rgba(167,243,208,0.3), transparent),
                              radial-gradient(1px 1px at 200px 400px, rgba(187,247,208,0.4), transparent),
                              radial-gradient(2px 2px at 600px 350px, rgba(134,239,172,0.5), transparent)`,
            backgroundSize: '900px 500px'
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
