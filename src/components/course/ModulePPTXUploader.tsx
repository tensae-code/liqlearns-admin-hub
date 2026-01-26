import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileType,
  Presentation,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Eye,
  X,
  GripVertical,
  Loader2,
  Video,
  Music,
  HelpCircle,
  Bookmark,
  SplitSquareVertical,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { parsePPTX, ParsedPresentation, ParsedSlide } from '@/lib/pptxParser';
import SlideRenderer from './SlideRenderer';

interface SlideResource {
  id: string;
  type: 'video' | 'audio' | 'quiz' | 'flashcard';
  title: string;
  showAfterSlide: number;
  showBeforeSlide: number;
  content?: any; // Quiz questions, flashcards, or URL
}

interface LessonBreak {
  id: string;
  afterSlide: number;
  lessonNumber: number;
  title?: string;
}

interface UploadedPPTX {
  id: string;
  fileName: string;
  totalSlides: number;
  uploadedAt: string;
  resources: SlideResource[];
  lessonBreaks: LessonBreak[];
  slides?: ParsedSlide[];
}

interface ModulePPTXUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  onSave: (pptxData: UploadedPPTX) => void;
}

const resourceTypes = [
  { id: 'video', label: 'Video', icon: Video, emoji: '🎬', description: 'YouTube, Vimeo, or direct URL' },
  { id: 'audio', label: 'Audio', icon: Music, emoji: '🎧', description: 'Podcast or audio file' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, emoji: '📝', description: 'Multiple choice questions' },
  { id: 'flashcard', label: 'Flashcards', icon: Sparkles, emoji: '🃏', description: 'Terms and definitions' },
];

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const ModulePPTXUploader = ({ open, onOpenChange, moduleId, moduleName, onSave }: ModulePPTXUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pptxData, setPptxData] = useState<UploadedPPTX | null>(null);
  const [parsedPresentation, setParsedPresentation] = useState<ParsedPresentation | null>(null);
  const [currentPreviewSlide, setCurrentPreviewSlide] = useState(1);
  const [resources, setResources] = useState<SlideResource[]>([]);
  const [lessonBreaks, setLessonBreaks] = useState<LessonBreak[]>([]);
  
  // Resource creation state
  const [showResourceCreator, setShowResourceCreator] = useState(false);
  const [insertAfterSlide, setInsertAfterSlide] = useState<number | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<'video' | 'audio' | 'quiz' | 'flashcard' | null>(null);
  
  // Video/Audio form state
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  
  // Quiz form state
  const [quizTitle, setQuizTitle] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { id: `q-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);
  
  // Flashcard form state
  const [flashcardTitle, setFlashcardTitle] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: `fc-${Date.now()}`, front: '', back: '' }
  ]);
  
  // Unsaved changes dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      toast.error('Please upload a .pptx file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be under 100MB');
      return;
    }

    setIsUploading(true);
    setIsParsing(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      const parsed = await parsePPTX(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setParsedPresentation(parsed);
      
      const pptx: UploadedPPTX = {
        id: `pptx-${Date.now()}`,
        fileName: file.name,
        totalSlides: parsed.totalSlides,
        uploadedAt: new Date().toISOString(),
        resources: [],
        lessonBreaks: [],
        slides: parsed.slides
      };

      setPptxData(pptx);
      setHasUnsavedChanges(true);
      toast.success('PPTX parsed successfully!', {
        description: `${parsed.totalSlides} slides extracted`
      });
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Failed to parse PPTX file', {
        description: 'Please ensure the file is a valid PowerPoint presentation'
      });
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  const handleOpenResourceCreator = (afterSlide: number) => {
    setInsertAfterSlide(afterSlide);
    setShowResourceCreator(true);
    setSelectedResourceType(null);
    resetResourceForms();
  };

  const resetResourceForms = () => {
    setMediaUrl('');
    setMediaTitle('');
    setQuizTitle('');
    setQuizQuestions([{ id: `q-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    setFlashcardTitle('');
    setFlashcards([{ id: `fc-${Date.now()}`, front: '', back: '' }]);
  };

  const handleAddQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }]);
  };

  const handleRemoveQuizQuestion = (index: number) => {
    if (quizQuestions.length > 1) {
      setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
    }
  };

  const handleUpdateQuizQuestion = (index: number, field: string, value: any) => {
    const updated = [...quizQuestions];
    if (field === 'question') {
      updated[index].question = value;
    } else if (field === 'correctAnswer') {
      updated[index].correctAnswer = value;
    }
    setQuizQuestions(updated);
  };

  const handleUpdateQuizOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[oIndex] = value;
    setQuizQuestions(updated);
  };

  const handleAddFlashcard = () => {
    setFlashcards([...flashcards, {
      id: `fc-${Date.now()}`,
      front: '',
      back: ''
    }]);
  };

  const handleRemoveFlashcard = (index: number) => {
    if (flashcards.length > 1) {
      setFlashcards(flashcards.filter((_, i) => i !== index));
    }
  };

  const handleUpdateFlashcard = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  const handleSaveResource = () => {
    if (!selectedResourceType || insertAfterSlide === null) return;

    let resourceContent: any = null;
    let title = '';

    switch (selectedResourceType) {
      case 'video':
      case 'audio':
        if (!mediaUrl.trim()) {
          toast.error('Please enter a URL');
          return;
        }
        title = mediaTitle || `${selectedResourceType === 'video' ? 'Video' : 'Audio'} Resource`;
        resourceContent = { url: mediaUrl };
        break;
      case 'quiz':
        if (!quizTitle.trim()) {
          toast.error('Please enter a quiz title');
          return;
        }
        const validQuestions = quizQuestions.filter(q => q.question.trim() && q.options.some(o => o.trim()));
        if (validQuestions.length === 0) {
          toast.error('Please add at least one question');
          return;
        }
        title = quizTitle;
        resourceContent = { questions: validQuestions };
        break;
      case 'flashcard':
        if (!flashcardTitle.trim()) {
          toast.error('Please enter a flashcard set title');
          return;
        }
        const validCards = flashcards.filter(f => f.front.trim() && f.back.trim());
        if (validCards.length === 0) {
          toast.error('Please add at least one flashcard');
          return;
        }
        title = flashcardTitle;
        resourceContent = { cards: validCards };
        break;
    }

    const resource: SlideResource = {
      id: `res-${Date.now()}`,
      type: selectedResourceType,
      title,
      showAfterSlide: insertAfterSlide,
      showBeforeSlide: insertAfterSlide + 1,
      content: resourceContent
    };

    setResources([...resources, resource]);
    setHasUnsavedChanges(true);
    setShowResourceCreator(false);
    resetResourceForms();
    toast.success('Resource added!');
  };

  const handleRemoveResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!pptxData) return;

    onSave({
      ...pptxData,
      resources,
      lessonBreaks
    });

    setHasUnsavedChanges(false);
    toast.success('Module presentation saved!');
    onOpenChange(false);
    resetState();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
      resetState();
    }
  };

  const resetState = () => {
    setPptxData(null);
    setParsedPresentation(null);
    setResources([]);
    setLessonBreaks([]);
    setCurrentPreviewSlide(1);
    setShowResourceCreator(false);
    setUploadProgress(0);
    setHasUnsavedChanges(false);
    resetResourceForms();
  };

  const getResourcesForSlide = (slideIndex: number) => {
    return resources.filter(r => r.showAfterSlide === slideIndex);
  };

  const getLessonBreakForSlide = (slideIndex: number) => {
    return lessonBreaks.find(lb => lb.afterSlide === slideIndex);
  };

  const handleAddLessonBreak = (afterSlide: number) => {
    // Calculate the next lesson number
    const existingBreaks = lessonBreaks.filter(lb => lb.afterSlide < afterSlide);
    const lessonNumber = existingBreaks.length + 2; // +2 because lesson 1 is before any breaks
    
    const newBreak: LessonBreak = {
      id: `lb-${Date.now()}`,
      afterSlide,
      lessonNumber,
    };
    
    // Recalculate all lesson numbers
    const updatedBreaks = [...lessonBreaks, newBreak]
      .sort((a, b) => a.afterSlide - b.afterSlide)
      .map((lb, index) => ({ ...lb, lessonNumber: index + 2 }));
    
    setLessonBreaks(updatedBreaks);
    setHasUnsavedChanges(true);
    toast.success(`Lesson ${lessonNumber} break added`);
  };

  const handleRemoveLessonBreak = (id: string) => {
    const updatedBreaks = lessonBreaks
      .filter(lb => lb.id !== id)
      .sort((a, b) => a.afterSlide - b.afterSlide)
      .map((lb, index) => ({ ...lb, lessonNumber: index + 2 }));
    
    setLessonBreaks(updatedBreaks);
    setHasUnsavedChanges(true);
  };

  const getCurrentLessonNumber = (slideNum: number) => {
    const breaksBeforeSlide = lessonBreaks.filter(lb => lb.afterSlide < slideNum);
    return breaksBeforeSlide.length + 1;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Presentation className="w-5 h-5 text-accent" />
              Upload Presentation - {moduleName}
            </DialogTitle>
            <DialogDescription>
              Upload a PPTX file and add interactive resources between slides
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Section */}
            {!pptxData && (
              <motion.div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isUploading ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                      <FileType className="w-8 h-8 text-accent animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Processing presentation...</p>
                      <p className="text-sm text-muted-foreground">Extracting slides</p>
                    </div>
                    <Progress value={uploadProgress} className="h-2 max-w-xs mx-auto" />
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Upload PowerPoint</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your .pptx file or click to browse
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Select PPTX File
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      Maximum file size: 100MB
                    </p>
                  </>
                )}
              </motion.div>
            )}

            {/* PPTX Preview & Resources */}
            {pptxData && (
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Presentation className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{pptxData.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {pptxData.totalSlides} slides • {lessonBreaks.length + 1} lessons • {resources.length} resources
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPptxData(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Slide Navigator with Resource Insertion Points */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4" />
                    Slides & Resources
                    {lessonBreaks.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {lessonBreaks.length + 1} Lessons
                      </Badge>
                    )}
                  </h4>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {/* Lesson 1 Header (always exists) */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                      <Bookmark className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Lesson 1</span>
                    </div>

                    {Array.from({ length: pptxData.totalSlides }, (_, i) => i + 1).map((slideNum) => {
                      const lessonBreak = getLessonBreakForSlide(slideNum - 1);
                      
                      return (
                        <div key={slideNum}>
                          {/* Lesson Break indicator */}
                          {lessonBreak && (
                            <div className="flex items-center gap-2 px-3 py-2 my-2 bg-primary/10 rounded-lg border border-primary/20">
                              <Bookmark className="w-4 h-4 text-primary" />
                              <span className="text-sm font-semibold text-primary">Lesson {lessonBreak.lessonNumber}</span>
                              <span className="flex-1" />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveLessonBreak(lessonBreak.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          
                          {/* Add Resource/Lesson Break Button BEFORE slide (except first) */}
                          {slideNum > 1 && !lessonBreak && (
                            <div className="relative py-2 group">
                              <div className="border-t border-dashed border-border" />
                              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-background"
                                  onClick={() => handleOpenResourceCreator(slideNum - 1)}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Resource
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-background border-primary/50 text-primary hover:bg-primary/10"
                                  onClick={() => handleAddLessonBreak(slideNum - 1)}
                                >
                                  <SplitSquareVertical className="w-3 h-3 mr-1" />
                                  Lesson Break
                                </Button>
                              </div>
                              
                              {/* Show existing resources at this position */}
                              {getResourcesForSlide(slideNum - 1).map((res) => (
                                <div key={res.id} className="mx-8 my-2 flex items-center gap-2 p-2 bg-accent/10 rounded-lg border border-accent/20">
                                  <span className="text-lg">
                                    {resourceTypes.find(t => t.id === res.type)?.emoji}
                                  </span>
                                  <span className="flex-1 text-sm font-medium text-foreground">{res.title}</span>
                                  <Badge variant="secondary" className="text-xs">{res.type}</Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveResource(res.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* When there is a lesson break, still show resources */}
                          {slideNum > 1 && lessonBreak && getResourcesForSlide(slideNum - 1).length > 0 && (
                            <div className="relative py-2 group">
                              {getResourcesForSlide(slideNum - 1).map((res) => (
                                <div key={res.id} className="mx-8 my-2 flex items-center gap-2 p-2 bg-accent/10 rounded-lg border border-accent/20">
                                  <span className="text-lg">
                                    {resourceTypes.find(t => t.id === res.type)?.emoji}
                                  </span>
                                  <span className="flex-1 text-sm font-medium text-foreground">{res.title}</span>
                                  <Badge variant="secondary" className="text-xs">{res.type}</Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveResource(res.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Slide Preview Card */}
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              currentPreviewSlide === slideNum 
                                ? 'bg-accent/10 border border-accent/30' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setCurrentPreviewSlide(slideNum)}
                          >
                            <div className="w-16 h-10 bg-card border border-border rounded flex items-center justify-center text-sm font-medium">
                              {slideNum}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {parsedPresentation?.slides[slideNum - 1]?.title || `Slide ${slideNum}`}
                              </p>
                            </div>
                            {currentPreviewSlide === slideNum && (
                              <Eye className="w-4 h-4 text-accent" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Add resource/lesson break after last slide */}
                    <div className="relative py-2 group">
                      <div className="border-t border-dashed border-border" />
                      <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-background"
                          onClick={() => handleOpenResourceCreator(pptxData.totalSlides)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Resource
                        </Button>
                      </div>
                      {getResourcesForSlide(pptxData.totalSlides).map((res) => (
                        <div key={res.id} className="mx-8 my-2 flex items-center gap-2 p-2 bg-accent/10 rounded-lg border border-accent/20">
                          <span className="text-lg">
                            {resourceTypes.find(t => t.id === res.type)?.emoji}
                          </span>
                          <span className="flex-1 text-sm font-medium text-foreground">{res.title}</span>
                          <Badge variant="secondary" className="text-xs">{res.type}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveResource(res.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Large Slide Preview */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Slide Preview
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPreviewSlide(Math.max(1, currentPreviewSlide - 1))}
                        disabled={currentPreviewSlide === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-foreground px-3">
                        {currentPreviewSlide} / {pptxData.totalSlides}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPreviewSlide(Math.min(pptxData.totalSlides, currentPreviewSlide + 1))}
                        disabled={currentPreviewSlide === pptxData.totalSlides}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="aspect-video bg-card border border-border rounded-lg flex items-center justify-center overflow-hidden">
                    {parsedPresentation && parsedPresentation.slides[currentPreviewSlide - 1] ? (
                      <SlideRenderer 
                        slide={parsedPresentation.slides[currentPreviewSlide - 1]}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-6xl mb-4">📊</p>
                        <p className="text-muted-foreground">Slide {currentPreviewSlide}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-gradient-accent">
                    Save Presentation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resource Creator Dialog */}
      <Dialog open={showResourceCreator} onOpenChange={setShowResourceCreator}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add Resource {insertAfterSlide !== null && `after Slide ${insertAfterSlide}`}
            </DialogTitle>
            <DialogDescription>
              Choose a resource type and configure it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resource Type Selection */}
            {!selectedResourceType && (
              <div className="grid grid-cols-2 gap-4">
                {resourceTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedResourceType(type.id as any)}
                    className="p-4 rounded-xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-all text-left group"
                  >
                    <div className="text-3xl mb-2">{type.emoji}</div>
                    <h4 className="font-semibold text-foreground group-hover:text-accent">{type.label}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Video/Audio Form */}
            {(selectedResourceType === 'video' || selectedResourceType === 'audio') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedResourceType(null)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold text-foreground">
                    {resourceTypes.find(t => t.id === selectedResourceType)?.emoji} Add {selectedResourceType === 'video' ? 'Video' : 'Audio'}
                  </h4>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={mediaTitle}
                    onChange={(e) => setMediaTitle(e.target.value)}
                    placeholder={`e.g., ${selectedResourceType === 'video' ? 'Introduction Video' : 'Audio Lesson'}`}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>URL</Label>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={selectedResourceType === 'video' 
                      ? 'https://youtube.com/watch?v=... or https://vimeo.com/...'
                      : 'https://soundcloud.com/... or direct audio URL'}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedResourceType === 'video' 
                      ? 'Supports YouTube, Vimeo, and direct video URLs'
                      : 'Supports SoundCloud, Spotify, and direct audio URLs'}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowResourceCreator(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveResource}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add {selectedResourceType === 'video' ? 'Video' : 'Audio'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Quiz Form */}
            {selectedResourceType === 'quiz' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedResourceType(null)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold text-foreground">📝 Create Quiz</h4>
                </div>

                <div>
                  <Label>Quiz Title</Label>
                  <Input
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g., Chapter 1 Review"
                    className="mt-1"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Questions</Label>
                    <Button variant="outline" size="sm" onClick={handleAddQuizQuestion}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Question
                    </Button>
                  </div>

                  {quizQuestions.map((q, qIndex) => (
                    <div key={q.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Question {qIndex + 1}</Label>
                        {quizQuestions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleRemoveQuizQuestion(qIndex)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={q.question}
                        onChange={(e) => handleUpdateQuizQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter your question..."
                      />
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Options (select correct answer)</Label>
                        <RadioGroup
                          value={q.correctAnswer.toString()}
                          onValueChange={(v) => handleUpdateQuizQuestion(qIndex, 'correctAnswer', parseInt(v))}
                        >
                          {q.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                              <Input
                                value={option}
                                onChange={(e) => handleUpdateQuizOption(qIndex, oIndex, e.target.value)}
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
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowResourceCreator(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveResource}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quiz
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Flashcard Form */}
            {selectedResourceType === 'flashcard' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedResourceType(null)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold text-foreground">🃏 Create Flashcards</h4>
                </div>

                <div>
                  <Label>Flashcard Set Title</Label>
                  <Input
                    value={flashcardTitle}
                    onChange={(e) => setFlashcardTitle(e.target.value)}
                    placeholder="e.g., Vocabulary Set 1"
                    className="mt-1"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Cards</Label>
                    <Button variant="outline" size="sm" onClick={handleAddFlashcard}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Card
                    </Button>
                  </div>

                  {flashcards.map((card, index) => (
                    <div key={card.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Card {index + 1}</Label>
                        {flashcards.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleRemoveFlashcard(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Front (Term)</Label>
                          <Input
                            value={card.front}
                            onChange={(e) => handleUpdateFlashcard(index, 'front', e.target.value)}
                            placeholder="Term or question"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Back (Definition)</Label>
                          <Input
                            value={card.back}
                            onChange={(e) => handleUpdateFlashcard(index, 'back', e.target.value)}
                            placeholder="Definition or answer"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowResourceCreator(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveResource}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Flashcards
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedDialog(false);
              onOpenChange(false);
              resetState();
            }}>
              Discard
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowUnsavedDialog(false);
              handleSave();
            }}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ModulePPTXUploader;
