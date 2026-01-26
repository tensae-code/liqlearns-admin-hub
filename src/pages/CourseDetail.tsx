import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import CourseInfoModal from '@/components/course/CourseInfoModal';
import CourseLearningResources from '@/components/course/CourseLearningResources';
import CourseReviews from '@/components/course/CourseReviews';
import { supabase } from '@/integrations/supabase/client';
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
  Award,
  Presentation,
  Layers,
  AlertCircle
} from 'lucide-react';

interface ModulePresentation {
  id: string;
  module_id: string;
  file_name: string;
  total_slides: number;
  created_at: string;
}

interface CourseResource {
  id: string;
  module_id: string;
  type: string;
  title: string;
  show_after_slide: number;
}

interface ModuleData {
  moduleId: string;
  title: string;
  presentations: ModulePresentation[];
  resources: CourseResource[];
  totalSlides: number;
  unlocked: boolean;
  completed: boolean;
}

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  instructor_id: string | null;
  is_published: boolean | null;
  submission_status: string | null;
  badge_name: string | null;
  instructor?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const CourseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  
  const [activeTab, setActiveTab] = useState<'lessons' | 'resources' | 'reviews'>('lessons');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [allResources, setAllResources] = useState<CourseResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentCount, setEnrollmentCount] = useState(0);

  // Fetch real course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      try {
        // Fetch course with instructor
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            instructor:profiles!courses_instructor_id_fkey(id, full_name, avatar_url)
          `)
          .eq('id', id)
          .maybeSingle();

        if (courseError) {
          console.error('Course fetch error:', courseError);
          return;
        }
        
        if (!courseData) {
          console.error('Course not found');
          return;
        }

        setCourse(courseData);

        // Fetch presentations for this course
        const { data: presentations, error: presError } = await supabase
          .from('module_presentations')
          .select('*')
          .eq('course_id', id)
          .order('created_at');

        if (presError) console.error('Presentations fetch error:', presError);

        // Fetch resources for this course
        const { data: resources, error: resError } = await supabase
          .from('course_resources')
          .select('*')
          .eq('course_id', id)
          .order('order_index');

        if (resError) console.error('Resources fetch error:', resError);

        // Fetch enrollment count
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', id);

        setEnrollmentCount(count || 0);
        setAllResources(resources || []);

        // Group by module_id
        const moduleMap = new Map<string, ModuleData>();
        
        (presentations || []).forEach((pres: any, idx: number) => {
          const moduleId = pres.module_id;
          if (!moduleMap.has(moduleId)) {
            moduleMap.set(moduleId, {
              moduleId,
              title: `Module ${moduleMap.size + 1}`,
              presentations: [],
              resources: [],
              totalSlides: 0,
              unlocked: idx === 0 || isPreview, // First module unlocked, or all in preview
              completed: false,
            });
          }
          const mod = moduleMap.get(moduleId)!;
          mod.presentations.push(pres);
          mod.totalSlides += pres.total_slides || 0;
        });

        // Add resources to their modules
        (resources || []).forEach((res: any) => {
          const moduleId = res.module_id;
          if (moduleMap.has(moduleId)) {
            moduleMap.get(moduleId)!.resources.push(res);
          } else {
            // Module from resource that has no presentation
            moduleMap.set(moduleId, {
              moduleId,
              title: `Module ${moduleMap.size + 1}`,
              presentations: [],
              resources: [res],
              totalSlides: 0,
              unlocked: isPreview,
              completed: false,
            });
          }
        });

        // Convert to array and update titles
        const modulesArray = Array.from(moduleMap.values()).map((mod, idx) => ({
          ...mod,
          title: `Module ${idx + 1}`,
          unlocked: idx === 0 || isPreview, // Re-apply unlock logic based on order
        }));

        setModules(modulesArray);
      } catch (err) {
        console.error('Error fetching course data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [id, isPreview]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'quiz': return Trophy;
      case 'flashcard': return Layers;
      default: return FileText;
    }
  };

  // Calculate totals
  const totalSlides = modules.reduce((sum, m) => sum + m.totalSlides, 0);
  const estimatedHours = Math.max(1, Math.ceil(totalSlides / 15));
  const completedModules = modules.filter(m => m.completed).length;
  const completionPercentage = modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;
  const completionThreshold = 80;
  const isOfficiallyComplete = completionPercentage >= completionThreshold;
  const hasContent = modules.length > 0 || allResources.length > 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground">Course Not Found</h2>
          <p className="text-muted-foreground mt-2">The course you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
        </Button>
        {isPreview && (
          <Badge variant="secondary" className="text-accent border-accent/30">
            Teacher Preview Mode
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* No Content Warning */}
          {!hasContent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">No Course Content Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This course doesn't have any presentations or resources uploaded yet.
                </p>
              </div>
            </motion.div>
          )}

          {/* Course Header */}
          <motion.div
            className="bg-card rounded-xl border border-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-3xl relative">
                📚
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold text-gold-foreground rounded-full flex items-center justify-center text-xs font-bold border-2 border-card">
                  {modules.length}
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
                <h1 className="text-2xl font-display font-bold text-foreground">{course.title}</h1>
                <p className="text-muted-foreground mt-1">
                  by {course.instructor?.full_name || 'Unknown Instructor'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowInfoModal(true)}
                className="flex-shrink-0"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> ~{estimatedHours} hour{estimatedHours > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> {modules.length} module{modules.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Presentation className="w-4 h-4" /> {totalSlides} slides
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {enrollmentCount} students
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star className="w-4 h-4" /> 0 (0 reviews)
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Module Progress ({completedModules}/{modules.length})
                </span>
                <span className="text-sm text-muted-foreground">
                  {completionThreshold}% needed to complete
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
              <Button variant="hero" className="flex-1" disabled={isPreview || !hasContent}>
                <Play className="w-4 h-4 mr-2" /> 
                {isPreview ? 'Preview Only' : hasContent ? 'Start Learning' : 'No Content'}
              </Button>
              <Button variant="outline" size="icon" disabled={isPreview}>
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={isPreview}>
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
                {tab === 'resources' && allResources.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{allResources.length}</Badge>
                )}
              </button>
            ))}
          </div>

          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              {modules.length > 0 ? (
                modules.map((module, moduleIndex) => (
                  <motion.div
                    key={module.moduleId}
                    className={`bg-card rounded-xl border overflow-hidden ${
                      module.unlocked ? 'border-border' : 'border-border/50 opacity-75'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: moduleIndex * 0.05 }}
                  >
                    {/* Module Header */}
                    <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
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
                          <span className="font-bold">{moduleIndex + 1}</span>
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-foreground">
                          {module.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {module.presentations.length + module.resources.length} item{(module.presentations.length + module.resources.length) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {module.completed && (
                        <Badge className="bg-gold/20 text-gold border-gold/30">Completed</Badge>
                      )}
                    </div>
                    
                    {/* Lessons (Presentations) & Resources Combined */}
                    <div className="divide-y divide-border">
                      {/* Lessons from presentations */}
                      {module.presentations.map((pres, lessonIndex) => (
                        <div
                          key={pres.id}
                          className={`flex items-center gap-4 p-4 text-left transition-colors ${
                            module.unlocked ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {/* Progress indicator */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            false // TODO: Track lesson completion
                              ? 'bg-success border-success text-success-foreground'
                              : 'border-muted-foreground/30 text-muted-foreground'
                          }`}>
                            {false ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <span className="text-xs font-medium">{lessonIndex + 1}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {pres.file_name.replace(/\.pptx?$/i, '')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Lesson
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                      
                      {/* Resources under the module */}
                      {module.resources.map((res) => {
                        const Icon = getTypeIcon(res.type);
                        return (
                          <div
                            key={res.id}
                            className={`flex items-center gap-4 p-4 text-left bg-accent/5 ${
                              module.unlocked ? 'hover:bg-accent/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {/* Progress indicator for resource */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                              false // TODO: Track resource completion
                                ? 'bg-success border-success text-success-foreground'
                                : 'border-accent/30 bg-accent/10 text-accent'
                            }`}>
                              {false ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Icon className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {res.title}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {res.type}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">{res.type}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-card rounded-xl border border-border p-6 text-center">
                  <Presentation className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">No Modules Found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This course has no presentations or lessons uploaded yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              {allResources.length > 0 ? (
                allResources.map((res) => {
                  const Icon = getTypeIcon(res.type);
                  return (
                    <motion.div
                      key={res.id}
                      className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{res.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {res.type} • After slide {res.show_after_slide}
                        </p>
                      </div>
                      <Badge className="capitalize">{res.type}</Badge>
                    </motion.div>
                  );
                })
              ) : (
                <div className="bg-card rounded-xl border border-border p-6 text-center">
                  <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">No Resources Found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This course has no interactive resources (quizzes, flashcards, videos) yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <CourseReviews 
              courseRating={0}
              totalReviews={0}
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
              <div className="text-4xl">🎓</div>
              <div>
                <p className="text-sm opacity-80">{course.badge_name || 'Course Badge'}</p>
                <p className="text-2xl font-display font-bold">
                  Level 0/{modules.length}
                </p>
              </div>
            </div>
            <Progress 
              value={0} 
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
            <h3 className="font-display font-semibold text-foreground mb-4">Course Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modules</span>
                <span className="font-medium text-foreground">{modules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Slides</span>
                <span className="font-medium text-foreground">{totalSlides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resources</span>
                <span className="font-medium text-foreground">{allResources.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Duration</span>
                <span className="font-medium text-foreground">~{estimatedHours}h</span>
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
                {course.instructor?.full_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground flex items-center gap-1">
                  {course.instructor?.full_name || 'Unknown Instructor'}
                </p>
                <p className="text-xs text-muted-foreground">Course Creator</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-3" size="sm" disabled={isPreview}>
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
          description: course.description || '',
          instructor: {
            id: course.instructor?.id || '',
            name: course.instructor?.full_name || 'Unknown',
            avatar: course.instructor?.avatar_url,
            bio: '',
            verified: true,
            socialLinks: {}
          },
          category: course.category,
          level: course.difficulty,
          duration: `~${estimatedHours} hours`,
          totalModules: modules.length,
          students: enrollmentCount,
          rating: 0,
          reviewCount: 0,
          prerequisites: [],
          whatYouWillLearn: [],
          completionThreshold: completionThreshold
        }}
      />
    </DashboardLayout>
  );
};

export default CourseDetail;
