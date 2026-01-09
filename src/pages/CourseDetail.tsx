import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  Star,
  Users,
  BookOpen,
  Video,
  FileText,
  Headphones,
  Trophy,
  ChevronRight,
  Download,
  Share2,
  Heart
} from 'lucide-react';

const CourseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'lessons' | 'resources' | 'reviews'>('lessons');

  // Mock course data
  const course = {
    title: 'Amharic Basics for Beginners',
    description: 'Learn the fundamentals of Amharic language including the Ge\'ez script, basic vocabulary, greetings, and essential grammar structures.',
    instructor: 'Dr. Alemayehu Bekele',
    category: 'Language',
    level: 'Beginner',
    duration: '12 hours',
    lessons: 24,
    students: 1250,
    rating: 4.8,
    reviews: 342,
    progress: 65,
    thumbnail: '📚',
    xpReward: 500,
  };

  const modules = [
    {
      title: 'Getting Started',
      lessons: [
        { id: 1, title: 'Welcome to Amharic', type: 'video', duration: '5:30', completed: true },
        { id: 2, title: 'Introduction to Ge\'ez Script', type: 'video', duration: '12:45', completed: true },
        { id: 3, title: 'Practice: First Letters', type: 'quiz', duration: '10 min', completed: true },
      ]
    },
    {
      title: 'Basic Greetings',
      lessons: [
        { id: 4, title: 'Saying Hello & Goodbye', type: 'video', duration: '8:20', completed: true },
        { id: 5, title: 'Common Phrases', type: 'audio', duration: '15:00', completed: false, current: true },
        { id: 6, title: 'Practice Conversation', type: 'interactive', duration: '20 min', completed: false },
      ]
    },
    {
      title: 'Numbers & Counting',
      lessons: [
        { id: 7, title: 'Numbers 1-10', type: 'video', duration: '10:15', completed: false, locked: true },
        { id: 8, title: 'Numbers 11-100', type: 'video', duration: '12:30', completed: false, locked: true },
        { id: 9, title: 'Number Quiz', type: 'quiz', duration: '15 min', completed: false, locked: true },
      ]
    },
  ];

  const resources = [
    { title: 'Amharic Alphabet Chart', type: 'PDF', size: '2.4 MB', icon: FileText },
    { title: 'Vocabulary Flashcards', type: 'Interactive', size: '156 cards', icon: BookOpen },
    { title: 'Audio Pronunciation Guide', type: 'MP3', size: '45 MB', icon: Headphones },
    { title: 'Practice Worksheets', type: 'PDF', size: '8.2 MB', icon: FileText },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'quiz': return Trophy;
      default: return FileText;
    }
  };

  return (
    <DashboardLayout>
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Header */}
          <motion.div
            className="bg-card rounded-xl border border-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-3xl">
                {course.thumbnail}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-accent px-2 py-0.5 bg-accent/10 rounded-full">
                    {course.category}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                    {course.level}
                  </span>
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground">{course.title}</h1>
                <p className="text-muted-foreground mt-1">by {course.instructor}</p>
              </div>
            </div>

            <p className="text-foreground mb-4">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {course.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> {course.lessons} lessons
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {course.students.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1 text-gold">
                <Star className="w-4 h-4 fill-gold" /> {course.rating} ({course.reviews} reviews)
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Your Progress</span>
                <span className="text-sm text-muted-foreground">{course.progress}% complete</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>

            <div className="flex gap-3">
              <Button variant="hero" className="flex-1">
                <Play className="w-4 h-4 mr-2" /> Continue Learning
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(['lessons', 'resources', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Lessons */}
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <motion.div
                  key={module.title}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: moduleIndex * 0.1 }}
                >
                  <div className="p-4 border-b border-border bg-muted/30">
                    <h3 className="font-display font-semibold text-foreground">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {module.lessons.map((lesson) => {
                      const Icon = getTypeIcon(lesson.type);
                      return (
                        <button
                          key={lesson.id}
                          className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                            lesson.locked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-muted/50 cursor-pointer'
                          } ${lesson.current ? 'bg-accent/5 border-l-2 border-accent' : ''}`}
                          disabled={lesson.locked}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            lesson.completed
                              ? 'bg-success/10 text-success'
                              : lesson.current
                              ? 'bg-accent/10 text-accent'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {lesson.completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : lesson.locked ? (
                              <Lock className="w-5 h-5" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${lesson.current ? 'text-accent' : 'text-foreground'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {lesson.type} • {lesson.duration}
                            </p>
                          </div>
                          {lesson.current && (
                            <span className="text-xs font-medium text-accent px-2 py-1 bg-accent/10 rounded-full">
                              Continue
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Resources */}
          {activeTab === 'resources' && (
            <motion.div
              className="bg-card rounded-xl border border-border divide-y divide-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {resources.map((resource) => (
                <div key={resource.title} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <resource.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.type} • {resource.size}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </motion.div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <motion.div
              className="bg-card rounded-xl border border-border p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Star className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {course.rating} out of 5
              </h3>
              <p className="text-muted-foreground">{course.reviews} reviews from students</p>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* XP Reward */}
          <motion.div
            className="bg-gradient-accent rounded-xl p-5 text-accent-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-80">Course Reward</p>
                <p className="text-2xl font-display font-bold">{course.xpReward} XP</p>
              </div>
            </div>
            <p className="text-sm opacity-80">
              Complete all lessons to earn {course.xpReward} XP and unlock a special badge!
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Course Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-foreground">4/24 lessons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Spent</span>
                <span className="font-medium text-foreground">2h 45m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP Earned</span>
                <span className="font-medium text-gold">125 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quizzes Passed</span>
                <span className="font-medium text-success">1/3</span>
              </div>
            </div>
          </motion.div>

          {/* Certificate */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Certificate</h4>
                <p className="text-xs text-muted-foreground">Complete to unlock</p>
              </div>
            </div>
            <Progress value={course.progress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              {100 - course.progress}% remaining
            </p>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
