import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  FileText, 
  Video, 
  Mic, 
  Image, 
  ChevronRight,
  Sparkles,
  ThumbsUp,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { STAT_GRADIENTS } from '@/lib/theme';

interface CreateAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses?: { id: string; title: string }[];
}

type GradingType = 'pass_fail' | 'letter_grade';
type SubmissionType = 'text' | 'file' | 'audio' | 'video';

const LETTER_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];

const CreateAssignmentModal = ({ 
  open, 
  onOpenChange,
  courses = [
    { id: '1', title: 'Amharic for Beginners' },
    { id: '2', title: 'Ethiopian History' },
    { id: '3', title: 'Business Amharic' },
    { id: '4', title: 'Kids Amharic Fun' },
  ]
}: CreateAssignmentModalProps) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [gradingType, setGradingType] = useState<GradingType>('pass_fail');
  const [submissionTypes, setSubmissionTypes] = useState<SubmissionType[]>(['text', 'file']);
  const [maxPoints, setMaxPoints] = useState(100);

  const toggleSubmissionType = (type: SubmissionType) => {
    setSubmissionTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error('Please enter an assignment title');
      return;
    }
    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }
    
    toast.success('Assignment created!', { 
      description: `"${title}" has been published. Students will be notified.`
    });
    
    // Reset form
    setStep(1);
    setTitle('');
    setDueDate('');
    setInstructions('');
    setGradingType('pass_fail');
    setSubmissionTypes(['text', 'file']);
    onOpenChange(false);
  };

  const submissionTypeOptions = [
    { type: 'text' as SubmissionType, icon: FileText, label: 'Text/Essay' },
    { type: 'file' as SubmissionType, icon: Image, label: 'File Upload' },
    { type: 'audio' as SubmissionType, icon: Mic, label: 'Audio Recording' },
    { type: 'video' as SubmissionType, icon: Video, label: 'Video Recording' },
  ];

  if (!open) return null;

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
          className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STAT_GRADIENTS[1]} flex items-center justify-center`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">Create Assignment</h3>
                <p className="text-xs text-muted-foreground">Step {step} of 2</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-muted shrink-0">
            <motion.div 
              className={`h-full bg-gradient-to-r ${STAT_GRADIENTS[1]}`}
              initial={{ width: '50%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Assignment Title *</label>
                    <Input 
                      placeholder="e.g., Week 3: Essay on Ethiopian History" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Course *</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Due Date *</label>
                    <Input 
                      type="datetime-local" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Instructions</label>
                    <Textarea 
                      placeholder="Enter assignment instructions and requirements..." 
                      rows={4}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Grading Type */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-3">How will you grade this?</label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        className={cn(
                          "relative p-4 rounded-xl border-2 text-left transition-all",
                          gradingType === 'pass_fail' 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setGradingType('pass_fail')}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-10 h-10 rounded-lg mb-2 flex items-center justify-center bg-gradient-to-br ${STAT_GRADIENTS[0]}`}>
                          <ThumbsUp className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-medium text-foreground">Swipe Grading</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          "Good Job! 🎉" or "Try Again 💪"
                        </p>
                        {gradingType === 'pass_fail' && (
                          <motion.div
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Sparkles className="w-3 h-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>

                      <motion.button
                        className={cn(
                          "relative p-4 rounded-xl border-2 text-left transition-all",
                          gradingType === 'letter_grade' 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setGradingType('letter_grade')}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-10 h-10 rounded-lg mb-2 flex items-center justify-center bg-gradient-to-br ${STAT_GRADIENTS[2]}`}>
                          <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-medium text-foreground">Letter Grades</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          A+ to C- (60%+ only)
                        </p>
                        {gradingType === 'letter_grade' && (
                          <motion.div
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Sparkles className="w-3 h-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    </div>

                    {/* Letter grade preview */}
                    {gradingType === 'letter_grade' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <p className="text-xs text-muted-foreground mb-2">Available grades:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {LETTER_GRADES.map((grade) => (
                            <Badge 
                              key={grade} 
                              variant="outline" 
                              className="bg-card text-xs"
                            >
                              {grade}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Submission Types */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-3">Accepted submission types</label>
                    <div className="grid grid-cols-2 gap-2">
                      {submissionTypeOptions.map(({ type, icon: Icon, label }) => (
                        <motion.button
                          key={type}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all",
                            submissionTypes.includes(type)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => toggleSubmissionType(type)}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            submissionTypes.includes(type)
                              ? `bg-gradient-to-br ${STAT_GRADIENTS[1]}`
                              : "bg-muted"
                          )}>
                            <Icon className={cn(
                              "w-4 h-4",
                              submissionTypes.includes(type) ? "text-white" : "text-muted-foreground"
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm",
                            submissionTypes.includes(type) ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Preview Card */}
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${STAT_GRADIENTS[3]} text-white`}>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Assignment Preview
                    </h4>
                    <div className="text-sm opacity-90 space-y-1">
                      <p><strong>Title:</strong> {title || 'Untitled Assignment'}</p>
                      <p><strong>Grading:</strong> {gradingType === 'pass_fail' ? 'Swipe (Good Job / Try Again)' : 'Letter Grades (A+ to C-)'}</p>
                      <p><strong>Accepts:</strong> {submissionTypes.map(t => 
                        t === 'text' ? 'Text' : t === 'file' ? 'Files' : t === 'audio' ? 'Audio' : 'Video'
                      ).join(', ') || 'None selected'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-2 shrink-0">
            {step === 1 ? (
              <>
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => {
                    if (!title.trim()) {
                      toast.error('Please enter an assignment title');
                      return;
                    }
                    setStep(2);
                  }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleCreate}>
                  <Plus className="w-4 h-4" /> Create Assignment
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateAssignmentModal;
