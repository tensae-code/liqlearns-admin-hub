import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { STAT_GRADIENTS } from '@/lib/theme';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  BookOpen,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Globe
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CEOAnalytics = () => {
  const navigate = useNavigate();

  const revenueData = [
    { month: 'Jan', revenue: 120000, users: 8500 },
    { month: 'Feb', revenue: 145000, users: 12000 },
    { month: 'Mar', revenue: 180000, users: 18500 },
    { month: 'Apr', revenue: 195000, users: 22000 },
    { month: 'May', revenue: 220000, users: 28000 },
    { month: 'Jun', revenue: 280000, users: 35000 },
    { month: 'Jul', revenue: 310000, users: 42000 },
  ];

  const coursePerformance = [
    { name: 'Amharic 101', students: 4500, completion: 78 },
    { name: 'Business English', students: 3200, completion: 85 },
    { name: 'Math Foundations', students: 2800, completion: 72 },
    { name: 'Science Basics', students: 2100, completion: 88 },
    { name: 'History of Ethiopia', students: 1800, completion: 91 },
  ];

  const userDistribution = [
    { name: 'Students', value: 38000, color: 'hsl(var(--primary))' },
    { name: 'Teachers', value: 450, color: 'hsl(var(--accent))' },
    { name: 'Parents', value: 6500, color: 'hsl(var(--success))' },
    { name: 'Enterprise', value: 330, color: 'hsl(var(--gold))' },
  ];

  const metrics = [
    { label: 'Monthly Active Users', value: '45.2K', change: '+12.5%', isUp: true, icon: Users },
    { label: 'Revenue This Month', value: '$310K', change: '+28.3%', isUp: true, icon: DollarSign },
    { label: 'Course Completion', value: '78%', change: '+5.2%', isUp: true, icon: BookOpen },
    { label: 'User Retention', value: '92%', change: '-1.3%', isUp: false, icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ceo')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">Comprehensive platform analytics and insights</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </Button>
            <Button size="sm">
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[i]} text-white shadow-lg`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
              <div className="flex items-center justify-between mb-2">
                <metric.icon className="w-5 h-5 md:w-6 md:h-6 opacity-90" />
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  {metric.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {metric.change}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-display font-bold">{metric.value}</p>
              <p className="text-xs opacity-80">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue & Users Chart */}
          <motion.div
            className="bg-card border border-border rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-foreground mb-4">Revenue & User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="users" stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* User Distribution */}
          <motion.div
            className="bg-card border border-border rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-semibold text-foreground mb-4">User Distribution</h3>
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {userDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Course Performance */}
        <motion.div
          className="bg-card border border-border rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-foreground mb-4">Top Course Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={coursePerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="students" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Global Reach */}
        <motion.div
          className="bg-gradient-to-br from-primary/10 to-accent/10 border border-border rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-foreground">Global Reach</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">45</p>
              <p className="text-sm text-muted-foreground">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">12</p>
              <p className="text-sm text-muted-foreground">Languages</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">320</p>
              <p className="text-sm text-muted-foreground">Courses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">45K+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default CEOAnalytics;
