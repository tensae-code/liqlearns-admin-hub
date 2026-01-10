import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  DollarSign,
  Plus,
  ChevronRight,
  Star,
  Clock,
  Play,
  FileText,
  Edit,
  Eye,
  MoreVertical,
  BarChart3,
  MessageSquare,
  Award,
  Settings,
  Calendar
} from 'lucide-react';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'earnings'>('overview');

  const stats = [
    { label: 'Total Students', value: '1,248', icon: Users, gradient: 'from-blue-500 to-cyan-400', change: '+12%' },
    { label: 'Active Courses', value: '8', icon: BookOpen, gradient: 'from-purple-500 to-pink-400' },
    { label: 'Total Revenue', value: '45.2K', icon: DollarSign, gradient: 'from-emerald-500 to-teal-400', change: '+23%' },
    { label: 'Avg. Rating', value: '4.8', icon: Star, gradient: 'from-orange-500 to-amber-400' },
  ];

  const courses = [
    { id: '1', title: 'Amharic for Beginners', students: 450, rating: 4.9, revenue: 12500, status: 'published', lessons: 24 },
    { id: '2', title: 'Ethiopian History', students: 320, rating: 4.8, revenue: 9800, status: 'published', lessons: 18 },
    { id: '3', title: 'Business Amharic', students: 180, rating: 4.7, revenue: 8200, status: 'published', lessons: 20 },
    { id: '4', title: 'Kids Amharic Fun', students: 298, rating: 4.9, revenue: 14700, status: 'published', lessons: 30 },
    { id: '5', title: 'Advanced Grammar', students: 0, rating: 0, revenue: 0, status: 'draft', lessons: 12 },
  ];

  const recentStudents = [
    { name: 'Alemayehu M.', course: 'Amharic for Beginners', progress: 78, joinedAt: '2 hours ago' },
    { name: 'Sara T.', course: 'Ethiopian History', progress: 45, joinedAt: '5 hours ago' },
    { name: 'Dawit B.', course: 'Business Amharic', progress: 92, joinedAt: '1 day ago' },
    { name: 'Tigist K.', course: 'Kids Amharic Fun', progress: 34, joinedAt: '2 days ago' },
  ];

  const recentReviews = [
    { student: 'Yonas G.', course: 'Amharic for Beginners', rating: 5, comment: 'Excellent course! Very clear explanations.', date: '1 hour ago' },
    { student: 'Hanna A.', course: 'Ethiopian History', rating: 5, comment: 'Learned so much about our rich culture!', date: '3 hours ago' },
    { student: 'Bereket F.', course: 'Business Amharic', rating: 4, comment: 'Great content, very practical.', date: '1 day ago' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-4 md:mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-display font-bold text-foreground mb-1">
              Teacher Dashboard 👨‍🏫
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage courses & students</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button className="gap-2 flex-1 sm:flex-none" onClick={() => navigate('/teacher')}>
              <Plus className="w-4 h-4" />
              Create Course
            </Button>
            <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => navigate('/events')}>
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Colorful Gradient Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
              {stat.change && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{stat.change}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['overview', 'courses', 'students', 'earnings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Courses */}
          <motion.div
            className="lg:col-span-2 bg-card rounded-xl border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">My Courses</h2>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {courses.slice(0, 4).map((course) => (
                <div key={course.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{course.title}</h3>
                      <Badge className={course.status === 'published' ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                        {course.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {course.students}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {course.lessons} lessons
                      </span>
                      {course.rating > 0 && (
                        <span className="flex items-center gap-1 text-gold">
                          <Star className="w-3 h-3 fill-gold" /> {course.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success">{course.revenue.toLocaleString()} ETB</p>
                    <div className="flex gap-1 mt-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Reviews */}
          <motion.div
            className="bg-card rounded-xl border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="p-4 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              <h2 className="font-display font-semibold text-foreground">Recent Reviews</h2>
            </div>
            <div className="divide-y divide-border">
              {recentReviews.map((review, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{review.student}</p>
                    <div className="flex items-center gap-1 text-gold">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-gold" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                  <p className="text-xs text-muted-foreground">{review.course} • {review.date}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'courses' && (
        <motion.div
          className="bg-card rounded-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">All Courses</h2>
            <Input placeholder="Search courses..." className="w-64" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                  <th className="p-4 font-medium">Course</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Students</th>
                  <th className="p-4 font-medium">Rating</th>
                  <th className="p-4 font-medium">Revenue</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground">{course.lessons} lessons</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={course.status === 'published' ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                        {course.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-foreground">{course.students}</td>
                    <td className="p-4">
                      {course.rating > 0 ? (
                        <span className="flex items-center gap-1 text-gold">
                          <Star className="w-4 h-4 fill-gold" /> {course.rating}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-success">{course.revenue.toLocaleString()} ETB</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
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

      {activeTab === 'students' && (
        <motion.div
          className="bg-card rounded-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Recent Students</h2>
            <Input placeholder="Search students..." className="w-64" />
          </div>
          <div className="divide-y divide-border">
            {recentStudents.map((student, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.course}</p>
                </div>
                <div className="w-32">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground">{student.progress}%</span>
                  </div>
                  <Progress value={student.progress} className="h-2" />
                </div>
                <div className="text-sm text-muted-foreground">{student.joinedAt}</div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'earnings' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            className="bg-card rounded-xl border border-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-display font-semibold text-foreground mb-4">Earnings Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success/5 rounded-lg border border-success/20">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-display font-bold text-success">32,500 ETB</p>
                </div>
                <Button>Withdraw</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold text-foreground">8,200 ETB</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Month</p>
                  <p className="text-xl font-bold text-foreground">6,800 ETB</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-card rounded-xl border border-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-display font-semibold text-foreground mb-4">Top Earning Courses</h2>
            <div className="space-y-3">
              {courses.filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 4).map((course, i) => (
                <div key={course.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-gold/10 text-gold text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.students} students</p>
                  </div>
                  <p className="font-bold text-success">{course.revenue.toLocaleString()} ETB</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherDashboard;
