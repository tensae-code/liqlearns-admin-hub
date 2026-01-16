import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Award,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { STAT_GRADIENTS } from '@/lib/theme';
import { 
  useEnterpriseAnalytics, 
  useEnterpriseTopPerformers, 
  useEnterpriseCoursePopularity 
} from '@/hooks/useEnterpriseAnalytics';

const EnterpriseAnalytics = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30d');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Fetch real analytics data
  const { data: analyticsData, isLoading: analyticsLoading, refetch } = useEnterpriseAnalytics(timeRange);
  const { data: topPerformers = [], isLoading: performersLoading } = useEnterpriseTopPerformers(5);
  const { data: coursePopularity = [], isLoading: popularityLoading } = useEnterpriseCoursePopularity();

  // Use real data with fallbacks
  const completionTrends = analyticsData?.completionTrends || [
    { month: 'Jan', completions: 0, enrollments: 0, avgProgress: 0 },
    { month: 'Feb', completions: 0, enrollments: 0, avgProgress: 0 },
    { month: 'Mar', completions: 0, enrollments: 0, avgProgress: 0 },
    { month: 'Apr', completions: 0, enrollments: 0, avgProgress: 0 },
    { month: 'May', completions: 0, enrollments: 0, avgProgress: 0 },
    { month: 'Jun', completions: 0, enrollments: 0, avgProgress: 0 },
  ];

  const engagementData = analyticsData?.engagementData || [
    { day: 'Mon', activeUsers: 0, studyMinutes: 0, lessons: 0 },
    { day: 'Tue', activeUsers: 0, studyMinutes: 0, lessons: 0 },
    { day: 'Wed', activeUsers: 0, studyMinutes: 0, lessons: 0 },
    { day: 'Thu', activeUsers: 0, studyMinutes: 0, lessons: 0 },
    { day: 'Fri', activeUsers: 0, studyMinutes: 0, lessons: 0 },
    { day: 'Sat', activeUsers: 0, studyMinutes: 0, lessons: 0 },
    { day: 'Sun', activeUsers: 0, studyMinutes: 0, lessons: 0 },
  ];

  // Department progress (would need department tracking in the future)
  const departmentProgress = [
    { name: 'Engineering', progress: 78, members: 45, color: '#8b5cf6' },
    { name: 'Marketing', progress: 65, members: 28, color: '#06b6d4' },
    { name: 'Sales', progress: 82, members: 32, color: '#10b981' },
    { name: 'HR', progress: 71, members: 15, color: '#f59e0b' },
    { name: 'Finance', progress: 68, members: 18, color: '#ef4444' },
  ];

  // Fallback course popularity if no data
  const displayCoursePopularity = coursePopularity.length > 0 ? coursePopularity : [
    { name: 'No courses yet', value: 100, color: 'hsl(var(--muted))' },
  ];

  // Build stats from real data
  const stats = analyticsData?.stats ? [
    { 
      label: 'Active Learners', 
      value: analyticsData.stats.activeLearners.toString(), 
      change: `+${analyticsData.stats.activeLearnersTrend}%`, 
      trend: analyticsData.stats.activeLearnersTrend >= 0 ? 'up' : 'down', 
      icon: Users, 
      gradient: STAT_GRADIENTS[0] 
    },
    { 
      label: 'Courses Completed', 
      value: analyticsData.stats.coursesCompleted.toString(), 
      change: `+${analyticsData.stats.coursesCompletedTrend}%`, 
      trend: analyticsData.stats.coursesCompletedTrend >= 0 ? 'up' : 'down', 
      icon: BookOpen, 
      gradient: STAT_GRADIENTS[1] 
    },
    { 
      label: 'Avg. Study Time', 
      value: `${analyticsData.stats.avgStudyTime}h`, 
      change: `+${analyticsData.stats.avgStudyTimeTrend}%`, 
      trend: analyticsData.stats.avgStudyTimeTrend >= 0 ? 'up' : 'down', 
      icon: Clock, 
      gradient: STAT_GRADIENTS[2] 
    },
    { 
      label: 'Completion Rate', 
      value: `${analyticsData.stats.completionRate}%`, 
      change: `${analyticsData.stats.completionRateTrend}%`, 
      trend: analyticsData.stats.completionRateTrend >= 0 ? 'up' : 'down', 
      icon: Target, 
      gradient: STAT_GRADIENTS[3] 
    },
  ] : [
    { label: 'Active Learners', value: '0', change: '+0%', trend: 'up', icon: Users, gradient: STAT_GRADIENTS[0] },
    { label: 'Courses Completed', value: '0', change: '+0%', trend: 'up', icon: BookOpen, gradient: STAT_GRADIENTS[1] },
    { label: 'Avg. Study Time', value: '0h', change: '+0%', trend: 'up', icon: Clock, gradient: STAT_GRADIENTS[2] },
    { label: 'Completion Rate', value: '0%', change: '+0%', trend: 'up', icon: Target, gradient: STAT_GRADIENTS[3] },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/enterprise')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Enterprise Analytics 📊
              </h1>
              <p className="text-muted-foreground">Track team performance and engagement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-36">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={analyticsLoading}>
              <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
            <stat.icon className="w-5 h-5 md:w-6 md:h-6 mb-2 opacity-90" />
            <p className="text-xl md:text-2xl font-display font-bold">{stat.value}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-80">{stat.label}</p>
              <span className={`text-xs flex items-center gap-0.5 ${stat.trend === 'up' ? 'text-white' : 'text-white/70'}`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Completion Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Completion Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={completionTrends}>
                    <defs>
                      <linearGradient id="completionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="enrollmentsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="enrollments" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#enrollmentsGradient)"
                      name="Enrollments"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completions" 
                      stroke="hsl(var(--accent))" 
                      fill="url(#completionsGradient)"
                      name="Completions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Course Popularity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={displayCoursePopularity}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {displayCoursePopularity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Department Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentProgress.map((dept) => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: dept.color }}
                        />
                        <span className="font-medium text-foreground">{dept.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {dept.members} members
                        </Badge>
                      </div>
                      <span className="font-semibold text-foreground">{dept.progress}%</span>
                    </div>
                    <Progress value={dept.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Weekly Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="activeUsers" name="Active Users" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lessons" name="Lessons Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Study Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Study Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="studyMinutes" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
                    name="Study Minutes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentProgress.map((dept) => (
              <Card key={dept.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${dept.color}20` }}
                    >
                      <Users className="w-6 h-6" style={{ color: dept.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{dept.name}</h3>
                      <p className="text-sm text-muted-foreground">{dept.members} team members</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium text-foreground">{dept.progress}%</span>
                    </div>
                    <Progress value={dept.progress} className="h-2" />
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-2xl font-bold text-foreground">{Math.floor(dept.members * 0.7)}</p>
                        <p className="text-xs text-muted-foreground">Active this week</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{Math.floor(dept.progress * 0.4)}</p>
                        <p className="text-xs text-muted-foreground">Courses completed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-gold" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performersLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : topPerformers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No performer data yet</p>
              ) : (
                <div className="space-y-4">
                  {topPerformers.map((performer, index) => (
                    <div 
                      key={performer.id || performer.name}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gold' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{performer.name}</p>
                          <Badge variant="secondary" className="text-xs">{performer.department}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {performer.coursesCompleted} courses
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {performer.avgScore}% avg
                          </span>
                          <span className="flex items-center gap-1">
                            🔥 {performer.streak} day streak
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-accent">{performer.avgScore}%</p>
                        <p className="text-xs text-muted-foreground">Avg Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default EnterpriseAnalytics;
