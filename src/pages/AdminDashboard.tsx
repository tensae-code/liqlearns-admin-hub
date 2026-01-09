import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  FileText,
  BarChart3,
  Settings,
  Shield,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'approvals'>('overview');

  const stats = [
    { label: 'Total Users', value: '12,458', change: '+12%', icon: Users, color: 'text-accent', bgColor: 'bg-accent/10' },
    { label: 'Active Courses', value: '156', change: '+8%', icon: BookOpen, color: 'text-gold', bgColor: 'bg-gold/10' },
    { label: 'Monthly Revenue', value: '$45,280', change: '+23%', icon: DollarSign, color: 'text-success', bgColor: 'bg-success/10' },
    { label: 'Engagement Rate', value: '78%', change: '+5%', icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
  ];

  const recentUsers = [
    { id: 1, name: 'Sara T.', email: 'sara@email.com', role: 'Student', status: 'active', joinDate: '2 hours ago' },
    { id: 2, name: 'Dawit B.', email: 'dawit@email.com', role: 'Teacher', status: 'pending', joinDate: '5 hours ago' },
    { id: 3, name: 'Tigist K.', email: 'tigist@email.com', role: 'Student', status: 'active', joinDate: '1 day ago' },
    { id: 4, name: 'Yonas G.', email: 'yonas@email.com', role: 'Student', status: 'inactive', joinDate: '2 days ago' },
  ];

  const pendingApprovals = [
    { id: 1, title: 'Tigrinya for Beginners', author: 'Dr. Meron L.', type: 'Course', submitted: '2 hours ago' },
    { id: 2, title: 'Ethiopian Coffee Culture', author: 'Bereket F.', type: 'Course', submitted: '5 hours ago' },
    { id: 3, title: 'Amharic Flashcard Set', author: 'Hanna A.', type: 'Product', submitted: '1 day ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success bg-success/10';
      case 'pending': return 'text-gold bg-gold/10';
      case 'inactive': return 'text-muted-foreground bg-muted';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your platform and users</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" /> Reports
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-card rounded-xl p-5 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {(['overview', 'users', 'courses', 'approvals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <motion.div
              className="bg-card rounded-xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-semibold text-foreground">Recent Users</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="divide-y divide-border">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-4">
                    <Avatar>
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Pending Approvals */}
            <motion.div
              className="bg-card rounded-xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-semibold text-foreground">Pending Approvals</h2>
                  <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                    {pendingApprovals.length}
                  </span>
                </div>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="divide-y divide-border">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      {item.type === 'Course' ? (
                        <BookOpen className="w-5 h-5 text-gold" />
                      ) : (
                        <FileText className="w-5 h-5 text-gold" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {item.author} • {item.submitted}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-success hover:text-success hover:bg-success/10">
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'users' && (
          <motion.div
            className="bg-card rounded-xl border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Search & Filters */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-10" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" /> Add User
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-accent/10 text-accent">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">{user.role}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{user.joinDate}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'courses' && (
          <motion.div
            className="bg-card rounded-xl border border-border p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              Course Management
            </h3>
            <p className="text-muted-foreground">
              View and manage all courses on the platform
            </p>
          </motion.div>
        )}

        {activeTab === 'approvals' && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {pendingApprovals.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                    {item.type === 'Course' ? (
                      <BookOpen className="w-6 h-6 text-gold" />
                    ) : (
                      <FileText className="w-6 h-6 text-gold" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                        {item.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.submitted}</span>
                    </div>
                    <h3 className="text-lg font-display font-semibold text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground">by {item.author}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" /> Preview
                    </Button>
                    <Button variant="outline" size="sm" className="text-success border-success hover:bg-success/10">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
