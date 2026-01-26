import { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Award,
  Layers,
  FlaskConical,
  Presentation,
  AlertCircle
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
}

interface BadgeSuggestion {
  id: string;
  suggested_name: string;
  source: 'teacher' | 'student' | 'admin';
  votes_count: number;
  is_selected: boolean;
  suggested_by: string;
}

const CoursePreviewPanel = forwardRef<HTMLDivElement, CoursePreviewPanelProps>(
  ({ course, onBack }, ref) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'resources' | 'reviews'>('lessons');
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [allResources, setAllResources] = useState<CourseResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [badgeSuggestions, setBadgeSuggestions] = useState<BadgeSuggestion[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  // Fetch real course data
  useEffect(() => {
    const fetchCourseData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch presentations for this course
        const { data: presentations, error: presError } = await supabase
          .from('module_presentations')
          .select('*')
          .eq('course_id', course.id)
          .order('created_at');

        if (presError) console.error('Presentations fetch error:', presError);

        // Fetch resources for this course
        const { data: resources, error: resError } = await supabase
          .from('course_resources')
          .select('*')
          .eq('course_id', course.id)
          .order('order_index');

        if (resError) console.error('Resources fetch error:', resError);

        // Fetch enrollment count
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        // Fetch badge suggestions
        const { data: badges } = await supabase
          .from('course_badge_suggestions')
          .select('*')
          .eq('course_id', course.id)
          .order('votes_count', { ascending: false });

        setBadgeSuggestions((badges as BadgeSuggestion[]) || []);
        const selected = badges?.find((b: any) => b.is_selected);
        setSelectedBadge(selected?.suggested_name || null);

        setEnrollmentCount(count || 0);
        setAllResources(resources || []);

        // Group by module_id
        const moduleMap = new Map<string, ModuleData>();
        
        (presentations || []).forEach((pres: any) => {
          const moduleId = pres.module_id;
          if (!moduleMap.has(moduleId)) {
            moduleMap.set(moduleId, {
              moduleId,
              title: `Module ${moduleMap.size + 1}`,
              presentations: [],
              resources: [],
              totalSlides: 0,
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
            });
          }
        });

        // Convert to array and update titles
        const modulesArray = Array.from(moduleMap.values()).map((mod, idx) => ({
          ...mod,
          title: `Module ${idx + 1}`,
        }));

        setModules(modulesArray);
      } catch (err) {
        console.error('Error fetching course data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [course.id]);

  // Calculate totals
  const totalSlides = modules.reduce((sum, m) => sum + m.totalSlides, 0);
  const totalResources = allResources.length;
  const estimatedHours = Math.max(1, Math.ceil(totalSlides / 15)); // ~15 slides per hour

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'quiz': return Trophy;
      case 'flashcard': return Layers;
      default: return FileText;
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'audio': return '🎧';
      case 'quiz': return '📝';
      case 'flashcard': return '🃏';
      default: return '📄';
    }
  };

  const hasContent = modules.length > 0 || allResources.length > 0;

  return (
    <div ref={ref} className="flex flex-col h-[60vh] min-h-0">
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
      <ScrollArea className="flex-1 mt-4 h-full">
        <div className="space-y-6 pr-4 pb-4">
          {/* No Content Warning */}
          {!isLoading && !hasContent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">No Course Content Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The teacher hasn't uploaded any presentations, quizzes, or resources yet. 
                  You may want to request they add content before approving.
                </p>
              </div>
            </motion.div>
          )}
          {/* Course Header */}
          <motion.div
            className="bg-muted/30 rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-2xl relative">
                📚
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gold text-gold-foreground rounded-full flex items-center justify-center text-xs font-bold border-2 border-card">
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
                <h2 className="text-xl font-display font-bold text-foreground">{course.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  by {course.instructor?.full_name || 'Unknown Instructor'}
                </p>
              </div>
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
                  Module Progress (0/{modules.length})
                </span>
                <span className="text-sm text-muted-foreground">
                  80% needed to complete
                </span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <Button variant="hero" className="w-full" disabled>
              <Play className="w-4 h-4 mr-2" /> Preview Only
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
                {tab === 'resources' && totalResources > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{totalResources}</Badge>
                )}
              </button>
            ))}
          </div>

          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : modules.length > 0 ? (
                modules.map((module, moduleIndex) => (
                  <motion.div
                    key={module.moduleId}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: moduleIndex * 0.05 }}
                  >
                    <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                        <span className="font-bold text-sm">{moduleIndex + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-foreground text-sm">
                          {module.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {module.presentations.length} presentation{module.presentations.length !== 1 ? 's' : ''} • {module.totalSlides} slides • {module.resources.length} resource{module.resources.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Presentations in this module */}
                    <div className="divide-y divide-border">
                      {module.presentations.map((pres) => (
                        <div
                          key={pres.id}
                          className="flex items-center gap-3 p-3 text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                            <Presentation className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">
                              {pres.file_name.replace(/\.pptx?$/i, '')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pres.total_slides} slides
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                      
                      {/* Resources in this module */}
                      {module.resources.map((res) => {
                        const Icon = getTypeIcon(res.type);
                        return (
                          <div
                            key={res.id}
                            className="flex items-center gap-3 p-3 text-left bg-accent/5"
                          >
                            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm">
                                {res.title}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {res.type} • After slide {res.show_after_slide}
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
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : allResources.length > 0 ? (
                allResources.map((res) => {
                  const Icon = getTypeIcon(res.type);
                  return (
                    <motion.div
                      key={res.id}
                      className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-lg">
                        {getTypeEmoji(res.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{res.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {res.type} • Module: {res.module_id.slice(0, 8)}...
                        </p>
                      </div>
                      <Badge className="capitalize">{res.type}</Badge>
                    </motion.div>
                  );
                })
              ) : (
                <div className="bg-card rounded-xl border border-border p-6 text-center">
                  <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
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
            <div className="space-y-4">
              {/* Badge Name Section */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-gold" />
                  <h3 className="font-display font-semibold text-foreground">Badge Name</h3>
                </div>
                
                {selectedBadge ? (
                  <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                      🏆
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{selectedBadge}</p>
                      <p className="text-xs text-muted-foreground">Selected badge name for completion</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No badge name has been selected yet.
                  </p>
                )}

                {badgeSuggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Suggested Names ({badgeSuggestions.length})
                    </p>
                    <div className="space-y-2">
                      {badgeSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className={`flex items-center justify-between p-2 rounded-lg border ${
                            suggestion.is_selected 
                              ? 'border-gold/50 bg-gold/5' 
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs capitalize ${
                                suggestion.source === 'teacher' 
                                  ? 'border-accent text-accent' 
                                  : suggestion.source === 'student'
                                    ? 'border-primary text-primary'
                                    : 'border-gold text-gold'
                              }`}
                            >
                              {suggestion.source}
                            </Badge>
                            <span className="text-sm font-medium text-foreground">
                              {suggestion.suggested_name}
                            </span>
                          </div>
                          {suggestion.votes_count > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {suggestion.votes_count} vote{suggestion.votes_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {badgeSuggestions.length === 0 && !selectedBadge && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">
                      Teachers and students can suggest badge names. The admin will select one upon approval.
                    </p>
                  </div>
                )}
              </div>

              {/* Student Reviews Section */}
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">Student Reviews</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No reviews yet - this course is pending approval
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

CoursePreviewPanel.displayName = 'CoursePreviewPanel';

export default CoursePreviewPanel;
