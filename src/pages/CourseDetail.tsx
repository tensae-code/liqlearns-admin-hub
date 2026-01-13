import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CourseInfoModal from '@/components/course/CourseInfoModal';
import CourseLearningResources from '@/components/course/CourseLearningResources';
import CourseReviews from '@/components/course/CourseReviews';
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
  Share2,
  Heart,
  Info,
  Award
} from 'lucide-react';

const CourseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'lessons' | 'resources' | 'reviews'>('lessons');
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Mock course data
  const course = {
    id: id || '1',
    title: 'Amharic Basics for Beginners',
    description: 'Learn the fundamentals of Amharic language including the Ge\'ez script, basic vocabulary, greetings, and essential grammar structures. This comprehensive course takes you from complete beginner to conversational level.',
    instructor: {
      id: 'inst-1',
      name: 'Dr. Alemayehu Bekele',
      avatar: null,
      bio: 'Professor of Ethiopian Languages at Addis Ababa University with 15+ years of teaching experience.',
      verified: true,
      socialLinks: { twitter: '@alemayehu', linkedin: 'alemayehu-bekele' }
    },
    category: 'Language',
    level: 'Beginner',
    duration: '12 hours',
    totalModules: 8,
    students: 1250,
    rating: 4.8,
    reviewCount: 342,
    progress: 65,
    thumbnail: '📚',
    completionThreshold: 80, // 80% to complete
    prerequisites: ['Basic understanding of any language structure', 'Dedication to practice daily'],
    whatYouWillLearn: [
      'Read and write Ge\'ez script',
      'Basic conversational Amharic',
      'Numbers and counting system',
      'Common phrases for daily life'
    ],
    badge: {
      name: 'Amharic Scholar',
      icon: '🎓',
      currentLevel: 2,
      maxLevel: 8
    }
  };

  const modules = [
    {
      id: 'm1',
      title: 'Getting Started',
      badgeLevel: 1,
      unlocked: true,
      completed: true,
      lessons: [
        { id: 1, title: 'Welcome to Amharic', type: 'video', duration: '5:30', completed: true, xp: 25 },
        { id: 2, title: 'Introduction to Ge\'ez Script', type: 'video', duration: '12:45', completed: true, xp: 30 },
        { id: 3, title: 'Practice: First Letters', type: 'quiz', duration: '10 min', completed: true, xp: 50 },
      ]
    },
    {
      id: 'm2',
      title: 'Basic Greetings',
      badgeLevel: 2,
      unlocked: true,
      completed: false,
      lessons: [
        { id: 4, title: 'Saying Hello & Goodbye', type: 'video', duration: '8:20', completed: true, xp: 25 },
        { id: 5, title: 'Common Phrases', type: 'audio', duration: '15:00', completed: false, current: true, xp: 30 },
        { id: 6, title: 'Practice Conversation', type: 'interactive', duration: '20 min', completed: false, xp: 45 },
      ]
    },
    {
      id: 'm3',
      title: 'Numbers & Counting',
      badgeLevel: 3,
      unlocked: false,
      completed: false,
      lessons: [
        { id: 7, title: 'Numbers 1-10', type: 'video', duration: '10:15', completed: false, locked: true, xp: 25 },
        { id: 8, title: 'Numbers 11-100', type: 'video', duration: '12:30', completed: false, locked: true, xp: 30 },
        { id: 9, title: 'Number Quiz', type: 'quiz', duration: '15 min', completed: false, locked: true, xp: 50 },
      ]
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'quiz': return Trophy;
      default: return FileText;
    }
  };

  const completedModules = modules.filter(m => m.completed).length;
  const completionPercentage = Math.round((completedModules / modules.length) * 100);
  const isOfficiallyComplete = completionPercentage >= course.completionThreshold;

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
          {/* Course Header - Compact */}
          <motion.div
            className="bg-card rounded-xl border border-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-3xl relative">
                {course.thumbnail}
                {/* Badge Level Indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold text-gold-foreground rounded-full flex items-center justify-center text-xs font-bold border-2 border-card">
                  {course.badge.currentLevel}
                </div>
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
                <p className="text-muted-foreground mt-1">by {course.instructor.name}</p>
              </div>
              {/* Info Button */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowInfoModal(true)}
                className="flex-shrink-0"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {course.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> {course.totalModules} modules
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {course.students.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1 text-gold">
                <Star className="w-4 h-4 fill-gold" /> {course.rating} ({course.reviewCount} reviews)
              </span>
            </div>

            {/* Progress - Shows module completion */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Module Progress ({completedModules}/{modules.length})
                </span>
                <span className="text-sm text-muted-foreground">
                  {course.completionThreshold}% needed to complete
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              {isOfficiallyComplete && (
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Course officially completed!
                </p>
              )}
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

          {/* Lessons - Modules as Badge Levels */}
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <motion.div
                  key={module.id}
                  className={`bg-card rounded-xl border overflow-hidden ${
                    module.unlocked ? 'border-border' : 'border-border/50 opacity-75'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: moduleIndex * 0.1 }}
                >
                  <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                    {/* Badge Level Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      module.completed 
                        ? 'bg-gold/20 text-gold' 
                        : module.unlocked 
                          ? 'bg-accent/10 text-accent'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {module.completed ? (
                        <Award className="w-5 h-5" />
                      ) : module.unlocked ? (
                        <span className="font-bold">{module.badgeLevel}</span>
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-foreground">
                        Level {module.badgeLevel}: {module.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {module.completed 
                          ? `✓ Badge Level ${module.badgeLevel} Unlocked`
                          : module.unlocked 
                            ? 'Complete to unlock badge level'
                            : 'Complete previous module to unlock'}
                      </p>
                    </div>
                    {module.completed && (
                      <div className="text-2xl">{course.badge.icon}</div>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {module.lessons.map((lesson) => {
                      const Icon = getTypeIcon(lesson.type);
                      const isLocked = !module.unlocked || lesson.locked;
                      return (
                        <button
                          key={lesson.id}
                          className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                            isLocked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-muted/50 cursor-pointer'
                          } ${lesson.current ? 'bg-accent/5 border-l-2 border-accent' : ''}`}
                          disabled={isLocked}
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
                            ) : isLocked ? (
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
                              {lesson.type} • {lesson.duration} • +{lesson.xp} XP
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

          {/* Resources - From Dashboard Learning Resources */}
          {activeTab === 'resources' && (
            <CourseLearningResources courseId={course.id} />
          )}

          {/* Reviews - Enhanced */}
          {activeTab === 'reviews' && (
            <CourseReviews 
              courseRating={course.rating}
              totalReviews={course.reviewCount}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Badge Progress */}
          <motion.div
            className="bg-gradient-accent rounded-xl p-5 text-accent-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">{course.badge.icon}</div>
              <div>
                <p className="text-sm opacity-80">{course.badge.name}</p>
                <p className="text-2xl font-display font-bold">
                  Level {course.badge.currentLevel}/{course.badge.maxLevel}
                </p>
              </div>
            </div>
            <Progress 
              value={(course.badge.currentLevel / course.badge.maxLevel) * 100} 
              className="h-2 bg-white/20" 
            />
            <p className="text-sm opacity-80 mt-2">
              Complete modules to level up your badge!
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modules Completed</span>
                <span className="font-medium text-foreground">{completedModules}/{modules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Badge Level</span>
                <span className="font-medium text-gold">{course.badge.currentLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP Earned</span>
                <span className="font-medium text-success">+205 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion</span>
                <span className={`font-medium ${isOfficiallyComplete ? 'text-success' : 'text-foreground'}`}>
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Instructor Preview */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-display font-semibold text-foreground mb-3">Instructor</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                {course.instructor.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground flex items-center gap-1">
                  {course.instructor.name}
                  {course.instructor.verified && (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">{course.instructor.bio}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-3" size="sm">
              View Profile
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Course Info Modal */}
      <CourseInfoModal
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
        course={{
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          category: course.category,
          level: course.level,
          duration: course.duration,
          totalModules: course.totalModules,
          students: course.students,
          rating: course.rating,
          reviewCount: course.reviewCount,
          prerequisites: course.prerequisites,
          whatYouWillLearn: course.whatYouWillLearn,
          completionThreshold: course.completionThreshold
        }}
      />
    </DashboardLayout>
  );
};

export default CourseDetail;
