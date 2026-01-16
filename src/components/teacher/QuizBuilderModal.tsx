import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  GripVertical,
  CheckCircle,
  X,
  Save,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { QuizQuestion, useCourseResources } from '@/hooks/useCourseResources';

interface QuizBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  moduleId: string;
  presentationId?: string;
  showAfterSlide: number;
  showBeforeSlide: number;
  totalSlides: number;
  onSave?: () => void;
}

const QuizBuilderModal = ({
  open,
  onOpenChange,
  courseId,
  moduleId,
  presentationId,
  showAfterSlide,
  showBeforeSlide,
  totalSlides,
  onSave,
}: QuizBuilderModalProps) => {
  const { createQuiz } = useCourseResources();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('Quiz must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const validateQuiz = (): boolean => {
    if (!title.trim()) {
      toast.error('Please enter a quiz title');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return false;
      }
      const filledOptions = q.options.filter(o => o.trim());
      if (filledOptions.length < 2) {
        toast.error(`Question ${i + 1} needs at least 2 options`);
        return false;
      }
      if (!q.options[q.correctAnswer]?.trim()) {
        toast.error(`Question ${i + 1}: correct answer option is empty`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateQuiz()) return;

    setIsSubmitting(true);
    try {
      // Clean up questions - remove empty options
      const cleanedQuestions = questions.map(q => ({
        ...q,
        options: q.options.filter(o => o.trim()),
      }));

      await createQuiz(
        title,
        cleanedQuestions,
        passingScore,
        courseId,
        moduleId,
        showAfterSlide,
        showBeforeSlide,
        presentationId
      );

      toast.success('Quiz created successfully!');
      onOpenChange(false);
      onSave?.();
      
      // Reset form
      setTitle('');
      setPassingScore(70);
      setQuestions([{
        id: `q-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
      }]);
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="w-5 h-5 text-accent" />
            Create Quiz
          </DialogTitle>
          <DialogDescription>
            Build a quiz with multiple choice questions to test student knowledge
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quiz Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Quiz Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Module 1 Review Quiz"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Passing Score (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Show After Slide</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={1}
                  max={totalSlides}
                  value={showAfterSlide}
                  disabled
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="number"
                  min={1}
                  max={totalSlides}
                  value={showBeforeSlide}
                  disabled
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Questions ({questions.length})
              </h3>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>

            <AnimatePresence>
              {questions.map((q, qIndex) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 bg-muted/30 rounded-lg border border-border space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <span className="font-medium text-foreground">Q{qIndex + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label>Question *</Label>
                    <Textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      placeholder="Enter your question here..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Options (select the correct answer)</Label>
                    <RadioGroup
                      value={q.correctAnswer.toString()}
                      onValueChange={(v) => updateQuestion(qIndex, 'correctAnswer', parseInt(v))}
                    >
                      {q.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            className={`flex-1 ${
                              q.correctAnswer === oIndex && option.trim()
                                ? 'border-success bg-success/5'
                                : ''
                            }`}
                          />
                          {q.correctAnswer === oIndex && option.trim() && (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Explanation (optional)</Label>
                    <Textarea
                      value={q.explanation || ''}
                      onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                      placeholder="Explain why the correct answer is correct..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Quiz
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizBuilderModal;
