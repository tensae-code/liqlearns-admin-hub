import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  BookOpen,
  DollarSign,
  Image,
  Plus,
  X,
  Sparkles,
  Clock,
  Target,
  Save,
  Eye,
  Presentation,
  Layers,
  Trash2,
  Upload,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import ModulePPTXUploader from '@/components/course/ModulePPTXUploader';

interface EditCourse {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  price?: number;
  estimated_duration?: number;
  submission_status?: string;
  thumbnail_url?: string;
  gallery_images?: string[];
}

interface CreateCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCourse?: EditCourse | null;
}

interface SlideResource {
  id: string;
  type: 'video' | 'audio' | 'quiz' | 'flashcard';
  title: string;
  showAfterSlide: number;
  showBeforeSlide: number;
  content?: any;
}

interface LessonBreak {
  id: string;
  afterSlide: number;
  lessonNumber: number;
  title: string;
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  hasPPTX: boolean;
  pptxFileName?: string;
  totalSlides?: number;
  pptxFile?: File;
  slides?: any[];
  resources?: SlideResource[];
  lessonBreaks?: LessonBreak[];
}

const courseEmojis = ['📚', '🎯', '💡', '🌟', '🔥', '🚀', '💻', '🎨', '🎵', '📖', '✏️', '🧠'];

const categories = [
  { id: 'language', label: 'Language' },
  { id: 'business', label: 'Business' },
  { id: 'technology', label: 'Technology' },
  { id: 'culture', label: 'Culture & History' },
  { id: 'kids', label: 'Kids' },
  { id: 'professional', label: 'Professional Development' },
];

const difficulties = [
  { id: 'beginner', label: 'Beginner', color: 'bg-success/10 text-success' },
  { id: 'intermediate', label: 'Intermediate', color: 'bg-gold/10 text-gold' },
  { id: 'advanced', label: 'Advanced', color: 'bg-destructive/10 text-destructive' },
];

