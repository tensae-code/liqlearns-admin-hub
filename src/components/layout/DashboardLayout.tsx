import { ReactNode } from 'react';
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

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { userRole } = useAuth();

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
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>
      
      {/* Main content area */}
      <div className="md:pl-64 transition-all duration-300">
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
  );
};

export default DashboardLayout;
