import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  Award
} from 'lucide-react';

interface CoursePreviewPanelProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    difficulty: string;
    instructor?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  onBack: () => void;
}

const CoursePreviewPanel = ({ course, onBack }: CoursePreviewPanelProps) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'resources' | 'reviews'>('lessons');

  // Mock course data for preview - in production this would fetch real data
  const mockCourseData = {
    duration: '12 hours',
    totalModules: 8,
    students: 0,
    rating: 0,
    reviewCount: 0,
    progress: 0,
    thumbnail: '📚',
    badge: {
      name: 'Course Badge',
      icon: '🎓',
      currentLevel: 0,
      maxLevel: 8
    }
  };

  const modules = [
    {
      id: 'm1',
      title: 'Getting Started',
      badgeLevel: 1,
      unlocked: true,
      completed: false,
      lessons: [
        { id: 1, title: 'Welcome to the Course', type: 'video', duration: '5:30', completed: false, xp: 25 },
        { id: 2, title: 'Course Overview', type: 'video', duration: '12:45', completed: false, xp: 30 },
        { id: 3, title: 'Introduction Quiz', type: 'quiz', duration: '10 min', completed: false, xp: 50 },
      ]
    },
    {
      id: 'm2',
      title: 'Core Concepts',
      badgeLevel: 2,
      unlocked: false,
      completed: false,
      lessons: [
        { id: 4, title: 'Lesson 1', type: 'video', duration: '8:20', completed: false, locked: true, xp: 25 },
        { id: 5, title: 'Lesson 2', type: 'audio', duration: '15:00', completed: false, locked: true, xp: 30 },
        { id: 6, title: 'Practice Exercise', type: 'interactive', duration: '20 min', completed: false, locked: true, xp: 45 },
      ]
    },
    {
      id: 'm3',
      title: 'Advanced Topics',
      badgeLevel: 3,
      unlocked: false,
      completed: false,
      lessons: [
        { id: 7, title: 'Advanced Lesson 1', type: 'video', duration: '10:15', completed: false, locked: true, xp: 25 },
        { id: 8, title: 'Advanced Lesson 2', type: 'video', duration: '12:30', completed: false, locked: true, xp: 30 },
        { id: 9, title: 'Final Quiz', type: 'quiz', duration: '15 min', completed: false, locked: true, xp: 50 },
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

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Review
        </Button>
        <Badge variant="secondary" className="text-accent border-accent/30">
          Student Preview Mode
        </Badge>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 mt-4">
        <div className="space-y-6 pr-2">
          {/* Course Header */}
          <motion.div
            className="bg-muted/30 rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-2xl relative">
                {mockCourseData.thumbnail}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gold text-gold-foreground rounded-full flex items-center justify-center text-xs font-bold border-2 border-card">
                  {mockCourseData.badge.currentLevel}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-accent px-2 py-0.5 bg-accent/10 rounded-full">
                    {course.category}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded-full capitalize">
                    {course.difficulty}
                  </span>
                </div>
                <h2 className="text-xl font-display font-bold text-foreground">{course.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  by {course.instructor?.full_name || 'Unknown Instructor'}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {mockCourseData.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> {mockCourseData.totalModules} modules
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {mockCourseData.students} students
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star className="w-4 h-4" /> {mockCourseData.rating} ({mockCourseData.reviewCount} reviews)
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Module Progress (0/{modules.length})
                </span>
                <span className="text-sm text-muted-foreground">
                  80% needed to complete
                </span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <Button variant="hero" className="w-full">
              <Play className="w-4 h-4 mr-2" /> Start Learning
            </Button>
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
                  key={module.id}
                  className={`bg-card rounded-xl border overflow-hidden ${
                    module.unlocked ? 'border-border' : 'border-border/50 opacity-75'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: moduleIndex * 0.05 }}
                >
                  <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      module.completed 
                        ? 'bg-gold/20 text-gold' 
                        : module.unlocked 
                          ? 'bg-accent/10 text-accent'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {module.completed ? (
                        <Award className="w-4 h-4" />
                      ) : module.unlocked ? (
                        <span className="font-bold text-sm">{module.badgeLevel}</span>
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-foreground text-sm">
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
                  </div>
                  <div className="divide-y divide-border">
                    {module.lessons.map((lesson) => {
                      const Icon = getTypeIcon(lesson.type);
                      const isLocked = !module.unlocked || lesson.locked;
                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center gap-3 p-3 text-left ${
                            isLocked ? 'opacity-50' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            lesson.completed
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {lesson.completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">
                              {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {lesson.type} • {lesson.duration} • +{lesson.xp} XP
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Learning Resources</p>
              <p className="text-sm text-muted-foreground mt-1">
                Resources will be available once the course is published
              </p>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Student Reviews</p>
              <p className="text-sm text-muted-foreground mt-1">
                No reviews yet - this course is pending approval
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CoursePreviewPanel;