const CreateCourseModal = ({ open, onOpenChange, editCourse }: CreateCourseModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    price: '',
    isFree: true,
    thumbnail_emoji: '📚',
    estimatedDuration: '',
    objectives: [''],
    thumbnail_url: '',
    gallery_images: [] as string[],
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [pptxUploaderOpen, setPptxUploaderOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [newModuleName, setNewModuleName] = useState('');

  const [isLoadingModules, setIsLoadingModules] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editCourse && open) {
      setFormData({
        title: editCourse.title || '',
        description: editCourse.description || '',
        category: editCourse.category || '',
        difficulty: editCourse.difficulty || 'beginner',
        price: editCourse.price?.toString() || '',
        isFree: !editCourse.price || editCourse.price === 0,
        thumbnail_emoji: '📚',
        estimatedDuration: editCourse.estimated_duration?.toString() || '',
        objectives: [''],
        thumbnail_url: editCourse.thumbnail_url || '',
        gallery_images: editCourse.gallery_images || [],
      });

      // Fetch existing modules/presentations when editing
      const fetchExistingModules = async () => {
        setIsLoadingModules(true);
        try {
          // Fetch presentations for this course
          const { data: presentations, error: presError } = await supabase
            .from('module_presentations')
            .select('*')
            .eq('course_id', editCourse.id)
            .order('created_at', { ascending: true });

          if (presError) {
            console.error('Error fetching presentations:', presError);
            return;
          }

          if (presentations && presentations.length > 0) {
            // Fetch resources for this course
            const { data: resources, error: resError } = await supabase
              .from('course_resources')
              .select('*')
              .eq('course_id', editCourse.id);

            if (resError) {
              console.error('Error fetching resources:', resError);
            }

            // Map presentations to CourseModule format
            const loadedModules: CourseModule[] = presentations.map((pres) => {
              // Get resources for this module
              const moduleResources = (resources || [])
                .filter((r) => r.module_id === pres.module_id)
                .map((r) => ({
                  id: r.id,
                  type: r.type as 'video' | 'audio' | 'quiz' | 'flashcard',
                  title: r.title,
                  showAfterSlide: r.show_after_slide,
                  showBeforeSlide: r.show_before_slide,
                  content: r.content,
                }));

              // Parse lesson breaks from the presentation
              const lessonBreaks = Array.isArray(pres.lesson_breaks) 
                ? (pres.lesson_breaks as unknown as LessonBreak[])
                : [];

              return {
                id: pres.module_id,
                title: pres.module_title || pres.file_name?.replace('.pptx', '') || 'Module',
                description: '',
                hasPPTX: true,
                pptxFileName: pres.file_name,
                totalSlides: pres.total_slides,
                slides: Array.isArray(pres.slide_data) ? pres.slide_data : [],
                resources: moduleResources,
                lessonBreaks: lessonBreaks,
              };
            });

            setModules(loadedModules);
          }
        } catch (error) {
          console.error('Error loading existing modules:', error);
        } finally {
          setIsLoadingModules(false);
        }
      };

      fetchExistingModules();
    } else if (!open) {
      // Reset when closing
      resetForm();
    }
  }, [editCourse, open]);

  const handleAddObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, ''],
    });
  };

  const handleRemoveObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_, i) => i !== index),
    });
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const handleAddModule = () => {
    if (!newModuleName.trim()) {
      toast.error('Please enter a module name');
      return;
    }
    const newModule: CourseModule = {
      id: crypto.randomUUID(),
      title: newModuleName,
      description: '',
      hasPPTX: false,
    };
    setModules([...modules, newModule]);
    setNewModuleName('');
  };

  const handleRemoveModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const handleOpenPPTXUploader = (module: CourseModule) => {
    setSelectedModule(module);
    setPptxUploaderOpen(true);
  };

  const handlePPTXSave = (pptxData: any) => {
    if (!selectedModule) return;
    setModules(modules.map(m => 
      m.id === selectedModule.id 
        ? { 
            ...m, 
            hasPPTX: true, 
            pptxFileName: pptxData.fileName, 
            totalSlides: pptxData.totalSlides,
            slides: pptxData.slides,
            resources: pptxData.resources || [],
            lessonBreaks: pptxData.lessonBreaks || []
          }
        : m
    ));
    setSelectedModule(null);
  };

  const handleSubmit = async (submitForReview: boolean = false) => {
    if (!formData.title || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a course');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get the user's profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('Could not find your profile');
      }

      // When editing an approved course, it needs re-approval
      const wasApproved = editCourse?.submission_status === 'approved';
      const needsReApproval = wasApproved && submitForReview;

      const courseData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        difficulty: formData.difficulty,
        price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
        estimated_duration: parseInt(formData.estimatedDuration) || null,
        total_lessons: modules.length,
        submission_status: submitForReview ? 'submitted' : 'draft',
        submitted_at: submitForReview ? new Date().toISOString() : null,
        rejection_reason: submitForReview ? null : undefined,
        // Unpublish if needs re-approval
        is_published: needsReApproval ? false : undefined,
        // Clear previous review data when resubmitting
        reviewed_at: submitForReview ? null : undefined,
        reviewed_by: submitForReview ? null : undefined,
        claimed_by: submitForReview ? null : undefined,
        claimed_at: submitForReview ? null : undefined,
        thumbnail_url: formData.thumbnail_url || null,
        gallery_images: formData.gallery_images.length > 0 ? formData.gallery_images : null,
      };

      let course;

      if (editCourse) {
        // Update existing course
        const { data, error: courseError } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editCourse.id)
          .select()
          .single();

        if (courseError) throw courseError;
        course = data;
      } else {
        // Create new course
        const { data, error: courseError } = await supabase
          .from('courses')
          .insert({
            ...courseData,
            instructor_id: profile.id,
            is_published: false,
          })
          .select()
          .single();

        if (courseError) throw courseError;
        course = data;
      }

      // Create lessons/modules for the course (only for new courses)
      if (modules.length > 0 && course && !editCourse) {
        const lessonsToCreate = modules.map((module, index) => ({
          course_id: course.id,
          title: module.title,
          description: module.description || null,
          order_index: index + 1,
          is_published: false,
        }));

        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonsToCreate);

        if (lessonsError) {
          console.error('Error creating lessons:', lessonsError);
        }
      }

      // Save presentations and resources for modules with PPTX data (in parallel)
      const modulesWithPPTX = modules.filter(m => m.hasPPTX && m.slides && course);
      
      // When editing, we need to delete old presentations/resources first and re-insert
      if (editCourse && modulesWithPPTX.length > 0) {
        // Delete existing resources for this course
        await supabase
          .from('course_resources')
          .delete()
          .eq('course_id', course!.id);
        
        // Delete existing presentations for this course
        await supabase
          .from('module_presentations')
          .delete()
          .eq('course_id', course!.id);
      }
      
      await Promise.all(modulesWithPPTX.map(async (module) => {
        // Save presentation to module_presentations with lesson breaks
        const { data: presentation, error: presError } = await supabase
          .from('module_presentations')
          .insert([{
            module_id: module.id,
            course_id: course!.id,
            file_name: module.pptxFileName || 'presentation.pptx',
            file_path: `${course!.id}/${module.id}/presentation.pptx`,
            total_slides: module.totalSlides || 0,
            slide_data: module.slides as unknown as Json,
            resources: (module.resources || []) as unknown as Json,
            lesson_breaks: (module.lessonBreaks || []) as unknown as Json,
            module_title: module.title,
            uploaded_by: profile.id,
          }])
          .select()
          .single();

        if (presError) {
          console.error('Error saving presentation:', presError);
          return;
        }

        // Save individual resources to course_resources table
        if (module.resources && module.resources.length > 0 && presentation) {
          const resourcesToCreate = module.resources.map((res, index) => ({
            course_id: course!.id,
            module_id: module.id,
            presentation_id: presentation.id,
            type: res.type,
            title: res.title,
            show_after_slide: res.showAfterSlide,
            show_before_slide: res.showBeforeSlide,
            content: (res.content || {}) as unknown as Json,
            order_index: index,
            created_by: profile.id,
          }));

          const { error: resError } = await supabase
            .from('course_resources')
            .insert(resourcesToCreate);

          if (resError) {
            console.error('Error saving resources:', resError);
          }
        }
      }));

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });

      const actionType = editCourse ? 'updated' : 'created';
      if (submitForReview) {
        toast.success(`Course ${actionType} and submitted for review!`, {
          description: 'An admin will review your course and approve it for publishing.',
        });
      } else {
        toast.success(`Course ${actionType} as draft!`, {
          description: 'You can continue editing and submit for review when ready.',
        });
      }
      
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(`Failed to ${editCourse ? 'update' : 'create'} course`, {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      title: '',
      description: '',
      category: '',
      difficulty: 'beginner',
      price: '',
      isFree: true,
      thumbnail_emoji: '📚',
      estimatedDuration: '',
      objectives: [''],
      thumbnail_url: '',
      gallery_images: [],
    });
    setModules([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `course-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (isThumbnail) {
        setFormData({ ...formData, thumbnail_url: publicUrl });
      } else {
        setFormData({ 
          ...formData, 
          gallery_images: [...formData.gallery_images, publicUrl] 
        });
      }
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      gallery_images: formData.gallery_images.filter((_, i) => i !== index)
    });
  };

  const handleSaveDraft = async () => {
    if (!formData.title) {
      toast.error('Please enter a course title to save as draft');
      return;
    }
    await handleSubmit(false);
  };

  const handleSubmitForReview = async () => {
    if (!formData.title || !formData.category) {
      toast.error('Please fill in all required fields before submitting');
      return;
    }
    await handleSubmit(true);
  };

  const wasApprovedCourse = editCourse?.submission_status === 'approved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-accent" />
            {editCourse ? 'Edit Course' : 'Create New Course'}
          </DialogTitle>
          <DialogDescription>
            {editCourse 
              ? 'Update your course details. You can save as draft or submit for review.'
              : 'Fill in the details to create your new course. You can save as draft anytime.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Re-approval Warning */}
        {wasApprovedCourse && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
            <strong>Note:</strong> Editing an approved course will require re-approval before changes go live.
          </div>
        )}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 h-2 rounded-full transition-all ${
                step >= s ? 'bg-accent' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  Basic Information
                </h3>

                {/* Course Thumbnail Upload */}
                <div>
                  <Label>Course Cover Image *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    This is the main image students will see (required)
                  </p>
                  <div className="flex gap-4">
                    {formData.thumbnail_url ? (
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                        <img 
                          src={formData.thumbnail_url} 
                          alt="Course thumbnail" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
                          className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-20 rounded-lg border-2 border-dashed border-border hover:border-accent/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-muted/30">
                        {isUploadingImage ? (
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Image className="w-5 h-5 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, true)}
                          disabled={isUploadingImage}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Gallery Images */}
                <div>
                  <Label>Gallery Images (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add more preview images that students can scroll through
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.gallery_images.map((url, index) => (
                      <div key={index} className="relative w-20 h-14 rounded-lg overflow-hidden border border-border">
                        <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveGalleryImage(index)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    ))}
                    {formData.gallery_images.length < 5 && (
                      <label className="w-20 h-14 rounded-lg border-2 border-dashed border-border hover:border-accent/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-muted/30">
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, false)}
                          disabled={isUploadingImage}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Emoji Selection (fallback) */}
                <div>
                  <Label>Course Icon (fallback if no image)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {courseEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setFormData({ ...formData, thumbnail_emoji: emoji })}
                        className={`w-10 h-10 text-xl rounded-lg border-2 transition-all hover:scale-110 ${
                          formData.thumbnail_emoji === emoji
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Amharic for Beginners"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What will students learn in this course?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((diff) => (
                          <SelectItem key={diff.id} value={diff.id}>
                            <div className="flex items-center gap-2">
                              <Badge className={diff.color} variant="secondary">
                                {diff.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleSaveDraft}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => setStep(2)}>
                  Next Step
                </Button>
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
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  Pricing & Duration
                </h3>

                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <Switch
                    id="free"
                    checked={formData.isFree}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                  />
                  <Label htmlFor="free" className="cursor-pointer">
                    <p className="font-medium">Free Course</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.isFree 
                        ? 'This course will be available for free' 
                        : 'Set a price for this course'}
                    </p>
                  </Label>
                </div>

                {!formData.isFree && (
                  <div>
                    <Label htmlFor="price">Price (ETB)</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="duration">Estimated Duration (hours)</Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="duration"
                      type="number"
                      placeholder="e.g., 10"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Next Step
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  Learning Objectives
                </h3>

                <p className="text-sm text-muted-foreground">
                  What will students be able to do after completing this course?
                </p>

                <div className="space-y-3">
                  {formData.objectives.map((obj, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Objective ${index + 1}`}
                        value={obj}
                        onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      />
                      {formData.objectives.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveObjective(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={handleAddObjective}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Objective
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Course Preview
                </h4>
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{formData.thumbnail_emoji}</span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {formData.title || 'Untitled Course'}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {formData.description || 'No description yet'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {categories.find(c => c.id === formData.category)?.label || 'Category'}
                      </Badge>
                      <Badge className={difficulties.find(d => d.id === formData.difficulty)?.color}>
                        {difficulties.find(d => d.id === formData.difficulty)?.label}
                      </Badge>
                      {formData.isFree ? (
                        <Badge className="bg-success/10 text-success">Free</Badge>
                      ) : (
                        <Badge variant="outline">{formData.price || '0'} ETB</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft}>
                    <Save className="w-4 h-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button onClick={() => setStep(4)}>
                    Next: Add Modules
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  Course Modules
                </h3>

                <p className="text-sm text-muted-foreground">
                  Add modules and upload presentations for each. You can add resources between slides.
                </p>

                {/* Add Module */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter module name (e.g., Introduction to Basics)"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
                  />
                  <Button onClick={handleAddModule}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Modules List */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {isLoadingModules ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                      <Loader2 className="w-10 h-10 mx-auto mb-2 opacity-50 animate-spin" />
                      <p>Loading existing modules...</p>
                    </div>
                  ) : modules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                      <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No modules added yet</p>
                      <p className="text-sm">Add your first module above</p>
                    </div>
                  ) : (
                    modules.map((module, index) => (
                      <div
                        key={module.id}
                        className="p-4 bg-card border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center font-bold text-accent">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{module.title}</p>
                            {module.hasPPTX ? (
                              <p className="text-xs text-success flex items-center gap-1">
                                <Presentation className="w-3 h-3" />
                                {module.pptxFileName} ({module.totalSlides} slides)
                                {module.resources && module.resources.length > 0 && (
                                  <span className="ml-2 text-accent">
                                    • {module.resources.length} resource(s)
                                  </span>
                                )}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">No presentation uploaded</p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPPTXUploader(module)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {module.hasPPTX ? 'Edit PPTX' : 'Upload PPTX'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveModule(module.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={handleSubmitForReview} className="bg-gradient-accent" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PPTX Uploader Modal */}
        {selectedModule && (
          <ModulePPTXUploader
            open={pptxUploaderOpen}
            onOpenChange={setPptxUploaderOpen}
            moduleId={selectedModule.id}
            moduleName={selectedModule.title}
            onSave={handlePPTXSave}
            initialData={selectedModule.hasPPTX ? {
              slides: selectedModule.slides,
              resources: selectedModule.resources,
              lessonBreaks: selectedModule.lessonBreaks,
              fileName: selectedModule.pptxFileName,
              totalSlides: selectedModule.totalSlides
            } : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseModal;
