import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  FileText, 
  Video, 
  Mic, 
  Image,
  Download,
  Send,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { STAT_GRADIENTS } from '@/lib/theme';

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
}

interface SubmissionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissions: Submission[];
  gradingType: 'pass_fail' | 'letter_grade';
  onGrade: (submissionId: string, grade: string, feedback: string) => void;
}

const LETTER_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];

const SubmissionReviewModal = ({ 
  open, 
  onOpenChange,
  submissions,
  gradingType,
  onGrade
}: SubmissionReviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  const leftIndicatorOpacity = useTransform(x, [-200, -50, 0], [1, 0.5, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 50, 200], [0, 0.5, 1]);

  const currentSubmission = submissions[currentIndex];
  const pendingSubmissions = submissions.filter(s => s.status !== 'graded');

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (gradingType !== 'pass_fail') return;
    
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swiped right - Good Job!
      handleQuickGrade('good_job');
    } else if (info.offset.x < -threshold) {
      // Swiped left - Try Again
      handleQuickGrade('try_again');
    }
  };

  const handleQuickGrade = (grade: 'good_job' | 'try_again') => {
    if (!currentSubmission) return;
    
    const gradeText = grade === 'good_job' ? 'Good Job! 🎉' : 'Try Again 💪';
    onGrade(currentSubmission.id, gradeText, feedback);
    
    toast.success(
      grade === 'good_job' ? 'Great work acknowledged!' : 'Encouragement sent!',
      { description: `${currentSubmission.studentName} will be notified.` }
    );
    
    setFeedback('');
    moveToNext();
  };

  const handleLetterGrade = () => {
    if (!currentSubmission || !selectedGrade) {
      toast.error('Please select a grade');
      return;
    }
    
    onGrade(currentSubmission.id, selectedGrade, feedback);
    toast.success(`Grade ${selectedGrade} submitted!`, {
      description: `${currentSubmission.studentName} will be notified.`
    });
    
    setFeedback('');
    setSelectedGrade(null);
    moveToNext();
  };

  const moveToNext = () => {
    if (currentIndex < submissions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.success('All submissions reviewed! 🎉');
      onOpenChange(false);
    }
  };

  const moveToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const renderFilePreview = () => {
    if (!currentSubmission) return null;
    
    const fileType = currentSubmission.fileType || 'text';
    
    switch (fileType) {
      case 'text':
        return (
          <div className="bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {currentSubmission.content || 
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
              }
            </p>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="bg-muted/30 rounded-lg p-6 flex flex-col items-center justify-center gap-3">
            <FileText className="w-16 h-16 text-destructive/70" />
            <p className="text-sm text-foreground font-medium">Document.pdf</p>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Download to Review
            </Button>
          </div>
        );
      
      case 'audio':
        return (
          <div className="bg-muted/30 rounded-lg p-6 flex flex-col items-center justify-center gap-3">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[1]} flex items-center justify-center`}>
              <Mic className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-foreground font-medium">Audio Recording (2:34)</p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <div className="w-40 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full bg-gradient-to-r ${STAT_GRADIENTS[1]}`}
                  initial={{ width: '0%' }}
                  animate={{ width: isPlaying ? '100%' : '0%' }}
                  transition={{ duration: 154, ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="bg-muted/30 rounded-lg overflow-hidden">
            <div className="aspect-video bg-black/80 flex items-center justify-center relative">
              <Video className="w-16 h-16 text-white/50" />
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-white/20 hover:bg-white/30"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Video Recording (1:45)</span>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
            <div className="relative">
              <Image className="w-32 h-32 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground mt-2">image_submission.jpg</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!open || !currentSubmission) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[currentIndex % 4]} flex items-center justify-center text-white font-bold`}>
                {currentSubmission.studentName.charAt(0)}
              </div>
              <div>
                <h3 className="font-display font-semibold">{currentSubmission.studentName}</h3>
                <p className="text-xs text-muted-foreground">{currentSubmission.assignmentTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentIndex + 1} / {submissions.length}
              </Badge>
              {currentSubmission.status === 'late' && (
                <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">Late</Badge>
              )}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="relative flex-1 overflow-hidden">
            {/* Left/Right Swipe Indicators for pass_fail */}
            {gradingType === 'pass_fail' && (
              <>
                <motion.div 
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                  style={{ opacity: leftIndicatorOpacity }}
                >
                  <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <RotateCcw className="w-5 h-5" />
                    <span className="font-medium">Try Again</span>
                  </div>
                </motion.div>
                <motion.div 
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                  style={{ opacity: rightIndicatorOpacity }}
                >
                  <div className="bg-success text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <span className="font-medium">Good Job!</span>
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                </motion.div>
              </>
            )}

            {/* Content Card - Draggable for pass_fail */}
            <motion.div
              className="p-4 overflow-y-auto h-full"
              style={gradingType === 'pass_fail' ? { x, rotate, opacity } : {}}
              drag={gradingType === 'pass_fail' ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
            >
              {/* Submission Preview */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Submitted {currentSubmission.submittedAt}</p>
                {renderFilePreview()}
              </div>

              {/* Grading Section */}
              {gradingType === 'pass_fail' ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${STAT_GRADIENTS[0]} text-white text-center`}>
                    <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-80" />
                    <p className="font-medium">Swipe to Grade!</p>
                    <p className="text-xs opacity-80 mt-1">
                      ← Try Again 💪 | Good Job! 🎉 →
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-14 gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      onClick={() => handleQuickGrade('try_again')}
                    >
                      <ThumbsDown className="w-5 h-5" />
                      Try Again
                    </Button>
                    <Button 
                      className="h-14 gap-2 bg-success hover:bg-success/90"
                      onClick={() => handleQuickGrade('good_job')}
                    >
                      <ThumbsUp className="w-5 h-5" />
                      Good Job!
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Select Grade</label>
                    <div className="flex flex-wrap gap-2">
                      {LETTER_GRADES.map((grade) => (
                        <motion.button
                          key={grade}
                          className={cn(
                            "px-4 py-2 rounded-lg border font-medium transition-all",
                            selectedGrade === grade
                              ? `bg-gradient-to-br ${STAT_GRADIENTS[2]} text-white border-transparent`
                              : "border-border hover:border-primary/50 text-foreground"
                          )}
                          onClick={() => setSelectedGrade(grade)}
                          whileTap={{ scale: 0.95 }}
                        >
                          {grade}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground block mb-2">Feedback (optional)</label>
                <Textarea 
                  placeholder="Add personalized feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={moveToPrevious}
              disabled={currentIndex === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            
            {gradingType === 'letter_grade' && (
              <Button 
                onClick={handleLetterGrade}
                disabled={!selectedGrade}
                className="gap-2"
              >
                <Send className="w-4 h-4" /> Submit Grade
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={moveToNext}
              className="gap-1"
            >
              Skip <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubmissionReviewModal;
