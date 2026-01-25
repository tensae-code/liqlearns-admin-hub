import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Presentation,
  X,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';
import { ParsedSlide } from '@/lib/pptxParser';
import SlideRenderer from './SlideRenderer';
import VideoResource from './resources/VideoResource';
import AudioResource from './resources/AudioResource';
import QuizResource from './resources/QuizResource';
import FlashcardResource from './resources/FlashcardResource';
import { toast } from 'sonner';
import { usePresentationProgress } from '@/hooks/useCourseResources';

interface SlideResource {
  id: string;
  type: 'video' | 'audio' | 'quiz' | 'flashcard';
  title: string;
  showAfterSlide: number;
  showBeforeSlide: number;
  videoUrl?: string;
  audioUrl?: string;
  quizQuestions?: any[];
  flashcards?: any[];
  passingScore?: number;
}

interface PPTXViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationName: string;
  totalSlides: number;
  resources: SlideResource[];
  onComplete?: () => void;
  slides?: ParsedSlide[]; // Real parsed slides
  isLoading?: boolean;
  presentationId?: string;
  courseId?: string;
}

const resourceIcons = {
  video: '🎬',
  audio: '🎧',
  quiz: '📝',
  flashcard: '🃏'
};

const PPTXViewer = ({ 
  open, 
  onOpenChange, 
  presentationName, 
  totalSlides, 
  resources,
  onComplete,
  slides = [],
  isLoading = false,
  presentationId,
  courseId
}: PPTXViewerProps) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeResource, setActiveResource] = useState<SlideResource | null>(null);
  const [completedSlides, setCompletedSlides] = useState<number[]>([]);
  const [completedResources, setCompletedResources] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const startTimeRef = useRef<Date>(new Date());
  const slideStartRef = useRef<Date>(new Date());

  // Track presentation progress
  const { progress, updateProgress } = usePresentationProgress(presentationId, courseId);

  // Initialize from saved progress
  useEffect(() => {
    if (progress) {
      setCurrentSlide(progress.current_slide || 1);
      setCompletedSlides(progress.slides_viewed || []);
      setCompletedResources(progress.resources_completed || []);
    }
  }, [progress]);

  // Save progress on slide change
  useEffect(() => {
    if (!open || !presentationId) return;
    
    const timeSpent = Math.floor((new Date().getTime() - slideStartRef.current.getTime()) / 1000);
    slideStartRef.current = new Date();
    
    updateProgress({
      currentSlide,
      slideViewed: currentSlide,
      timeSpent: timeSpent > 0 ? timeSpent : 0,
    });
  }, [currentSlide, open, presentationId]);

  // Save on close
  useEffect(() => {
    if (!open && presentationId) {
      const totalTime = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
      updateProgress({
        currentSlide,
        timeSpent: totalTime,
        completed: completedSlides.length >= totalSlides,
      });
    }
    if (open) {
      startTimeRef.current = new Date();
      slideStartRef.current = new Date();
    }
  }, [open]);

  const progressPercentage = (completedSlides.length / totalSlides) * 100;
  const currentSlideData = slides.find(s => s.index === currentSlide);
  const hasRealSlides = slides.length > 0;

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      if (currentSlide < totalSlides) {
        goToSlide(currentSlide + 1);
      } else {
        setIsPlaying(false);
      }
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, [isPlaying, currentSlide, totalSlides]);

  const goToSlide = (slide: number) => {
    if (slide < 1 || slide > totalSlides) return;
    
    // Mark current slide as completed if moving forward
    if (slide > currentSlide && !completedSlides.includes(currentSlide)) {
      setCompletedSlides([...completedSlides, currentSlide]);
    }
    
    setCurrentSlide(slide);
    
    // Check for resources that should appear
    const resourceToShow = resources.find(r => 
      slide === r.showAfterSlide && !activeResource
    );
    if (resourceToShow) {
      setActiveResource(resourceToShow);
      setIsPlaying(false); // Pause auto-play when resource appears
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides) {
      goToSlide(currentSlide + 1);
    } else {
      // Mark last slide as completed and call onComplete
      if (!completedSlides.includes(totalSlides)) {
        setCompletedSlides([...completedSlides, totalSlides]);
      }
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    goToSlide(currentSlide - 1);
  };

  const handleResourceComplete = (resourceId: string) => {
    if (!completedResources.includes(resourceId)) {
      setCompletedResources([...completedResources, resourceId]);
      if (presentationId) {
        updateProgress({ resourceCompleted: resourceId });
      }
    }
  };

  const handleDismissResource = () => {
    setActiveResource(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const getCurrentSlideResources = () => {
    return resources.filter(r => 
      currentSlide >= r.showAfterSlide && 
      currentSlide < r.showBeforeSlide
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-full h-screen m-0 rounded-none' : 'max-w-5xl'} p-0`}
        onKeyDown={handleKeyDown}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Presentation className="w-5 h-5 text-accent" />
            <span className="font-medium text-foreground">{presentationName}</span>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative flex-1 bg-muted/30">
          {/* Slide Display */}
          <div className={`${isFullscreen ? 'h-[calc(100vh-140px)]' : 'aspect-video'} bg-card border-b border-border flex items-center justify-center relative overflow-hidden select-none`}>
            {isLoading ? (
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Loading presentation...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {hasRealSlides && currentSlideData ? (
                  <SlideRenderer 
                    key={currentSlide}
                    slide={currentSlideData}
                  />
                ) : (
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {/* Mock slide content */}
                    <div className="text-center">
                      <p className="text-8xl mb-6">📊</p>
                      <p className="text-2xl font-bold text-foreground mb-2">Slide {currentSlide}</p>
                      <p className="text-muted-foreground">
                        {presentationName}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Navigation Arrows */}
            <button
              onClick={handlePrevious}
              disabled={currentSlide === 1 || isLoading}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-card/80 hover:bg-card border border-border shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-card/80 hover:bg-card border border-border shadow-lg disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Resources Indicator */}
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

            {/* Speaker Notes Indicator */}
            {hasRealSlides && currentSlideData?.notes && (
              <div className="absolute bottom-4 left-4">
                <Badge variant="outline" className="bg-card/80">
                  📝 Notes available
                </Badge>
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
                disabled={isLoading}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
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
              {Array.from({ length: totalSlides }, (_, i) => i + 1).map(slide => {
                const hasResource = resources.some(r => 
                  slide >= r.showAfterSlide && slide < r.showBeforeSlide
                );
                const slideData = slides.find(s => s.index === slide);
                const hasThumbnail = slideData?.images?.[0];
                
                return (
                  <button
                    key={slide}
                    onClick={() => goToSlide(slide)}
                    disabled={isLoading}
                    className={`flex-shrink-0 w-16 h-10 rounded border-2 transition-all relative overflow-hidden ${
                      slide === currentSlide
                        ? 'border-accent bg-accent/10'
                        : completedSlides.includes(slide)
                          ? 'border-success/50 bg-success/10'
                          : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {hasThumbnail ? (
                      <img 
                        src={hasThumbnail} 
                        alt={`Slide ${slide}`} 
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-xs font-medium">{slide}</span>
                    )}
                    {hasResource && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resource Modal Overlay */}
        <AnimatePresence>
          {activeResource && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 z-50"
              onClick={handleDismissResource}
            >
              <div onClick={e => e.stopPropagation()}>
                {activeResource.type === 'video' && (
                  <VideoResource
                    title={activeResource.title}
                    videoUrl={activeResource.videoUrl}
                    onComplete={() => {
                      handleResourceComplete(activeResource.id);
                      toast.success('Video completed! +10 XP');
                      handleDismissResource();
                    }}
                    onClose={handleDismissResource}
                  />
                )}
                {activeResource.type === 'audio' && (
                  <AudioResource
                    title={activeResource.title}
                    audioUrl={activeResource.audioUrl}
                    onComplete={() => {
                      handleResourceComplete(activeResource.id);
                      toast.success('Audio completed! +10 XP');
                      handleDismissResource();
                    }}
                    onClose={handleDismissResource}
                  />
                )}
                {activeResource.type === 'quiz' && (
                  <QuizResource
                    title={activeResource.title}
                    questions={activeResource.quizQuestions}
                    passingScore={activeResource.passingScore}
                    onComplete={(score, passed) => {
                      handleResourceComplete(activeResource.id);
                      if (passed) {
                        toast.success(`Quiz passed with ${score}%! +25 XP`);
                      } else {
                        toast.info(`Quiz completed with ${score}%`);
                      }
                      handleDismissResource();
                    }}
                    onClose={handleDismissResource}
                  />
                )}
                {activeResource.type === 'flashcard' && (
                  <FlashcardResource
                    title={activeResource.title}
                    cards={activeResource.flashcards}
                    onComplete={(known, total) => {
                      handleResourceComplete(activeResource.id);
                      toast.success(`Flashcards reviewed! ${known}/${total} mastered. +15 XP`);
                      handleDismissResource();
                    }}
                    onClose={handleDismissResource}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PPTXViewer;
