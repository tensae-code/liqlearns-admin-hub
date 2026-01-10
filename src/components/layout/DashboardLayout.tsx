import { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardNavbar from './DashboardNavbar';
import MobileBottomNav from './MobileBottomNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>
      
      {/* Main content area */}
      <div className="md:pl-64 transition-all duration-300">
        {/* Top Navbar */}
        <DashboardNavbar />
        
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
