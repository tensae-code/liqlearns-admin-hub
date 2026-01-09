import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import BusinessDashboard from "./pages/BusinessDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import Marketplace from "./pages/Marketplace";
import Quest from "./pages/Quest";
import StudyRooms from "./pages/StudyRooms";
import Events from "./pages/Events";
import Community from "./pages/Community";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import CourseDetail from "./pages/CourseDetail";
import AdminDashboard from "./pages/AdminDashboard";
import CEODashboard from "./pages/CEODashboard";
import SupportDashboard from "./pages/SupportDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/business" element={<BusinessDashboard />} />
    <Route path="/teacher" element={<TeacherDashboard />} />
    <Route path="/parent" element={<ParentDashboard />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/quest" element={<Quest />} />
    <Route path="/study-rooms" element={<StudyRooms />} />
    <Route path="/events" element={<Events />} />
    <Route path="/community" element={<Community />} />
    <Route path="/help" element={<Help />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/course/:id" element={<CourseDetail />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/ceo" element={<CEODashboard />} />
    <Route path="/support" element={<SupportDashboard />} />
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
