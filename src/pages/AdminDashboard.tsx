import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAdminSkillSuggestions } from '@/hooks/useAdminSkillSuggestions';
import { useSubmittedCourses } from '@/hooks/useCourseApproval';
import CourseApprovalModal from '@/components/ceo/CourseApprovalModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  BookOpen,
  DollarSign,
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
  Vote,
  Lightbulb,
  Sparkles,
  Check,
  X,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { STAT_GRADIENTS } from '@/lib/theme';

type TabType = 'overview' | 'users' | 'courses' | 'approvals' | 'skills' | 'moderation' | 'reports';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useProfile();
  
  // Get active tab from URL query param, default to 'overview'
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';
  const [searchQuery, setSearchQuery] = useState('');
  const [courseApprovalOpen, setCourseApprovalOpen] = useState(false);

  const {
    suggestions: skillSuggestions,
    loading: skillsLoading,
    statusFilter,
    setStatusFilter,
    selectedIds,
    toggleSelect,
    selectAll,
    updateStatus,
    bulkUpdateStatus,
    deleteSuggestion,
    pendingCount,
    refresh: refreshSkills,
  } = useAdminSkillSuggestions();

  const { data: submittedCourses } = useSubmittedCourses();
  const pendingCourseCount = submittedCourses?.length || 0;

  const stats = [
    { label: 'Total Users', value: '12,458', change: '+12%', icon: Users, gradient: STAT_GRADIENTS[0] },
    { label: 'Active Courses', value: '156', change: '+8%', icon: BookOpen, gradient: STAT_GRADIENTS[1] },
    { label: 'Monthly Revenue', value: '$45.2K', change: '+23%', icon: DollarSign, gradient: STAT_GRADIENTS[2] },
    { label: 'Pending Courses', value: pendingCourseCount.toString(), change: 'awaiting', icon: FileText, gradient: STAT_GRADIENTS[3] },
  ];

  const tabLabels: Record<TabType, { label: string; description: string }> = {
    overview: { label: 'Dashboard', description: 'Platform overview & quick stats' },
    users: { label: 'Users', description: 'Manage platform users' },
    courses: { label: 'Courses', description: 'Review and manage courses' },
    approvals: { label: 'Approvals', description: 'Pending content approvals' },
    skills: { label: 'Skills', description: 'Review skill suggestions' },
    moderation: { label: 'Moderation', description: 'Review user reports' },
    reports: { label: 'Reports', description: 'System analytics & reports' },
  };

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

  const getSkillStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-gold/20 text-gold"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'voting':
        return <Badge variant="secondary" className="bg-accent/20 text-accent"><Vote className="w-3 h-3 mr-1" />Voting</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-success/20 text-success"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'in_development':
        return <Badge variant="secondary" className="bg-primary/20 text-primary"><Sparkles className="w-3 h-3 mr-1" />In Dev</Badge>;
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const filteredSkillSuggestions = skillSuggestions.filter(s => 
    searchQuery === '' || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 pb-24 lg:pb-0">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">
              {tabLabels[activeTab]?.label || 'Dashboard'}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {tabLabels[activeTab]?.description}
            </p>
          </div>
        </motion.div>

          {/* Stats Grid - Only show on overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    <span className="text-[10px] md:text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-xl md:text-2xl font-display font-bold">{stat.value}</p>
                  <p className="text-xs opacity-80">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

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
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin?tab=users')}>View All</Button>
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
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin?tab=approvals')}>View All</Button>
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
              <div className="p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-10" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                    <Filter className="w-4 h-4 sm:mr-2" /> 
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                  <Button size="sm" className="flex-1 sm:flex-initial">
                    <UserPlus className="w-4 h-4 sm:mr-2" /> 
                    <span className="hidden sm:inline">Add User</span>
                  </Button>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-border md:hidden">
                {recentUsers.map((user) => (
                  <div key={user.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-accent/10 text-accent">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground truncate">{user.name}</p>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded">{user.role}</span>
                          <span>{user.joinDate}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="overflow-x-auto hidden md:block">
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
              {/* Course Approvals Section */}
              <div className="bg-card rounded-xl border border-border p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">Course Submissions</h3>
                      <p className="text-sm text-muted-foreground">Review and approve teacher-submitted courses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingCourseCount > 0 && (
                      <Badge className="bg-gold/20 text-gold">{pendingCourseCount} pending</Badge>
                    )}
                    <Button onClick={() => setCourseApprovalOpen(true)}>
                      Review Courses
                    </Button>
                  </div>
                </div>
                
                {submittedCourses && submittedCourses.length > 0 ? (
                  <div className="space-y-2">
                    {submittedCourses.slice(0, 3).map((course) => (
                      <div 
                        key={course.id} 
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setCourseApprovalOpen(true)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground">
                          📚
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            by {course.instructor?.full_name || 'Unknown'} • {course.category}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-gold/10 text-gold">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    ))}
                    {submittedCourses.length > 3 && (
                      <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => setCourseApprovalOpen(true)}
                      >
                        View all {submittedCourses.length} submissions
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All courses reviewed!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Skills Suggestions Tab */}
          {activeTab === 'skills' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header & Filters */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1">
                    <h2 className="font-display font-semibold text-foreground mb-1">Skill Suggestions</h2>
                    <p className="text-sm text-muted-foreground">
                      Review and manage community skill suggestions
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search..." 
                        className="pl-10 w-full sm:w-40"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="flex-1 sm:w-28">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="voting">Voting</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="in_development">In Dev</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={refreshSkills} className="shrink-0">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bulk Actions */}
{selectedIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.length} selected
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-accent border-accent hover:bg-accent/10 flex-1 sm:flex-initial"
                        onClick={() => bulkUpdateStatus(selectedIds, 'voting')}
                      >
                        <Vote className="w-4 h-4 mr-1" /> 
                        <span className="hidden xs:inline">Open for</span> Voting
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive border-destructive hover:bg-destructive/10 flex-1 sm:flex-initial"
                        onClick={() => bulkUpdateStatus(selectedIds, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground sm:ml-2">
                      💡 CEO approves after voting
                    </p>
                  </div>
                )}
              </div>

              {/* Suggestions List */}
              {skillsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredSkillSuggestions.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                    No Suggestions Found
                  </h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'pending' 
                      ? 'No pending suggestions to review.'
                      : 'No suggestions match your filters.'}
                  </p>
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  {/* Table Header */}
                  <div className="p-4 border-b border-border bg-muted/50 hidden md:flex items-center gap-4">
                    <Checkbox 
                      checked={selectedIds.length === filteredSkillSuggestions.length && filteredSkillSuggestions.length > 0}
                      onCheckedChange={selectAll}
                    />
                    <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                      <span className="col-span-4">Suggestion</span>
                      <span className="col-span-2">Category</span>
                      <span className="col-span-2">Submitted By</span>
                      <span className="col-span-1">Votes</span>
                      <span className="col-span-1">Status</span>
                      <span className="col-span-2 text-right">Actions</span>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-border">
                    {filteredSkillSuggestions.map((suggestion) => (
                      <div 
                        key={suggestion.id} 
                        className={`p-4 hover:bg-muted/30 transition-colors ${
                          selectedIds.includes(suggestion.id) ? 'bg-accent/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox 
                            checked={selectedIds.includes(suggestion.id)}
                            onCheckedChange={() => toggleSelect(suggestion.id)}
                          />
                          
                          {/* Mobile Layout */}
                          <div className="flex-1 md:hidden">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                {suggestion.author?.avatar_url && (
                                  <AvatarImage src={suggestion.author.avatar_url} />
                                )}
                                <AvatarFallback className="bg-accent/10 text-accent text-xs">
                                  {suggestion.author?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium text-foreground">{suggestion.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  by {suggestion.author?.full_name || 'Unknown'} • {formatTime(suggestion.created_at)}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
                              {getSkillStatusBadge(suggestion.status)}
                              <span className="text-xs text-muted-foreground">
                                +{suggestion.votes_up} / -{suggestion.votes_down}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1">
                                    Actions <ChevronDown className="w-4 h-4 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => updateStatus(suggestion.id, 'voting')}>
                                    <Vote className="w-4 h-4 mr-2" /> Open for Voting
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatus(suggestion.id, 'approved')}>
                                    <Check className="w-4 h-4 mr-2" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatus(suggestion.id, 'in_development')}>
                                    <Sparkles className="w-4 h-4 mr-2" /> In Development
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateStatus(suggestion.id, 'rejected')}>
                                    <X className="w-4 h-4 mr-2" /> Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => deleteSuggestion(suggestion.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="flex-1 hidden md:grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-4">
                              <h4 className="font-medium text-foreground">{suggestion.name}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-1">{suggestion.description}</p>
                            </div>
                            <div className="col-span-2">
                              <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  {suggestion.author?.avatar_url && (
                                    <AvatarImage src={suggestion.author.avatar_url} />
                                  )}
                                  <AvatarFallback className="bg-accent/10 text-accent text-xs">
                                    {suggestion.author?.full_name?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm text-foreground truncate">{suggestion.author?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{formatTime(suggestion.created_at)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-1">
                              <span className="text-sm text-success">+{suggestion.votes_up}</span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <span className="text-sm text-destructive">-{suggestion.votes_down}</span>
                            </div>
                            <div className="col-span-1">
                              {getSkillStatusBadge(suggestion.status)}
                            </div>
                            <div className="col-span-2 flex justify-end gap-1">
{suggestion.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-accent hover:text-accent hover:bg-accent/10"
                                    onClick={() => updateStatus(suggestion.id, 'voting')}
                                    title="Open for Voting"
                                  >
                                    <Vote className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => updateStatus(suggestion.id, 'rejected')}
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => updateStatus(suggestion.id, 'voting')}>
                                    <Vote className="w-4 h-4 mr-2" /> Open for Voting
                                  </DropdownMenuItem>
                                  {/* Only show approve for CEO - admins can only send to voting */}
                                  <DropdownMenuItem disabled className="text-muted-foreground">
                                    <Check className="w-4 h-4 mr-2" /> Approve (CEO only)
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateStatus(suggestion.id, 'rejected')}>
                                    <X className="w-4 h-4 mr-2" /> Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => deleteSuggestion(suggestion.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-foreground">User Reports</h2>
                    <p className="text-sm text-muted-foreground">Review and take action on reported content</p>
                  </div>
                </div>
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-success/50 mx-auto mb-4" />
                  <h3 className="text-lg font-display font-semibold text-foreground mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">No pending reports to review at this time.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">User Growth</h3>
                  <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Chart coming soon</p>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Course Enrollments</h3>
                  <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Chart coming soon</p>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Revenue Overview</h3>
                  <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Chart coming soon</p>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Active Sessions</h3>
                  <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground text-sm">Chart coming soon</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Course Approval Modal */}
        <CourseApprovalModal 
          open={courseApprovalOpen} 
          onOpenChange={setCourseApprovalOpen} 
        />
    </DashboardLayout>
  );
};

export default AdminDashboard;
