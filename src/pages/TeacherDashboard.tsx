import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameTemplateCatalog from '@/components/teacher/GameTemplateCatalog';
import SkillContentEditor from '@/components/teacher/SkillContentEditor';
import NewsFeedWidget from '@/components/dashboard/NewsFeedWidget';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useTeacherCourses, useSubmitCourseForReview, useRequestDifferentReviewer } from '@/hooks/useCourses';
import { useTeacherStudents, TeacherStudent } from '@/hooks/useTeacherStudents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CreateCourseModal from '@/components/teacher/CreateCourseModal';
import CreateAssignmentModal from '@/components/teacher/CreateAssignmentModal';
import SubmissionReviewModal from '@/components/teacher/SubmissionReviewModal';
import StudentSubmissionHistory from '@/components/teacher/StudentSubmissionHistory';
import ProfilePreviewModal from '@/components/messaging/ProfilePreviewModal';
import CourseReviewFeedback from '@/components/teacher/CourseReviewFeedback';
import { supabase } from '@/integrations/supabase/client';
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
  SendHorizonal,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Target,
  Loader2,
  History,
  RefreshCw,
  UserCircle,
  Gamepad2
} from 'lucide-react';
import { toast } from 'sonner';

import { STAT_GRADIENTS } from '@/lib/theme';

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

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  status: 'active' | 'past_due' | 'graded';
}

interface Submission {
  id: string;
  studentName: string;
  studentAvatar?: string;
  assignmentTitle: string;
  submittedAt: string;
  grade?: string;
  feedback?: string;
  status: 'pending' | 'graded' | 'late';
  fileUrl?: string;
  fileType?: 'text' | 'pdf' | 'audio' | 'video' | 'image';
  content?: string;
  gradingType?: 'pass_fail' | 'letter_grade';
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useProfile();
  const { data: teacherCourses = [], isLoading: coursesLoading } = useTeacherCourses();
  const { data: teacherStudents = [], isLoading: studentsLoading } = useTeacherStudents();
  const submitForReview = useSubmitCourseForReview();
  const requestDifferentReviewer = useRequestDifferentReviewer();
  
  // Get active tab from URL query param, default to 'overview'
  const activeTab = (searchParams.get('tab') as 'overview' | 'courses' | 'students' | 'assignments' | 'games' | 'skills' | 'earnings') || 'overview';
  
