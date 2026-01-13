import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CreateCourseModal from '@/components/teacher/CreateCourseModal';
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
  Calendar,
  X,
  Send,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

// Define the four gradients used across the app
const STAT_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400'
];

interface Student {
  id: string;
  name: string;
  avatar?: string;
  course: string;
  progress: number;
  joinedAt: string;
  email: string;
  lastActive: string;
  quizScore: number;
  assignmentsCompleted: number;
  totalAssignments: number;
}

interface Review {
  id: string;
  studentId: string;
  studentName: string;
  parentName?: string;
  rating: number;
  comment: string;
  type: 'student' | 'parent';
  date: string;
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'earnings'>('overview');
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);

  const stats = [
    { label: 'Total Students', value: '1,248', icon: Users, gradient: STAT_GRADIENTS[0], change: '+12%' },
    { label: 'Active Courses', value: '8', icon: BookOpen, gradient: STAT_GRADIENTS[1] },
    { label: 'Total Revenue', value: '45.2K', icon: DollarSign, gradient: STAT_GRADIENTS[2], change: '+23%' },
    { label: 'Avg. Rating', value: '4.8', icon: Star, gradient: STAT_GRADIENTS[3] },
  ];

  const courses = [
    { id: '1', title: 'Amharic for Beginners', students: 450, rating: 4.9, revenue: 12500, status: 'published', lessons: 24 },
    { id: '2', title: 'Ethiopian History', students: 320, rating: 4.8, revenue: 9800, status: 'published', lessons: 18 },
    { id: '3', title: 'Business Amharic', students: 180, rating: 4.7, revenue: 8200, status: 'published', lessons: 20 },
    { id: '4', title: 'Kids Amharic Fun', students: 298, rating: 4.9, revenue: 14700, status: 'published', lessons: 30 },
    { id: '5', title: 'Advanced Grammar', students: 0, rating: 0, revenue: 0, status: 'draft', lessons: 12 },
  ];

  const recentStudents: Student[] = [
    { id: '1', name: 'Alemayehu M.', course: 'Amharic for Beginners', progress: 78, joinedAt: '2 hours ago', email: 'alemayehu@example.com', lastActive: '5 min ago', quizScore: 85, assignmentsCompleted: 12, totalAssignments: 15 },
    { id: '2', name: 'Sara T.', course: 'Ethiopian History', progress: 45, joinedAt: '5 hours ago', email: 'sara@example.com', lastActive: '1 hour ago', quizScore: 72, assignmentsCompleted: 5, totalAssignments: 10 },
    { id: '3', name: 'Dawit B.', course: 'Business Amharic', progress: 92, joinedAt: '1 day ago', email: 'dawit@example.com', lastActive: '2 hours ago', quizScore: 95, assignmentsCompleted: 18, totalAssignments: 18 },
    { id: '4', name: 'Tigist K.', course: 'Kids Amharic Fun', progress: 34, joinedAt: '2 days ago', email: 'tigist@example.com', lastActive: '1 day ago', quizScore: 60, assignmentsCompleted: 3, totalAssignments: 12 },
  ];

  const recentReviews: Review[] = [
    { id: '1', studentId: '1', studentName: 'Yonas G.', rating: 5, comment: 'Excellent course! Very clear explanations.', type: 'student', date: '1 hour ago' },
    { id: '2', studentId: '2', studentName: 'Hanna A.', parentName: 'Mrs. Abebe', rating: 5, comment: 'My child loves this course!', type: 'parent', date: '3 hours ago' },
    { id: '3', studentId: '3', studentName: 'Bereket F.', rating: 4, comment: 'Great content, very practical.', type: 'student', date: '1 day ago' },
  ];

  const handleOpenReview = (student: Student) => {
    setSelectedStudent(student);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
      toast.error('Please enter a review comment');
      return;
    }
    toast.success(`Review sent to ${selectedStudent?.name}`, {
      description: 'The student and their parent (if applicable) will receive this feedback.'
    });
    setReviewModalOpen(false);
    setReviewText('');
    setReviewRating(5);
    setSelectedStudent(null);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentDetailOpen(true);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-success';
    if (progress >= 50) return 'text-gold';
    return 'text-destructive';
  };

  const tabs = ['overview', 'courses', 'students', 'earnings'] as const;

  return (
    <>
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
              <Button className="gap-2 flex-1 sm:flex-none" onClick={() => setCreateCourseOpen(true)}>
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
              className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg cursor-pointer hover:scale-[1.02] transition-transform`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => setActiveTab(tabs[i] || 'overview')}
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
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? `bg-gradient-to-r ${STAT_GRADIENTS[i]} text-white shadow-md`
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab === 'overview' && 'Dashboard'}
              {tab === 'courses' && 'My Courses'}
              {tab === 'students' && 'Students'}
              {tab === 'earnings' && 'Earnings'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-3 gap-6"
            >
              {/* My Courses */}
              <motion.div
                className="lg:col-span-2 bg-card rounded-xl border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-display font-semibold text-foreground">My Courses</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('courses')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {courses.slice(0, 4).map((course) => (
                    <div key={course.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${STAT_GRADIENTS[parseInt(course.id) % 4]} flex items-center justify-center`}>
                        <BookOpen className="w-6 h-6 text-white" />
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

              {/* Recent Reviews & Quick Actions */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {/* Quick Actions */}
                <div className={`bg-gradient-to-br ${STAT_GRADIENTS[1]} rounded-xl p-4 text-white`}>
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" /> Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="secondary" 
                      className="bg-white/20 hover:bg-white/30 text-white border-0 h-auto py-3 flex-col gap-1"
                      onClick={() => setActiveTab('students')}
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-xs">Review Student</span>
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="bg-white/20 hover:bg-white/30 text-white border-0 h-auto py-3 flex-col gap-1"
                      onClick={() => setCreateCourseOpen(true)}
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-xs">New Course</span>
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="bg-white/20 hover:bg-white/30 text-white border-0 h-auto py-3 flex-col gap-1"
                      onClick={() => setActiveTab('earnings')}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span className="text-xs">Earnings</span>
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="bg-white/20 hover:bg-white/30 text-white border-0 h-auto py-3 flex-col gap-1"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-xs">Analytics</span>
                    </Button>
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="bg-card rounded-xl border border-border">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-accent" />
                    <h2 className="font-display font-semibold text-foreground">Recent Reviews</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {recentReviews.map((review, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{review.studentName}</p>
                            <Badge variant="outline" className="text-xs">
                              {review.type === 'parent' ? 'Parent' : 'Student'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-gold">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-gold" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card rounded-xl border border-border"
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
                    {courses.map((course, i) => (
                      <tr key={course.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${STAT_GRADIENTS[i % 4]} flex items-center justify-center`}>
                              <BookOpen className="w-5 h-5 text-white" />
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
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Student Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[0]} text-white`}>
                  <Users className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">1,248</p>
                  <p className="text-xs opacity-80">Total Students</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[1]} text-white`}>
                  <CheckCircle className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">892</p>
                  <p className="text-xs opacity-80">Active This Week</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[2]} text-white`}>
                  <Trophy className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs opacity-80">Course Completed</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[3]} text-white`}>
                  <AlertTriangle className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-xs opacity-80">Need Attention</p>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-card rounded-xl border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-display font-semibold text-foreground">All Students</h2>
                  <Input placeholder="Search students..." className="w-64" />
                </div>
                <div className="divide-y divide-border">
                  {recentStudents.map((student, i) => (
                    <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[i % 4]} flex items-center justify-center text-white font-semibold`}>
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.course}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-xs text-muted-foreground">Quiz Score</p>
                        <p className={`font-medium ${getProgressColor(student.quizScore)}`}>{student.quizScore}%</p>
                      </div>
                      <div className="w-24 md:w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={getProgressColor(student.progress)}>{student.progress}%</span>
                        </div>
                        <Progress value={student.progress} className="h-2" />
                      </div>
                      <div className="hidden sm:block text-sm text-muted-foreground">{student.lastActive}</div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewStudent(student)}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={() => handleOpenReview(student)}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden sm:inline">Review</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              <motion.div
                className="bg-card rounded-xl border border-border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="font-display font-semibold text-foreground mb-4">Earnings Summary</h2>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 bg-gradient-to-br ${STAT_GRADIENTS[2]} rounded-lg text-white`}>
                    <div>
                      <p className="text-sm opacity-80">Available Balance</p>
                      <p className="text-2xl font-display font-bold">32,500 ETB</p>
                    </div>
                    <Button className="bg-white/20 hover:bg-white/30 text-white border-0">Withdraw</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 bg-gradient-to-br ${STAT_GRADIENTS[0]} rounded-lg text-white`}>
                      <p className="text-sm opacity-80">This Month</p>
                      <p className="text-xl font-bold">8,200 ETB</p>
                    </div>
                    <div className={`p-4 bg-gradient-to-br ${STAT_GRADIENTS[3]} rounded-lg text-white`}>
                      <p className="text-sm opacity-80">Last Month</p>
                      <p className="text-xl font-bold">6,800 ETB</p>
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
                    <div key={course.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[i % 4]} text-white text-sm font-bold flex items-center justify-center`}>
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
            </motion.div>
          )}
        </AnimatePresence>
      </DashboardLayout>

      {/* Create Course Modal */}
      <CreateCourseModal open={createCourseOpen} onOpenChange={setCreateCourseOpen} />

      {/* Review Student Modal */}
      <AnimatePresence>
        {reviewModalOpen && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setReviewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg">Review Student</h3>
                <Button variant="ghost" size="icon" onClick={() => setReviewModalOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[0]} flex items-center justify-center text-white font-bold`}>
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{selectedStudent.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.course}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewRating(rating)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-6 h-6 ${rating <= reviewRating ? 'text-gold fill-gold' : 'text-muted-foreground'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Feedback</label>
                <Textarea
                  placeholder="Write your feedback for this student..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setReviewModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSubmitReview}>
                  <Send className="w-4 h-4" /> Send Review
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {studentDetailOpen && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setStudentDetailOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-lg">Student Performance</h3>
                <Button variant="ghost" size="icon" onClick={() => setStudentDetailOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Student Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[0]} flex items-center justify-center text-white text-2xl font-bold`}>
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="font-display font-bold text-xl">{selectedStudent.name}</p>
                  <p className="text-muted-foreground">{selectedStudent.course}</p>
                  <p className="text-sm text-muted-foreground">Last active: {selectedStudent.lastActive}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[0]} text-white`}>
                  <Target className="w-4 h-4 mb-1 opacity-80" />
                  <p className="text-xl font-bold">{selectedStudent.progress}%</p>
                  <p className="text-xs opacity-80">Course Progress</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[1]} text-white`}>
                  <Award className="w-4 h-4 mb-1 opacity-80" />
                  <p className="text-xl font-bold">{selectedStudent.quizScore}%</p>
                  <p className="text-xs opacity-80">Quiz Average</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[2]} text-white`}>
                  <CheckCircle className="w-4 h-4 mb-1 opacity-80" />
                  <p className="text-xl font-bold">{selectedStudent.assignmentsCompleted}/{selectedStudent.totalAssignments}</p>
                  <p className="text-xs opacity-80">Assignments</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[3]} text-white`}>
                  <Clock className="w-4 h-4 mb-1 opacity-80" />
                  <p className="text-xl font-bold">{selectedStudent.joinedAt}</p>
                  <p className="text-xs opacity-80">Joined</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStudentDetailOpen(false)}>
                  Close
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => {
                    setStudentDetailOpen(false);
                    handleOpenReview(selectedStudent);
                  }}
                >
                  <MessageSquare className="w-4 h-4" /> Send Review
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TeacherDashboard;
