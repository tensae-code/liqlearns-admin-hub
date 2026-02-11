import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StudyRoomProvider } from "@/contexts/StudyRoomContext";
import { PlatformSettingsProvider } from "@/contexts/PlatformSettingsContext";
import { LiveKitProvider } from "@/contexts/LiveKitContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/layout/ScrollToTop";
import GlobalFloatingElements from "@/components/layout/GlobalFloatingElements";
import GlobalLiveKitCallUI from "@/components/messaging/GlobalLiveKitCallUI";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import UnderageDashboard from "./pages/UnderageDashboard";
import Courses from "./pages/Courses";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import EnterpriseAnalytics from "./pages/EnterpriseAnalytics";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import Marketplace from "./pages/Marketplace";
import BusinessDashboard from "./pages/BusinessDashboard";
import Quest from "./pages/Quest";
import StudyRooms from "./pages/StudyRooms";
import Messages from "./pages/Messages";
import Events from "./pages/Events";
import Community from "./pages/Community";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import CourseDetail from "./pages/CourseDetail";
import CourseLearning from "./pages/CourseLearning";
import AdminDashboard from "./pages/AdminDashboard";
import CEODashboard from "./pages/CEODashboard";
import CEOAnalytics from "./pages/CEOAnalytics";
import CEOTeam from "./pages/CEOTeam";
import CEOReports from "./pages/CEOReports";
import CEOAIManagement from "./pages/CEOAIManagement";
import CEOFinance from "./pages/CEOFinance";
import CEOUsers from "./pages/CEOUsers";
import SupportDashboard from "./pages/SupportDashboard";
import NotFound from "./pages/NotFound";
import GamePage from "./pages/GamePage";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

const queryClient = new QueryClient();

// Redirects logged-in users from landing to their dashboard
const LandingRedirect = () => {
  const { user, loading, getDashboardPath } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to={getDashboardPath()} replace />;
  return <Index />;
};

// Requires auth for all dashboard pages
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingRedirect />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
    <Route path="/dashboard/kids" element={<RequireAuth><UnderageDashboard /></RequireAuth>} />
    <Route path="/courses" element={<RequireAuth><Courses /></RequireAuth>} />
    <Route path="/enterprise" element={<RequireAuth><EnterpriseDashboard /></RequireAuth>} />
    <Route path="/enterprise/analytics" element={<RequireAuth><EnterpriseAnalytics /></RequireAuth>} />
    <Route path="/enterprise/team" element={<Navigate to="/enterprise?tab=team" replace />} />
    <Route path="/enterprise/courses" element={<Navigate to="/enterprise?tab=courses" replace />} />
    <Route path="/enterprise/paths" element={<Navigate to="/enterprise?tab=paths" replace />} />
    <Route path="/marketplace" element={<RequireAuth><Marketplace /></RequireAuth>} />
    <Route path="/business" element={<RequireAuth><BusinessDashboard /></RequireAuth>} />
    <Route path="/quest" element={<RequireAuth><Quest /></RequireAuth>} />
    <Route path="/study-rooms" element={<RequireAuth><StudyRooms /></RequireAuth>} />
    <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
    <Route path="/events" element={<RequireAuth><Events /></RequireAuth>} />
    <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
    <Route path="/help" element={<RequireAuth><Help /></RequireAuth>} />
    <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
    <Route path="/course/:id" element={<RequireAuth><CourseDetail /></RequireAuth>} />
    <Route path="/course/:id/learn" element={<RequireAuth><CourseLearning /></RequireAuth>} />
    <Route path="/referrals" element={<Navigate to="/business" replace />} />
    
    {/* Protected Teacher Routes */}
    <Route path="/teacher" element={
      <ProtectedRoute allowedRoles={['teacher', 'admin', 'ceo']}>
        <TeacherDashboard />
      </ProtectedRoute>
    } />
    
    {/* Protected Parent Routes */}
    <Route path="/parent" element={
      <ProtectedRoute allowedRoles={['parent', 'admin', 'ceo']}>
        <ParentDashboard />
      </ProtectedRoute>
    } />
    
    {/* Protected Admin Routes */}
    <Route path="/admin" element={
      <ProtectedRoute allowedRoles={['admin', 'ceo']}>
        <AdminDashboard />
      </ProtectedRoute>
    } />
    
    {/* Protected CEO Routes */}
    <Route path="/ceo" element={
      <ProtectedRoute allowedRoles={['ceo']}>
        <CEODashboard />
      </ProtectedRoute>
    } />
    <Route path="/ceo/analytics" element={
      <ProtectedRoute allowedRoles={['ceo']}>
        <CEOAnalytics />
      </ProtectedRoute>
    } />
    <Route path="/ceo/team" element={
      <ProtectedRoute allowedRoles={['ceo']}>
        <CEOTeam />
      </ProtectedRoute>
    } />
    <Route path="/ceo/reports" element={
      <ProtectedRoute allowedRoles={['ceo']}>
        <CEOReports />
      </ProtectedRoute>
    } />
    <Route path="/ceo/ai" element={
      <ProtectedRoute allowedRoles={['ceo']}>
        <CEOAIManagement />
      </ProtectedRoute>
    } />
    <Route path="/ceo/finance" element={
      <ProtectedRoute allowedRoles={['ceo']}>
        <CEOFinance />
      </ProtectedRoute>
    } />
    <Route path="/ceo/users" element={
      <ProtectedRoute allowedRoles={['ceo']}>
        <CEOUsers />
      </ProtectedRoute>
    } />
    
    {/* Protected Support Routes */}
    <Route path="/support" element={
      <ProtectedRoute allowedRoles={['support', 'admin', 'ceo']}>
        <SupportDashboard />
      </ProtectedRoute>
    } />
    
    {/* Shareable Game Route */}
    <Route path="/game/:shareCode" element={<GamePage />} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlatformSettingsProvider>
            <LiveKitProvider>
              <StudyRoomProvider>
                <ScrollToTop />
                <AppRoutes />
                <GlobalFloatingElements />
                <GlobalLiveKitCallUI />
              </StudyRoomProvider>
            </LiveKitProvider>
          </PlatformSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
