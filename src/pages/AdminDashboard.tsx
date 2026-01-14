import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAdminSkillSuggestions } from '@/hooks/useAdminSkillSuggestions';
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
  AlertTriangle,
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'approvals' | 'skills'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

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

  const stats = [
    { label: 'Total Users', value: '12,458', change: '+12%', icon: Users, gradient: STAT_GRADIENTS[0] },
    { label: 'Active Courses', value: '156', change: '+8%', icon: BookOpen, gradient: STAT_GRADIENTS[1] },
    { label: 'Monthly Revenue', value: '$45.2K', change: '+23%', icon: DollarSign, gradient: STAT_GRADIENTS[2] },
    { label: 'Skill Suggestions', value: pendingCount.toString(), change: 'pending', icon: Lightbulb, gradient: STAT_GRADIENTS[3] },
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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage platform & users</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => navigate('/admin')}>
              <BarChart3 className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Reports</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none" onClick={() => navigate('/courses')}>
              <BookOpen className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Courses</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid - Colorful Gradient Cards */}
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

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit overflow-x-auto">
          {(['overview', 'users', 'courses', 'approvals', 'skills'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {tab === 'skills' && pendingCount > 0 && (
                <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
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
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search suggestions..." 
                      className="pl-10 w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="voting">Voting</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="in_development">In Development</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={refreshSkills}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selected
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-accent border-accent hover:bg-accent/10"
                      onClick={() => bulkUpdateStatus(selectedIds, 'voting')}
                    >
                      <Vote className="w-4 h-4 mr-1" /> Open for Voting
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-success border-success hover:bg-success/10"
                      onClick={() => bulkUpdateStatus(selectedIds, 'approved')}
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => bulkUpdateStatus(selectedIds, 'rejected')}
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
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
                                  className="text-success hover:text-success hover:bg-success/10"
                                  onClick={() => updateStatus(suggestion.id, 'approved')}
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
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
                                <DropdownMenuItem onClick={() => updateStatus(suggestion.id, 'approved')}>
                                  <Check className="w-4 h-4 mr-2" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(suggestion.id, 'in_development')}>
                                  <Sparkles className="w-4 h-4 mr-2" /> Mark In Development
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
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