  const setActiveTab = (tab: 'overview' | 'courses' | 'students' | 'assignments' | 'games' | 'skills' | 'earnings') => {
    setSearchParams({ tab });
  };
  
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<{
    id: string;
    title: string;
    description?: string;
    category: string;
    difficulty: string;
    price?: number;
    estimated_duration?: number;
    submission_status?: string;
    thumbnail_url?: string;
    gallery_images?: string[];
  } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submissionReviewOpen, setSubmissionReviewOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentGradingType, setCurrentGradingType] = useState<'pass_fail' | 'letter_grade'>('pass_fail');
  const [submissionHistoryOpen, setSubmissionHistoryOpen] = useState(false);
  const [studentForHistory, setStudentForHistory] = useState<{id: string; name: string; email: string; avatar?: string; course: string} | null>(null);
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
  const [selectedProfileForPreview, setSelectedProfileForPreview] = useState<{
    id: string;
    user_id: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    xp_points?: number;
    current_streak?: number;
  } | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackCourse, setFeedbackCourse] = useState<{
    id: string;
    title: string;
    rejection_reason?: string | null;
  } | null>(null);
  const [escalationCourseId, setEscalationCourseId] = useState<string | null>(null);

  const getStudentSubmissions = (studentId: string) => [
    { id: '1', assignmentTitle: 'Week 1: Basic Greetings Essay', assignmentId: 'a1', submittedAt: '2 days ago', fileType: 'text' as const, content: 'Sample text...', status: 'graded' as const, grade: 'Good Job! 🎉', feedback: 'Excellent work! Great use of vocabulary.' },
    { id: '2', assignmentTitle: 'Pronunciation Practice', assignmentId: 'a2', submittedAt: '5 days ago', fileType: 'audio' as const, status: 'graded' as const, grade: 'B+', feedback: 'Good pronunciation, work on intonation.' },
    { id: '3', assignmentTitle: 'Historical Analysis Report', assignmentId: 'a3', submittedAt: '1 week ago', fileType: 'pdf' as const, status: 'resubmit_requested' as const, resubmitReason: 'Missing bibliography section. Please add references.' },
    { id: '4', assignmentTitle: 'Business Letter Writing', assignmentId: 'a4', submittedAt: '1 hour ago', fileType: 'text' as const, content: 'Dear Sir...', status: 'pending' as const },
  ];

  const handleViewStudentHistory = (student: Student) => {
    setStudentForHistory({
      id: student.id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      course: student.course
    });
    setSubmissionHistoryOpen(true);
  };

  const handleRequestResubmit = (submissionId: string, reason: string) => {
    // In real app, this would update the database
    console.log('Request resubmit:', submissionId, reason);
    toast.success('Resubmit request sent!');
  };

  const handleViewSubmissionFromHistory = (submission: any) => {
    // Navigate to submission review or open preview
    toast.info(`Viewing submission: ${submission.assignmentTitle}`);
  };

  // Listen for custom event from navbar to open create course modal
  useEffect(() => {
    const handleOpenCreateCourseModal = () => {
      setCreateCourseOpen(true);
    };
    
    window.addEventListener('openCreateCourseModal', handleOpenCreateCourseModal);
    return () => {
      window.removeEventListener('openCreateCourseModal', handleOpenCreateCourseModal);
    };
  }, []);

  // Handle editing a course
  const handleEditCourse = (courseId: string) => {
    const courseToEdit = teacherCourses.find(c => c.id === courseId);
    if (courseToEdit) {
      setEditingCourse({
        id: courseToEdit.id,
        title: courseToEdit.title,
        description: courseToEdit.description || undefined,
        category: courseToEdit.category,
        difficulty: courseToEdit.difficulty,
        price: courseToEdit.price || undefined,
        estimated_duration: courseToEdit.estimated_duration || undefined,
        submission_status: courseToEdit.submission_status || undefined,
        thumbnail_url: courseToEdit.thumbnail_url || undefined,
        gallery_images: courseToEdit.gallery_images || undefined,
      });
      setCreateCourseOpen(true);
    }
  };

  // Handle closing the modal
  const handleCloseModal = (open: boolean) => {
    setCreateCourseOpen(open);
    if (!open) {
      setEditingCourse(null);
    }
  };

  // Calculate stats from real data
  const totalStudents = teacherCourses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0);
  const publishedCourses = teacherCourses.filter(c => c.is_published).length;
  const draftCourses = teacherCourses.filter(c => !c.is_published).length;

  const stats = [
    { label: 'Total Students', value: totalStudents.toLocaleString(), icon: Users, gradient: STAT_GRADIENTS[0], change: '+12%' },
    { label: 'Active Courses', value: publishedCourses.toString(), icon: BookOpen, gradient: STAT_GRADIENTS[1] },
    { label: 'Draft Courses', value: draftCourses.toString(), icon: FileText, gradient: STAT_GRADIENTS[2] },
    { label: 'Avg. Rating', value: '4.8', icon: Star, gradient: STAT_GRADIENTS[3] },
  ];

  // Combine real courses with mock data for now
  const courses = teacherCourses.length > 0 
    ? teacherCourses.map(c => ({
        id: c.id,
        title: c.title,
        students: c.enrollment_count || 0,
        rating: 0,
        reviewCount: 0,
        revenue: (c.price || 0) * (c.enrollment_count || 0),
        status: c.is_published ? 'published' : 'draft',
        submissionStatus: c.submission_status || 'draft',
        lessons: c.total_lessons || 0,
        rejectionReason: c.rejection_reason,
        reviewer: (c as any).reviewer as { id: string; full_name: string; avatar_url?: string } | null,
        claimedAt: c.claimed_at,
      }))
    : [
        { id: '1', title: 'Amharic for Beginners', students: 450, rating: 4.9, reviewCount: 128, revenue: 12500, status: 'published', submissionStatus: 'approved', lessons: 24, reviewer: null, claimedAt: null },
        { id: '2', title: 'Ethiopian History', students: 320, rating: 4.8, reviewCount: 89, revenue: 9800, status: 'published', submissionStatus: 'approved', lessons: 18, reviewer: null, claimedAt: null },
        { id: '3', title: 'Business Amharic', students: 180, rating: 4.7, reviewCount: 45, revenue: 8200, status: 'published', submissionStatus: 'approved', lessons: 20, reviewer: null, claimedAt: null },
        { id: '4', title: 'Kids Amharic Fun', students: 298, rating: 4.9, reviewCount: 156, revenue: 14700, status: 'published', submissionStatus: 'approved', lessons: 30, reviewer: null, claimedAt: null },
        { id: '5', title: 'Advanced Grammar', students: 0, rating: 0, reviewCount: 0, revenue: 0, status: 'draft', submissionStatus: 'draft', lessons: 12, reviewer: null, claimedAt: null },
      ];

  // Convert TeacherStudent to Student format for UI compatibility
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const recentStudents: Student[] = teacherStudents.length > 0 
    ? teacherStudents.map((s: TeacherStudent) => ({
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        course: s.courseName,
        progress: s.progress,
        joinedAt: formatTimeAgo(s.enrolledAt),
        email: s.email,
        lastActive: formatTimeAgo(s.lastActiveAt),
        quizScore: s.quizScore,
        assignmentsCompleted: s.resourcesCompleted,
        totalAssignments: s.totalResources,
      }))
    : [
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

  const assignments: Assignment[] = [
    { id: '1', title: 'Week 1: Basic Greetings Essay', course: 'Amharic for Beginners', dueDate: '2024-01-20', submissions: 42, totalStudents: 50, status: 'active' },
    { id: '2', title: 'Historical Analysis Report', course: 'Ethiopian History', dueDate: '2024-01-18', submissions: 28, totalStudents: 32, status: 'past_due' },
    { id: '3', title: 'Business Letter Writing', course: 'Business Amharic', dueDate: '2024-01-25', submissions: 15, totalStudents: 20, status: 'active' },
    { id: '4', title: 'Kids Vocabulary Quiz', course: 'Kids Amharic Fun', dueDate: '2024-01-15', submissions: 30, totalStudents: 30, status: 'graded' },
  ];

  const pendingSubmissions: Submission[] = [
    { id: '1', studentName: 'Alemayehu M.', assignmentTitle: 'Week 1: Basic Greetings Essay', submittedAt: '2 hours ago', status: 'pending', fileType: 'text', content: 'ሰላም! ስሜ አለማየሁ ነው። ከአዲስ አበባ እመጣለሁ።\n\nይህ የመጀመሪያ ሳምንት የቤት ስራዬ ነው። በአማርኛ መሰረታዊ ሰላምታዎችን ተምሬያለሁ። "ሰላም ነው" ማለት "How are you?" ማለት ነው።\n\nምሳሌዎች:\n- ሰላም! (Hello!)\n- እንዴት ነህ? (How are you? - to male)\n- እንዴት ነሽ? (How are you? - to female)\n- ደህና ነኝ (I am fine)\n\nእነዚህን ሰላምታዎች ከቤተሰቤ ጋር ልምምድ አድርጌያለሁ።', gradingType: 'pass_fail' },
    { id: '2', studentName: 'Sara T.', assignmentTitle: 'Historical Analysis Report', submittedAt: '5 hours ago', status: 'late', fileType: 'pdf', gradingType: 'letter_grade' },
    { id: '3', studentName: 'Dawit B.', assignmentTitle: 'Business Letter Writing', submittedAt: '1 day ago', status: 'pending', fileType: 'text', content: 'Subject: Request for Meeting\n\nDear Mr. Kebede,\n\nI am writing to formally request a meeting to discuss our upcoming business partnership. As we discussed previously, I believe there are several opportunities we can explore together.\n\nPlease let me know your availability for next week.\n\nBest regards,\nDawit Bekele', gradingType: 'letter_grade' },
    { id: '4', studentName: 'Tigist K.', assignmentTitle: 'Kids Vocabulary Quiz', submittedAt: '2 days ago', grade: 'Good Job! 🎉', feedback: 'Great work!', status: 'graded', fileType: 'audio', gradingType: 'pass_fail' },
    { id: '5', studentName: 'Yonas G.', assignmentTitle: 'Week 1: Basic Greetings Essay', submittedAt: '3 hours ago', status: 'pending', fileType: 'video', gradingType: 'pass_fail' },
    { id: '6', studentName: 'Hanna A.', assignmentTitle: 'Historical Analysis Report', submittedAt: '1 day ago', status: 'pending', fileType: 'text', content: 'The history of Ethiopia spans thousands of years. The Kingdom of Aksum was one of the great civilizations of the ancient world, rivaling Rome, Persia, and China.\n\nKey points:\n1. Aksum was a major trading empire\n2. Ethiopia was never colonized (except brief Italian occupation)\n3. The Ethiopian Orthodox Church dates back to 4th century AD\n\nConclusion: Ethiopia\'s rich history has shaped its unique cultural identity.', gradingType: 'letter_grade' },
  ];

  const handleOpenSubmissionReview = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    // Get grading type from the first submission of this assignment
    const assignmentSubmissions = pendingSubmissions.filter(
      s => s.assignmentTitle === assignment.title
    );
    setCurrentGradingType(assignmentSubmissions[0]?.gradingType || 'pass_fail');
    setSubmissionReviewOpen(true);
  };

  const handleGradeFromReview = (submissionId: string, grade: string, feedback: string) => {
    console.log('Graded:', submissionId, grade, feedback);
    // In real app, this would update the database
  };

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

  // View student public profile
  const handleViewPublicProfile = async (student: Student) => {
    try {
      // Try to fetch real profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, username, avatar_url, bio, xp_points, current_streak')
        .or(`full_name.ilike.%${student.name}%,email.eq.${student.email}`)
        .maybeSingle();

      if (profile) {
        setSelectedProfileForPreview(profile);
      } else {
        // Fallback for mock data
        setSelectedProfileForPreview({
          id: student.id,
          user_id: student.id,
          full_name: student.name,
          username: student.name.toLowerCase().replace(/\s+/g, '_'),
          avatar_url: student.avatar,
          bio: `Student in ${student.course}`,
          xp_points: student.quizScore * 10,
          current_streak: 5,
        });
      }
      setProfilePreviewOpen(true);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast.error('Failed to load student profile');
    }
  };

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeValue(submission.grade?.toString() || '');
    setFeedbackText(submission.feedback || '');
    setGradeModalOpen(true);
  };

  const handleSubmitGrade = () => {
    if (!gradeValue.trim()) {
      toast.error('Please enter a grade');
      return;
    }
    const grade = parseInt(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error('Grade must be between 0 and 100');
      return;
    }
    toast.success(`Grade submitted for ${selectedSubmission?.studentName}`, {
      description: `Grade: ${grade}% - Feedback sent to student.`
    });
    setGradeModalOpen(false);
    setGradeValue('');
    setFeedbackText('');
    setSelectedSubmission(null);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-success';
    if (progress >= 50) return 'text-gold';
    return 'text-destructive';
  };

  const getAssignmentStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case 'past_due':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Past Due</Badge>;
      case 'graded':
        return <Badge className="bg-muted text-muted-foreground">Graded</Badge>;
    }
  };

  const tabs = ['overview', 'courses', 'students', 'assignments', 'games', 'skills', 'earnings'] as const;


  // Get courses under review with reviewer info
  const coursesUnderReview = courses.filter(c => c.submissionStatus === 'submitted' && c.reviewer);

  return (
    <>
      <DashboardLayout>
        {/* Notification Banner for Courses Under Review */}
        {coursesUnderReview.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-between gap-3 flex-wrap"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {coursesUnderReview.length === 1 
                    ? `"${coursesUnderReview[0].title}" is being reviewed`
                    : `${coursesUnderReview.length} courses are being reviewed`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {coursesUnderReview.length === 1 
                    ? `Reviewer: ${coursesUnderReview[0].reviewer?.full_name || 'Admin'}`
                    : 'Check the Courses tab for details'
                  }
                </p>
              </div>
            </div>
            {coursesUnderReview.length === 1 && coursesUnderReview[0].reviewer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestDifferentReviewer.mutate({ courseId: coursesUnderReview[0].id })}
                disabled={requestDifferentReviewer.isPending}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Request Different Reviewer
              </Button>
            )}
          </motion.div>
        )}

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

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid - Colorful Gradient Cards - Only on Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

              {/* Overview Content Grid */}
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditCourse(course.id)}
                          >
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
              </div>
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
                      <th className="p-4 font-medium">Enrolled</th>
                      <th className="p-4 font-medium">Reviews</th>
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
                          <div className="flex flex-col gap-1">
                            <Badge className={
                              course.submissionStatus === 'approved' || course.status === 'published' 
                                ? 'bg-success/10 text-success border-success/30' 
                                : course.submissionStatus === 'submitted'
                                ? 'bg-gold/10 text-gold border-gold/30'
                                : course.submissionStatus === 'rejected'
                                ? 'bg-destructive/10 text-destructive border-destructive/30'
                                : 'bg-muted text-muted-foreground'
                            }>
                              {course.submissionStatus === 'approved' ? 'Published' : 
                               course.submissionStatus === 'submitted' ? 'Pending Review' :
                               course.submissionStatus === 'rejected' ? 'Rejected' : 'Draft'}
                            </Badge>
                            {course.submissionStatus === 'rejected' && course.rejectionReason && (
                              <p className="text-xs text-destructive/80 max-w-[150px] truncate" title={course.rejectionReason}>
                                {course.rejectionReason}
                              </p>
                            )}
                            {/* Show reviewer info when course is being reviewed */}
                            {course.submissionStatus === 'submitted' && course.reviewer && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Reviewer: {course.reviewer.full_name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-xs text-accent hover:text-accent"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDifferentReviewer.mutate({ courseId: course.id });
                                  }}
                                  disabled={requestDifferentReviewer.isPending}
                                  title="Request a different reviewer"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Change
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-foreground">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{course.students}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {course.reviewCount > 0 ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="w-4 h-4" />
                              <span>{course.reviewCount}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
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
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              title="Edit Course"
                              onClick={() => handleEditCourse(course.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-accent hover:text-accent" 
                              title="View as Student"
                              onClick={() => navigate(`/course/${course.id}?preview=true`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(course.submissionStatus === 'draft' || course.submissionStatus === 'rejected') && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-success hover:text-success" 
                                title="Submit for Review"
                                onClick={() => submitForReview.mutate(course.id)}
                                disabled={submitForReview.isPending}
                              >
                                <SendHorizonal className="w-4 h-4" />
                              </Button>
                            )}
                            {(course.submissionStatus === 'submitted' || course.submissionStatus === 'rejected') && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-8 w-8 ${course.submissionStatus === 'rejected' ? 'text-destructive hover:text-destructive' : 'text-accent hover:text-accent'}`}
                                title="View Reviewer Comments"
                                onClick={() => {
                                  setFeedbackCourse({
                                    id: course.id,
                                    title: course.title,
                                    rejection_reason: course.rejectionReason,
                                  });
                                  setFeedbackModalOpen(true);
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Analytics">
                              <BarChart3 className="w-4 h-4" />
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
                  <p className="text-2xl font-bold">{recentStudents.length}</p>
                  <p className="text-xs opacity-80">Total Students</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[1]} text-white`}>
                  <CheckCircle className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{recentStudents.filter(s => s.progress > 0).length}</p>
                  <p className="text-xs opacity-80">Active Students</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[2]} text-white`}>
                  <Trophy className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{recentStudents.filter(s => s.progress >= 100).length}</p>
                  <p className="text-xs opacity-80">Course Completed</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[3]} text-white`}>
                  <Target className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{recentStudents.length > 0 ? Math.round(recentStudents.reduce((a, s) => a + s.quizScore, 0) / recentStudents.length) : 0}%</p>
                  <p className="text-xs opacity-80">Avg Quiz Score</p>
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewStudentHistory(student)}
                          title="View Submission History"
                        >
                          <History className="w-4 h-4 mr-1" /> Submissions
                        </Button>
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

          {activeTab === 'assignments' && (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Assignment Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[0]} text-white`}>
                  <FileText className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{assignments.length}</p>
                  <p className="text-xs opacity-80">Total Assignments</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[1]} text-white`}>
                  <Clock className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{pendingSubmissions.filter(s => s.status === 'pending').length}</p>
                  <p className="text-xs opacity-80">Pending Review</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[2]} text-white`}>
                  <CheckCircle className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{pendingSubmissions.filter(s => s.status === 'graded').length}</p>
                  <p className="text-xs opacity-80">Graded</p>
                </div>
                <div className={`rounded-xl p-4 bg-gradient-to-br ${STAT_GRADIENTS[3]} text-white`}>
                  <AlertTriangle className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{pendingSubmissions.filter(s => s.status === 'late').length}</p>
                  <p className="text-xs opacity-80">Late Submissions</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Assignments List */}
                <div className="bg-card rounded-xl border border-border">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-display font-semibold text-foreground">All Assignments</h2>
                    <Button size="sm" onClick={() => setCreateAssignmentOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Create
                    </Button>
                  </div>
                  <div className="divide-y divide-border">
                    {assignments.map((assignment, i) => (
                      <motion.div 
                        key={assignment.id} 
                        className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => handleOpenSubmissionReview(assignment)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-foreground">{assignment.title}</h3>
                              {getAssignmentStatusBadge(assignment.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{assignment.course}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Due: {assignment.dueDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {assignment.submissions}/{assignment.totalStudents} submitted
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <Progress 
                          value={(assignment.submissions / assignment.totalStudents) * 100} 
                          className="h-1.5 mt-3" 
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Pending Submissions */}
                <div className="bg-card rounded-xl border border-border">
                  <div className="p-4 border-b border-border">
                    <h2 className="font-display font-semibold text-foreground">Submissions to Review</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {pendingSubmissions.map((submission, i) => (
                      <div key={submission.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[i % 4]} flex items-center justify-center text-white font-semibold`}>
                            {submission.studentName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">{submission.studentName}</p>
                              {submission.status === 'late' && (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">Late</Badge>
                              )}
                              {submission.status === 'graded' && (
                                <Badge className="bg-success/10 text-success border-success/30 text-xs">{submission.grade}%</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{submission.assignmentTitle}</p>
                            <p className="text-xs text-muted-foreground">{submission.submittedAt}</p>
                          </div>
                          {submission.status !== 'graded' ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleGradeSubmission(submission)}
                              className="gap-1"
                            >
                              <Award className="w-4 h-4" /> Grade
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleGradeSubmission(submission)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GameTemplateCatalog />
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SkillContentEditor />
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

        <div className="mt-6">
          <NewsFeedWidget />
        </div>
      </DashboardLayout>

      {/* Create Course Modal */}
      <CreateCourseModal 
        open={createCourseOpen} 
        onOpenChange={handleCloseModal} 
        editCourse={editingCourse}
      />

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
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => {
                    setStudentDetailOpen(false);
                    handleViewPublicProfile(selectedStudent);
                  }}
                >
                  <UserCircle className="w-4 h-4" /> View Public Profile
                </Button>
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grade Submission Modal */}
      <AnimatePresence>
        {gradeModalOpen && selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setGradeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg">Grade Submission</h3>
                <Button variant="ghost" size="icon" onClick={() => setGradeModalOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[0]} flex items-center justify-center text-white font-bold`}>
                  {selectedSubmission.studentName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedSubmission.studentName}</p>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.assignmentTitle}</p>
                </div>
                {selectedSubmission.status === 'late' && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/30">Late</Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Grade (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter grade..."
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Feedback (Optional)</label>
                  <Textarea
                    placeholder="Write feedback for the student..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setGradeModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSubmitGrade}>
                  <Send className="w-4 h-4" /> Submit Grade
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal 
        open={createAssignmentOpen} 
        onOpenChange={setCreateAssignmentOpen}
        courses={courses.filter(c => c.status === 'published').map(c => ({ id: c.id, title: c.title }))}
      />

      {/* Submission Review Modal */}
      <SubmissionReviewModal
        open={submissionReviewOpen}
        onOpenChange={setSubmissionReviewOpen}
        submissions={selectedAssignment 
          ? pendingSubmissions.filter(s => s.assignmentTitle === selectedAssignment.title)
          : pendingSubmissions
        }
        gradingType={currentGradingType}
        onGrade={handleGradeFromReview}
      />

      {/* Student Submission History Modal */}
      <StudentSubmissionHistory
        open={submissionHistoryOpen}
        onOpenChange={setSubmissionHistoryOpen}
        student={studentForHistory}
        submissions={studentForHistory ? getStudentSubmissions(studentForHistory.id) : []}
        onRequestResubmit={handleRequestResubmit}
        onViewSubmission={handleViewSubmissionFromHistory}
      />

      {/* Student Public Profile Preview Modal */}
      <ProfilePreviewModal
        open={profilePreviewOpen}
        onOpenChange={setProfilePreviewOpen}
        profile={selectedProfileForPreview}
        onStartChat={(userId) => {
          navigate('/messages', { state: { startDmWith: userId } });
        }}
        onCall={(userId) => {
          toast.info('Calling student...');
        }}
        onVideoCall={(userId) => {
          toast.info('Starting video call...');
        }}
        onReport={(userId) => {
          toast.info('Report submitted for review');
        }}
      />

      {/* Course Review Feedback Modal */}
      {feedbackCourse && (
        <CourseReviewFeedback
          open={feedbackModalOpen}
          onOpenChange={setFeedbackModalOpen}
          courseId={feedbackCourse.id}
          courseTitle={feedbackCourse.title}
          rejectionReason={feedbackCourse.rejection_reason}
        />
      )}
    </>
  );
};

export default TeacherDashboard;
