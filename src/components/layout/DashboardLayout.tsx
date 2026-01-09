import { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
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
      
      {/* Main content */}
      <main className="md:pl-64 transition-all duration-300 pb-20 md:pb-0">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default DashboardLayout;
