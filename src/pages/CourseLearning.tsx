import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Play, Pause, Maximize2, Minimize2, BookOpen, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideRenderer from '@/components/course/SlideRenderer';
import VideoResource from '@/components/course/resources/VideoResource';
import AudioResource from '@/components/course/resources/AudioResource';
import QuizResource from '@/components/course/resources/QuizResource';
import FlashcardResource from '@/components/course/resources/FlashcardResource';
import GameResource from '@/components/course/resources/GameResource';
import { usePresentationProgress } from '@/hooks/useCourseResources';
import { toast } from 'sonner';
import { ParsedSlide } from '@/lib/pptxParser';


interface SlideResource {
  id: string;
  type: 'video' | 'audio' | 'quiz' | 'flashcard' | 'game';
  title: string;
  showAfterSlide: number;
  showBeforeSlide: number;
  content?: any;
  fileUrl?: string;
  presentationId?: string;
  moduleId?: string;
}

interface ModuleData {
  id: string;
  moduleId: string;
  title: string;
  slides: ParsedSlide[];
  totalSlides: number;
  filePath: string;
}

const resourceIcons: Record<string, string> = {
  video: '🎬',
  audio: '🎧',
  quiz: '📝',
  flashcard: '🃏',
  game: '🎮'
};

const CourseLearning = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const moduleId = searchParams.get('module');
  const isPreview = searchParams.get('preview') === 'true';

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [currentModule, setCurrentModule] = useState<ModuleData | null>(null);
  const [allModules, setAllModules] = useState<ModuleData[]>([]);
  const [resources, setResources] = useState<SlideResource[]>([]);
  
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeResource, setActiveResource] = useState<SlideResource | null>(null);
  const [pendingResourceQueue, setPendingResourceQueue] = useState<SlideResource[]>([]);
  const [completedSlides, setCompletedSlides] = useState<number[]>([]);
  const [completedResources, setCompletedResources] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [parsedSlides, setParsedSlides] = useState<ParsedSlide[]>([]);
  const [parsingSlides, setParsingSlides] = useState(false);

  const { progress, updateProgress } = usePresentationProgress(currentModule?.id, id);

  // Load course and modules
  useEffect(() => {
    const loadCourseData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [courseResult, presentationsResult, resourcesResult] = await Promise.all([
          supabase.from('courses').select('*').eq('id', id).maybeSingle(),
          supabase.from('module_presentations').select('*').eq('course_id', id).order('created_at'),
          supabase.from('course_resources').select('*').eq('course_id', id).order('order_index')
        ]);

        if (courseResult.data) {
          setCourse(courseResult.data);
        }

        if (presentationsResult.data) {
          const modules: ModuleData[] = presentationsResult.data.map((p: any) => {
            // Parse stored slide data from database
            let slides: ParsedSlide[] = [];
            if (p.slide_data && Array.isArray(p.slide_data)) {
              slides = p.slide_data.map((s: any, idx: number) => ({
                index: s.index || idx + 1,
                title: s.title || `Slide ${idx + 1}`,
                content: s.content || [],
                images: s.images || [],
                shapes: s.shapes || [],
                notes: s.notes || '',
                backgroundColor: s.backgroundColor || '#ffffff',
                backgroundImage: s.backgroundImage,
                layout: s.layout || 'blank'
              }));
            }
            
            return {
              id: p.id,
              moduleId: p.module_id,
              title: p.module_title || p.file_name,
              slides,
              totalSlides: p.total_slides || slides.length || 1,
              filePath: p.file_path
            };
          });
          setAllModules(modules);

          // Find the requested module or default to first
          const targetModule = moduleId 
            ? modules.find(m => m.moduleId === moduleId || m.id === moduleId)
            : modules[0];
          
          if (targetModule) {
            setCurrentModule(targetModule);
          }
        }

        if (resourcesResult.data) {
          // Store all resources - we'll filter them when currentModule is set
          const formattedResources: SlideResource[] = resourcesResult.data.map((r: any) => ({
            id: r.id,
            type: r.type as SlideResource['type'],
            title: r.title,
            showAfterSlide: r.show_after_slide || 0,
            showBeforeSlide: r.show_before_slide || 999,
            content: r.content,
            fileUrl: r.file_url,
            presentationId: r.presentation_id,
            moduleId: r.module_id
          }));
          setResources(formattedResources);
        }
      } catch (err) {
        console.error('Error loading course:', err);
        toast.error('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [id, moduleId]);

  // Use stored slides from module data (already parsed and saved to DB)
  useEffect(() => {
    if (currentModule?.slides && currentModule.slides.length > 0) {
      setParsedSlides(currentModule.slides);
      setParsingSlides(false);
    } else if (currentModule) {
      // Fallback: generate placeholder slides if no slide data
      const placeholderSlides: ParsedSlide[] = [];
      for (let i = 1; i <= currentModule.totalSlides; i++) {
        placeholderSlides.push({
          index: i,
          title: `Slide ${i}`,
          content: [],
          images: [],
          shapes: [],
          notes: '',
          backgroundColor: '#ffffff',
          layout: 'blank'
        });
      }
      setParsedSlides(placeholderSlides);
      setParsingSlides(false);
    } else {
      setParsedSlides([]);
    }
  }, [currentModule]);

  // Initialize from saved progress
  useEffect(() => {
    if (progress) {
      setCurrentSlide(progress.current_slide || 1);
      setCompletedSlides(progress.slides_viewed || []);
      setCompletedResources(progress.resources_completed || []);
    }
  }, [progress]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      if (currentSlide < (currentModule?.totalSlides || 1)) {
        goToSlide(currentSlide + 1);
      } else {
        setIsPlaying(false);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, currentSlide, currentModule?.totalSlides]);

  const totalSlides = currentModule?.totalSlides || 1;
  const progressPercentage = totalSlides > 0 ? Math.round((completedSlides.length / totalSlides) * 100) : 0;
  const currentSlideData = parsedSlides.find(s => s.index === currentSlide);

  // Filter resources for current module
  const moduleResources = resources.filter(r => 
    r.presentationId === currentModule?.id || r.moduleId === currentModule?.moduleId
  );

  // Get resources that should show after a specific slide
  const getResourcesAfterSlide = (slideNum: number) => {
    return moduleResources.filter(r => r.showAfterSlide === slideNum)
      .sort((a, b) => (a.id > b.id ? 1 : -1));
  };

  const goToSlide = async (slide: number, skipResources = false) => {
    if (slide < 1 || slide > totalSlides) return;
    
    // Mark current slide as completed if moving forward
    if (slide > currentSlide && !completedSlides.includes(currentSlide)) {
      const newCompletedSlides = [...completedSlides, currentSlide];
      setCompletedSlides(newCompletedSlides);
      
      // Save to DB
      if (!isPreview && currentModule?.id) {
        try {
          await updateProgress({
            currentSlide: slide,
            slideViewed: currentSlide
          });
        } catch (err) {
          console.error('Failed to save progress:', err);
        }
      }
    }
    
    // Check for resources that should trigger AFTER the current slide (before moving to next)
    if (!skipResources && slide > currentSlide) {
      const resourcesAfterCurrent = getResourcesAfterSlide(currentSlide);
      const unshownResources = resourcesAfterCurrent.filter(r => !completedResources.includes(r.id));
      
      if (unshownResources.length > 0) {
        // Queue up resources and show the first one
        setPendingResourceQueue(unshownResources.slice(1));
        setActiveResource(unshownResources[0]);
        setIsPlaying(false);
        return; // Don't advance slide yet
      }
    }
    
    setCurrentSlide(slide);
    
    // Update current slide position in DB
    if (!isPreview && currentModule?.id) {
      try {
        await updateProgress({
          currentSlide: slide,
          slideViewed: slide
        });
      } catch (err) {
        console.error('Failed to save slide position:', err);
      }
    }
  };

  const handleNext = () => {
    // If there's an active resource modal open, don't advance
    if (activeResource) {
      // Close the modal and let user decide - don't block navigation
      return; 
    }
    
    if (currentSlide < totalSlides) {
      goToSlide(currentSlide + 1);
    } else {
      // Check for resources after last slide
      const resourcesAfterLast = getResourcesAfterSlide(totalSlides);
      const unshownResources = resourcesAfterLast.filter(r => !completedResources.includes(r.id));
      
      if (unshownResources.length > 0) {
        setPendingResourceQueue(unshownResources.slice(1));
        setActiveResource(unshownResources[0]);
        setIsPlaying(false);
        return;
      }
      
      if (!completedSlides.includes(totalSlides)) {
        setCompletedSlides(prev => [...prev, totalSlides]);
      }
      
      // Go to next module or back to course
      const currentIndex = allModules.findIndex(m => m.id === currentModule?.id);
      if (currentIndex >= 0 && currentIndex < allModules.length - 1) {
        const nextModule = allModules[currentIndex + 1];
        navigate(`/course/${id}/learn?module=${nextModule.moduleId}${isPreview ? '&preview=true' : ''}`);
      } else {
        toast.success('Course completed!');
        navigate(`/course/${id}${isPreview ? '?preview=true' : ''}`);
      }
    }
  };

  const handlePrevious = () => {
    goToSlide(currentSlide - 1);
  };

  const handleResourceComplete = async (resourceId: string) => {
    // Update local state immediately
    if (!completedResources.includes(resourceId)) {
      const newCompletedResources = [...completedResources, resourceId];
      setCompletedResources(newCompletedResources);
      
      // Save to DB
      if (!isPreview && currentModule?.id) {
        try {
          await updateProgress({ resourceCompleted: resourceId });
        } catch (err) {
          console.error('Failed to save resource completion:', err);
        }
      }
    }
    
    // Check if there are more resources in the queue
    if (pendingResourceQueue.length > 0) {
      const [nextResource, ...remainingQueue] = pendingResourceQueue;
      setPendingResourceQueue(remainingQueue);
      setActiveResource(nextResource);
    } else {
      setActiveResource(null);
      // Now advance to the next slide
      if (currentSlide < totalSlides) {
        goToSlide(currentSlide + 1, true); // Skip resource check since we just showed them
      } else {
        // Completed last slide and its resources
        if (!completedSlides.includes(totalSlides)) {
          setCompletedSlides(prev => [...prev, totalSlides]);
        }
        
        // Go to next module or back to course
        const currentIndex = allModules.findIndex(m => m.id === currentModule?.id);
        if (currentIndex >= 0 && currentIndex < allModules.length - 1) {
          const nextModule = allModules[currentIndex + 1];
          navigate(`/course/${id}/learn?module=${nextModule.moduleId}${isPreview ? '&preview=true' : ''}`);
        } else {
          toast.success('Course completed!');
          navigate(`/course/${id}${isPreview ? '?preview=true' : ''}`);
        }
      }
    }
  };

  const getCurrentSlideResources = () => {
    return moduleResources.filter(r => 
      currentSlide >= r.showAfterSlide && 
      currentSlide < r.showBeforeSlide
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === 'Escape') {
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-background flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/course/${id}${isPreview ? '?preview=true' : ''}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <BookOpen className="w-5 h-5 text-accent" />
          <div>
            <p className="font-medium text-foreground">{course?.title}</p>
            <p className="text-sm text-muted-foreground">{currentModule?.title}</p>
          </div>
          {isPreview && (
            <Badge variant="outline" className="ml-2">Preview Mode</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              const shareText = `📚 ${course?.title}\n📖 ${currentModule?.title} — Slide ${currentSlide}/${totalSlides}\n\nCheck it out on LiqLearns!`;
              navigate(`/messages?share=${encodeURIComponent(shareText)}`);
            }}
            title="Share to Chat"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Slide Display */}
        <div className={`${isFullscreen ? 'flex-1' : 'aspect-video max-h-[60vh] md:max-h-none'} bg-card border-b border-border flex items-center justify-center relative overflow-hidden`}>
          {parsingSlides ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading slides...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentSlideData ? (
                <SlideRenderer key={currentSlide} slide={currentSlideData} />
              ) : (
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <div className="text-center">
                    <p className="text-8xl mb-6">📊</p>
                    <p className="text-2xl font-bold text-foreground mb-2">Slide {currentSlide}</p>
                    <p className="text-muted-foreground">{currentModule?.title}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Navigation Arrows - touch-optimized for mobile */}
          <button
            onClick={handlePrevious}
            onTouchEnd={(e) => {
              e.preventDefault();
              handlePrevious();
            }}
            disabled={currentSlide === 1}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-4 md:p-3 rounded-full bg-card/90 hover:bg-card active:bg-card/70 border border-border shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all z-30 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 md:w-6 md:h-6" />
          </button>
          <button
            onClick={handleNext}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleNext();
            }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-4 md:p-3 rounded-full bg-card/90 hover:bg-card active:bg-card/70 border border-border shadow-lg transition-all z-30 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 md:w-6 md:h-6" />
          </button>

          {/* Slide Resources */}
          {getCurrentSlideResources().length > 0 && (
            <div className="absolute top-4 right-4 flex gap-2">
              {getCurrentSlideResources().map(resource => (
                <Button
                  key={resource.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveResource(resource)}
                  className="gap-2"
                >
                  <span>{resourceIcons[resource.type]}</span>
                  {resource.title}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex items-center gap-4 mb-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1">
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <span className="text-sm font-medium text-foreground min-w-[80px] text-right">
              {currentSlide} / {totalSlides}
            </span>
          </div>

          {/* Slide Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: totalSlides }, (_, i) => i + 1).map(slide => (
              <button
                key={slide}
                onClick={() => goToSlide(slide)}
                className={`flex-shrink-0 w-16 h-10 rounded border-2 transition-all flex items-center justify-center ${
                  slide === currentSlide
                    ? 'border-accent bg-accent/10'
                    : completedSlides.includes(slide)
                      ? 'border-success/50 bg-success/10'
                      : 'border-border hover:border-accent/50'
                }`}
              >
                <span className="text-xs font-medium">{slide}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Modal */}
      <AnimatePresence>
        {activeResource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 z-50"
            onClick={() => setActiveResource(null)}
          >
            <div onClick={e => e.stopPropagation()}>
              {activeResource.type === 'video' && (
                <VideoResource
                  title={activeResource.title}
                  videoUrl={activeResource.content?.url || activeResource.fileUrl}
                  onComplete={() => {
                    handleResourceComplete(activeResource.id);
                    toast.success('Video completed! +10 XP');
                  }}
                  onClose={() => setActiveResource(null)}
                />
              )}
              {activeResource.type === 'audio' && (
                <AudioResource
                  title={activeResource.title}
                  audioUrl={activeResource.content?.url || activeResource.fileUrl}
                  onComplete={() => {
                    handleResourceComplete(activeResource.id);
                    toast.success('Audio completed! +10 XP');
                  }}
                  onClose={() => setActiveResource(null)}
                />
              )}
              {activeResource.type === 'quiz' && (
                <QuizResource
                  resourceId={activeResource.id}
                  title={activeResource.title}
                  questions={activeResource.content?.questions}
                  passingScore={activeResource.content?.passingScore}
                  isPreview={isPreview}
                  onComplete={(score, passed) => {
                    handleResourceComplete(activeResource.id);
                    if (passed) {
                      toast.success(`Quiz passed with ${score}%! +25 XP`);
                    } else {
                      toast.info(`Quiz completed with ${score}%`);
                    }
                  }}
                  onClose={() => setActiveResource(null)}
                />
              )}
              {activeResource.type === 'flashcard' && (
                <FlashcardResource
                  title={activeResource.title}
                  cards={activeResource.content?.cards}
                  onComplete={(known, total) => {
                    handleResourceComplete(activeResource.id);
                    toast.success(`Flashcards reviewed! ${known}/${total} cards completed.`);
                  }}
                  onClose={() => setActiveResource(null)}
                />
              )}
              {activeResource.type === 'game' && (
                <GameResource
                  title={activeResource.title}
                  gameTemplateId={activeResource.content?.gameTemplateId}
                  onComplete={(score, maxScore) => {
                    handleResourceComplete(activeResource.id);
                    toast.success(`Game completed! ${score}/${maxScore} points earned.`);
                  }}
                  onClose={() => setActiveResource(null)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseLearning;
