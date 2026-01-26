import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import CourseCategoryManager from '@/components/ceo/CourseCategoryManager';
import PlatformControls from '@/components/ceo/PlatformControls';
import CEOSkillApproval from '@/components/ceo/CEOSkillApproval';
import AdminPrivilegeManager from '@/components/ceo/AdminPrivilegeManager';
import CourseApprovalModal from '@/components/ceo/CourseApprovalModal';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Globe,
  Target,
  Award,
  Building2,
  ChevronRight,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Settings,
  Smile,
  FolderTree,
  Shield,
  Lightbulb
} from 'lucide-react';

import { STAT_GRADIENTS } from '@/lib/theme';

const CEODashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [platformControlsOpen, setPlatformControlsOpen] = useState(false);
  const [skillApprovalOpen, setSkillApprovalOpen] = useState(false);
  const [adminPrivilegesOpen, setAdminPrivilegesOpen] = useState(false);
  const [courseApprovalOpen, setCourseApprovalOpen] = useState(false);

  // Handle tab query params to open modals from sidebar navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    if (tab === 'skills') {
      setSkillApprovalOpen(true);
    } else if (tab === 'controls') {
      setPlatformControlsOpen(true);
    } else if (tab === 'categories') {
      setCategoryManagerOpen(true);
    } else if (tab === 'privileges') {
      setAdminPrivilegesOpen(true);
    } else if (tab === 'courses') {
      setCourseApprovalOpen(true);
    }
  }, [location.search]);

  // Clear query param when modal closes
  const handleSkillClose = (open: boolean) => {
    setSkillApprovalOpen(open);
    if (!open) navigate('/ceo', { replace: true });
  };

  const handleControlsClose = (open: boolean) => {
    setPlatformControlsOpen(open);
    if (!open) navigate('/ceo', { replace: true });
  };

  const handleCategoriesClose = (open: boolean) => {
    setCategoryManagerOpen(open);
    if (!open) navigate('/ceo', { replace: true });
  };

  const handlePrivilegesClose = (open: boolean) => {
    setAdminPrivilegesOpen(open);
    if (!open) navigate('/ceo', { replace: true });
  };

  const handleCourseApprovalClose = (open: boolean) => {
    setCourseApprovalOpen(open);
    if (!open) navigate('/ceo', { replace: true });
  };
  
  const stats = [
    { label: 'Total Revenue', value: '$2.4M', change: '+28%', isUp: true, icon: DollarSign, gradient: STAT_GRADIENTS[2] },
    { label: 'Active Users', value: '45,280', change: '+15%', isUp: true, icon: Users, gradient: STAT_GRADIENTS[0] },
    { label: 'Course Catalog', value: '320', change: '+12', isUp: true, icon: BookOpen, gradient: STAT_GRADIENTS[1] },
    { label: 'Global Reach', value: '45 Countries', change: '+3', isUp: true, icon: Globe, gradient: STAT_GRADIENTS[3] },
  ];

  const departments = [
    { name: 'Engineering', head: 'Dawit M.', employees: 24, budget: '$450K', status: 'On Track' },
    { name: 'Marketing', head: 'Sara T.', employees: 12, budget: '$180K', status: 'On Track' },
    { name: 'Content', head: 'Tigist K.', employees: 18, budget: '$220K', status: 'Needs Review' },
    { name: 'Support', head: 'Yonas G.', employees: 8, budget: '$95K', status: 'On Track' },
  ];

  const goals = [
    { title: 'Q4 Revenue Target', current: 85, target: 100, unit: '%' },
    { title: 'User Acquisition', current: 12500, target: 15000, unit: 'users' },
    { title: 'Course Completion Rate', current: 78, target: 85, unit: '%' },
    { title: 'Customer Satisfaction', current: 92, target: 95, unit: '%' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            CEO Dashboard 👑
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">Company overview and strategic metrics</p>
        </motion.div>

        {/* Stats Grid - Colorful Gradient Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 md:w-6 md:h-6 opacity-90" />
                <span className="text-[10px] md:text-xs bg-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-lg md:text-2xl font-display font-bold">{stat.value}</p>
              <p className="text-xs opacity-80">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Goals Section */}
        <motion.div
          className="bg-card rounded-xl border border-border p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Strategic Goals
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/ceo/reports')}>
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((goal, i) => {
              const percentage = (goal.current / goal.target) * 100;
              return (
                <div key={i} className="p-3 md:p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{goal.title}</p>
                    <span className={`text-xs font-medium ${percentage >= 90 ? 'text-success' : percentage >= 70 ? 'text-gold' : 'text-destructive'}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage >= 90 ? 'bg-success' : percentage >= 70 ? 'bg-gold' : 'bg-destructive'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Departments */}
        <motion.div
          className="bg-card rounded-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold" />
              Departments
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/ceo/team')}>
              Manage <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {departments.map((dept) => (
              <div key={dept.name} className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">Head: {dept.head}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{dept.employees}</span>
                  </div>
                  <div className="hidden sm:block text-foreground font-medium">{dept.budget}</div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    dept.status === 'On Track' ? 'bg-success/10 text-success' : 'bg-gold/10 text-gold'
                  }`}>
                    {dept.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <motion.div
            className="bg-gradient-hero text-primary-foreground rounded-xl p-4 md:p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Award className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-xl md:text-2xl font-bold">Top 5</p>
            <p className="text-xs md:text-sm opacity-80">EdTech Platform</p>
          </motion.div>
          <motion.div
            className="bg-success/10 border border-success/20 rounded-xl p-4 md:p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <TrendingUp className="w-6 h-6 mb-2 text-success" />
            <p className="text-xl md:text-2xl font-bold text-foreground">+156%</p>
            <p className="text-xs md:text-sm text-muted-foreground">YoY Growth</p>
          </motion.div>
          <motion.div
            className="bg-gold/10 border border-gold/20 rounded-xl p-4 md:p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Users className="w-6 h-6 mb-2 text-gold" />
            <p className="text-xl md:text-2xl font-bold text-foreground">86</p>
            <p className="text-xs md:text-sm text-muted-foreground">Team Members</p>
          </motion.div>
          <motion.div
            className="bg-accent/10 border border-accent/20 rounded-xl p-4 md:p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <BookOpen className="w-6 h-6 mb-2 text-accent" />
            <p className="text-xl md:text-2xl font-bold text-foreground">98.5%</p>
            <p className="text-xs md:text-sm text-muted-foreground">Uptime</p>
          </motion.div>
        </div>
      </div>
      
      {/* Category Manager Modal */}
      <CourseCategoryManager 
        open={categoryManagerOpen} 
        onOpenChange={handleCategoriesClose} 
      />
      <PlatformControls
        open={platformControlsOpen}
        onOpenChange={handleControlsClose}
      />
      <CEOSkillApproval
        open={skillApprovalOpen}
        onOpenChange={handleSkillClose}
      />
      <AdminPrivilegeManager
        open={adminPrivilegesOpen}
        onOpenChange={handlePrivilegesClose}
      />
      <CourseApprovalModal
        open={courseApprovalOpen}
        onOpenChange={handleCourseApprovalClose}
      />
    </DashboardLayout>
  );
};

export default CEODashboard;
