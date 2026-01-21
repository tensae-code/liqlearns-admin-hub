import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StudyRoomProvider } from "@/contexts/StudyRoomContext";
import { PlatformSettingsProvider } from "@/contexts/PlatformSettingsContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/layout/ScrollToTop";
import GlobalFloatingElements from "@/components/layout/GlobalFloatingElements";
import IncomingCallHandler from "@/components/messaging/IncomingCallHandler";
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

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/dashboard/kids" element={<UnderageDashboard />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/enterprise" element={<EnterpriseDashboard />} />
    <Route path="/enterprise/analytics" element={<EnterpriseAnalytics />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/business" element={<BusinessDashboard />} />
    <Route path="/quest" element={<Quest />} />
    <Route path="/study-rooms" element={<StudyRooms />} />
    <Route path="/messages" element={<Messages />} />
    <Route path="/events" element={<Events />} />
    <Route path="/community" element={<Community />} />
    <Route path="/help" element={<Help />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/course/:id" element={<CourseDetail />} />
    
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
            <StudyRoomProvider>
              <ScrollToTop />
              <AppRoutes />
              <GlobalFloatingElements />
              <IncomingCallHandler />
            </StudyRoomProvider>
          </PlatformSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
