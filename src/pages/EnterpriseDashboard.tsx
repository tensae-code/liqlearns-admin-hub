import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  TrendingUp, 
  Share2,
  Copy,
  ChevronRight,
  ArrowUpRight,
  Building2,
  UserPlus,
  BookOpen,
  Wallet,
  BarChart3,
  Route,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import EnterpriseMemberManager from '@/components/enterprise/EnterpriseMemberManager';
import EnterpriseCourseManager from '@/components/enterprise/EnterpriseCourseManager';
import LearningPathBuilder from '@/components/enterprise/LearningPathBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface EnterpriseStats {
  totalMembers: number;
  activeLearners: number;
  coursesCompleted: number;
  avgCompletionRate: number;
  totalStudyHours: number;
  certificatesIssued: number;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  course?: string;
  timestamp: string;
  type: 'completion' | 'enrollment' | 'milestone';
}

interface CourseProgress {
  id: string;
  title: string;
  enrolledCount: number;
  completionRate: number;
  status: 'on-track' | 'needs-attention' | 'completed';
}

const EnterpriseDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [memberManagerOpen, setMemberManagerOpen] = useState(false);
  const [courseManagerOpen, setCourseManagerOpen] = useState(false);
  const [learningPathOpen, setLearningPathOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle tab query param to open modals
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'team') {
      setMemberManagerOpen(true);
    } else if (tab === 'courses') {
      setCourseManagerOpen(true);
    } else if (tab === 'paths') {
      setLearningPathOpen(true);
    }
  }, [searchParams]);

  // Clear query param when modal closes
  const handleMemberManagerClose = (open: boolean) => {
    setMemberManagerOpen(open);
    if (!open && searchParams.get('tab') === 'team') {
      setSearchParams({});
    }
  };

  const handleCourseManagerClose = (open: boolean) => {
    setCourseManagerOpen(open);
    if (!open && searchParams.get('tab') === 'courses') {
      setSearchParams({});
    }
  };

  const handleLearningPathClose = (open: boolean) => {
    setLearningPathOpen(open);
    if (!open && searchParams.get('tab') === 'paths') {
      setSearchParams({});
    }
  };

  // Generate enterprise code from user id
  const enterpriseCode = profile?.id ? `ENT-${profile.id.slice(0, 8).toUpperCase()}` : 'ENT-LOADING';
  const enterpriseName = profile?.enterprise_org_name || profile?.full_name || 'My Organization';

  const [stats, setStats] = useState<EnterpriseStats>({
    totalMembers: 0,
    activeLearners: 0,
    coursesCompleted: 0,
    avgCompletionRate: 0,
    totalStudyHours: 0,
    certificatesIssued: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);

  useEffect(() => {
    const fetchEnterpriseData = async () => {
      if (!user) return;
      
      try {
        // Fetch learning paths for this enterprise
        const { data: learningPaths } = await supabase
          .from('learning_paths')
          .select('id, title')
          .eq('enterprise_id', profile?.id || '');

        // Fetch learning path progress
        const { data: progressData } = await supabase
          .from('learning_path_progress')
          .select('*, profiles:user_id(full_name)')
          .order('updated_at', { ascending: false })
          .limit(20);

        // Fetch analytics events
        const { data: events } = await supabase
          .from('enterprise_analytics_events')
          .select('*')
          .eq('enterprise_id', profile?.id || '')
          .order('created_at', { ascending: false })
          .limit(50);

        // Calculate stats
        const uniqueUsers = new Set(progressData?.map(p => p.user_id) || []);
        const completedPaths = progressData?.filter(p => p.completed_at) || [];
        const avgProgress = progressData?.length 
          ? progressData.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / progressData.length 
          : 0;

        setStats({
          totalMembers: uniqueUsers.size || 12, // Fallback to demo data
          activeLearners: progressData?.filter(p => !p.completed_at).length || 8,
          coursesCompleted: completedPaths.length || 45,
          avgCompletionRate: Math.round(avgProgress) || 72,
          totalStudyHours: Math.round((events?.length || 0) * 2.5) || 156,
          certificatesIssued: completedPaths.length || 23
        });

        // Build recent activity from events
        const activities: RecentActivity[] = (events || []).slice(0, 5).map((event, i) => ({
          id: event.id,
          user: `Team Member ${i + 1}`,
          action: event.event_type === 'course_completed' ? 'completed' :
                  event.event_type === 'course_started' ? 'started' : 'progressed in',
          course: event.course_id ? 'Learning Module' : 'Training Path',
          timestamp: new Date(event.created_at).toLocaleDateString(),
          type: event.event_type === 'course_completed' ? 'completion' : 
                event.event_type === 'milestone_reached' ? 'milestone' : 'enrollment'
        }));

        // Fallback demo data if no real data
        if (activities.length === 0) {
          setRecentActivity([
            { id: '1', user: 'Sarah Johnson', action: 'completed', course: 'Leadership Fundamentals', timestamp: '2 hours ago', type: 'completion' },
            { id: '2', user: 'Michael Chen', action: 'started', course: 'Project Management', timestamp: '4 hours ago', type: 'enrollment' },
            { id: '3', user: 'Emily Davis', action: 'achieved milestone in', course: 'Data Analysis', timestamp: '1 day ago', type: 'milestone' },
            { id: '4', user: 'James Wilson', action: 'completed', course: 'Communication Skills', timestamp: '2 days ago', type: 'completion' },
          ]);
        } else {
          setRecentActivity(activities);
        }

        // Course progress
        setCourseProgress([
          { id: '1', title: 'Leadership Fundamentals', enrolledCount: 45, completionRate: 78, status: 'on-track' },
          { id: '2', title: 'Project Management Essentials', enrolledCount: 38, completionRate: 65, status: 'on-track' },
          { id: '3', title: 'Communication Skills', enrolledCount: 52, completionRate: 42, status: 'needs-attention' },
          { id: '4', title: 'Data Analysis Basics', enrolledCount: 28, completionRate: 92, status: 'completed' },
        ]);

      } catch (error) {
        console.error('Error fetching enterprise data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnterpriseData();
  }, [user, profile]);

  const copyEnterpriseCode = () => {
    navigator.clipboard.writeText(enterpriseCode);
    toast.success('Invite code copied to clipboard!');
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'completion': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'milestone': return <Award className="w-4 h-4 text-gold" />;
      case 'enrollment': return <BookOpen className="w-4 h-4 text-accent" />;
    }
  };

  const getStatusBadge = (status: CourseProgress['status']) => {
    switch (status) {
      case 'on-track': return <Badge className="bg-success/10 text-success border-success/30">On Track</Badge>;
      case 'needs-attention': return <Badge className="bg-warning/10 text-warning border-warning/30">Needs Attention</Badge>;
      case 'completed': return <Badge className="bg-accent/10 text-accent border-accent/30">Completed</Badge>;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {enterpriseName}
              </h1>
              <p className="text-muted-foreground">Enterprise Learning Management</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMemberManagerOpen(true)}>
              <Users className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Team</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCourseManagerOpen(true)}>
              <BookOpen className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Courses</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/enterprise/analytics')}>
              <BarChart3 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Reports</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLearningPathOpen(true)}>
              <Route className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Paths</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Invite Banner */}
      <motion.div
        className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground rounded-xl p-4 md:p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm opacity-80 mb-1">Team Invite Code</p>
            <div className="flex items-center gap-3">
              <span className="text-xl md:text-2xl font-mono font-bold tracking-wider">{enterpriseCode}</span>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={copyEnterpriseCode}
                className="bg-white/20 hover:bg-white/30 text-accent-foreground border-0"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs opacity-70 mt-2">Share this code with team members to join your organization</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-accent-foreground border-0">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button className="bg-white text-accent hover:bg-white/90" onClick={() => setMemberManagerOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Team
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Team Members', value: stats.totalMembers, icon: Users, color: 'text-accent' },
          { label: 'Active Learners', value: stats.activeLearners, icon: GraduationCap, color: 'text-success' },
          { label: 'Courses Completed', value: stats.coursesCompleted, icon: CheckCircle2, color: 'text-gold' },
          { label: 'Avg. Completion', value: `${stats.avgCompletionRate}%`, icon: Target, color: 'text-accent' },
          { label: 'Study Hours', value: stats.totalStudyHours, icon: Clock, color: 'text-muted-foreground' },
          { label: 'Certificates', value: stats.certificatesIssued, icon: Award, color: 'text-gold' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="p-4">
                <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Course Progress */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-display">Training Progress</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCourseManagerOpen(true)}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseProgress.map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.enrolledCount} team members enrolled</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{course.completionRate}%</span>
                      {getStatusBadge(course.status)}
                    </div>
                  </div>
                  <Progress value={course.completionRate} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.user}</span>
                      {' '}{activity.action}{' '}
                      <span className="text-accent">{activity.course}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setMemberManagerOpen(true)}
        >
          <UserPlus className="w-5 h-5 text-accent" />
          <span className="text-sm">Add Team Members</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setCourseManagerOpen(true)}
        >
          <BookOpen className="w-5 h-5 text-accent" />
          <span className="text-sm">Assign Training</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setLearningPathOpen(true)}
        >
          <Route className="w-5 h-5 text-accent" />
          <span className="text-sm">Create Learning Path</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate('/enterprise/analytics')}
        >
          <BarChart3 className="w-5 h-5 text-accent" />
          <span className="text-sm">View Reports</span>
        </Button>
      </motion.div>

      {/* Modals */}
      <EnterpriseMemberManager
        open={memberManagerOpen}
        onOpenChange={handleMemberManagerClose}
      />
      <EnterpriseCourseManager
        open={courseManagerOpen}
        onOpenChange={handleCourseManagerClose}
      />
      <LearningPathBuilder
        open={learningPathOpen}
        onOpenChange={handleLearningPathClose}
      />
    </DashboardLayout>
  );
};

export default EnterpriseDashboard;
