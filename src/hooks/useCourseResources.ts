import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export type ResourceType = 'video' | 'audio' | 'quiz' | 'flashcard' | 'game' | 'simulation' | 'document' | 'image' | 'link' | 'embed' | 'code' | 'discussion' | 'assignment';

export interface CourseResource {
  id: string;
  courseId: string;
  moduleId: string;
  presentationId?: string;
  type: ResourceType;
  title: string;
  description?: string;
  filePath?: string;
  fileUrl?: string;
  durationSeconds?: number;
  showAfterSlide: number;
  showBeforeSlide: number;
  content: {
    questions?: QuizQuestion[];
    flashcards?: Flashcard[];
    passingScore?: number;
  };
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const useCourseResources = (courseId?: string, moduleId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch resources for a course/module
  const { data: resources, isLoading } = useQuery({
    queryKey: ['course-resources', courseId, moduleId],
    queryFn: async () => {
      if (!courseId) return [];
      
      let query = supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(r => ({
        id: r.id,
        courseId: r.course_id,
        moduleId: r.module_id,
        presentationId: r.presentation_id,
        type: r.type as CourseResource['type'],
        title: r.title,
        description: r.description,
        filePath: r.file_path,
        fileUrl: r.file_url,
        durationSeconds: r.duration_seconds,
        showAfterSlide: r.show_after_slide,
        showBeforeSlide: r.show_before_slide,
        content: r.content as CourseResource['content'],
        orderIndex: r.order_index,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        createdBy: r.created_by,
      })) as CourseResource[];
    },
    enabled: !!courseId,
  });

  // Upload media file (video/audio)
  const uploadMedia = async (
    file: File,
    type: 'video' | 'audio',
    title: string,
    courseId: string,
    moduleId: string,
    showAfterSlide: number,
    showBeforeSlide: number,
    presentationId?: string
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    setUploadProgress(0);

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${courseId}/${moduleId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('course-resources')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    setUploadProgress(50);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-resources')
      .getPublicUrl(fileName);

    // Create resource record
    const { data, error } = await supabase
      .from('course_resources')
      .insert({
        course_id: courseId,
        module_id: moduleId,
        presentation_id: presentationId,
        type,
        title,
        file_path: fileName,
        file_url: publicUrl,
        show_after_slide: showAfterSlide,
        show_before_slide: showBeforeSlide,
        content: {},
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) throw error;

    setUploadProgress(100);
    queryClient.invalidateQueries({ queryKey: ['course-resources', courseId] });

    return data;
  };

  // Create quiz resource
  const createQuiz = async (
    title: string,
    questions: QuizQuestion[],
    passingScore: number,
    courseId: string,
    moduleId: string,
    showAfterSlide: number,
    showBeforeSlide: number,
    presentationId?: string
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('course_resources')
      .insert([{
        course_id: courseId,
        module_id: moduleId,
        presentation_id: presentationId,
        type: 'quiz' as const,
        title,
        show_after_slide: showAfterSlide,
        show_before_slide: showBeforeSlide,
        content: JSON.parse(JSON.stringify({ questions, passingScore })),
        created_by: profile.id,
      }])
      .select()
      .single();

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['course-resources', courseId] });
    return data;
  };

  // Create flashcard resource
  const createFlashcards = async (
    title: string,
    flashcards: Flashcard[],
    courseId: string,
    moduleId: string,
    showAfterSlide: number,
    showBeforeSlide: number,
    presentationId?: string
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('course_resources')
      .insert([{
        course_id: courseId,
        module_id: moduleId,
        presentation_id: presentationId,
        type: 'flashcard' as const,
        title,
        show_after_slide: showAfterSlide,
        show_before_slide: showBeforeSlide,
        content: JSON.parse(JSON.stringify({ flashcards })),
        created_by: profile.id,
      }])
      .select()
      .single();

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['course-resources', courseId] });
    return data;
  };

  // Delete resource
  const deleteResource = async (resourceId: string) => {
    const resource = resources?.find(r => r.id === resourceId);
    
    // Delete file from storage if exists
    if (resource?.filePath) {
      await supabase.storage
        .from('course-resources')
        .remove([resource.filePath]);
    }

    const { error } = await supabase
      .from('course_resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['course-resources'] });
  };

  // Update resource
  const updateResource = async (resourceId: string, updates: Partial<CourseResource>) => {
    const { error } = await supabase
      .from('course_resources')
      .update({
        title: updates.title,
        description: updates.description,
        show_after_slide: updates.showAfterSlide,
        show_before_slide: updates.showBeforeSlide,
        content: updates.content ? JSON.parse(JSON.stringify(updates.content)) : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resourceId);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['course-resources'] });
  };

  return {
    resources: resources || [],
    isLoading,
    uploadProgress,
    uploadMedia,
    createQuiz,
    createFlashcards,
    deleteResource,
    updateResource,
  };
};

// Hook for tracking presentation progress
export const usePresentationProgress = (presentationId?: string, courseId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['presentation-progress', presentationId],
    queryFn: async () => {
      if (!presentationId || !user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return null;

      const { data, error } = await supabase
        .from('presentation_progress')
        .select('*')
        .eq('presentation_id', presentationId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!presentationId && !!user,
  });

  const updateProgress = async (updates: {
    currentSlide?: number;
    slideViewed?: number;
    resourceCompleted?: string;
    completed?: boolean;
    timeSpent?: number;
  }) => {
    if (!presentationId || !courseId || !user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    const existingProgress = progress;

    if (existingProgress) {
      // Update existing progress
      const slidesViewed = existingProgress.slides_viewed || [];
      const resourcesCompleted = existingProgress.resources_completed || [];

      if (updates.slideViewed && !slidesViewed.includes(updates.slideViewed)) {
        slidesViewed.push(updates.slideViewed);
      }

      if (updates.resourceCompleted && !resourcesCompleted.includes(updates.resourceCompleted)) {
        resourcesCompleted.push(updates.resourceCompleted);
      }

      const { error } = await supabase
        .from('presentation_progress')
        .update({
          current_slide: updates.currentSlide ?? existingProgress.current_slide,
          slides_viewed: slidesViewed,
          resources_completed: resourcesCompleted,
          total_time_seconds: (existingProgress.total_time_seconds || 0) + (updates.timeSpent || 0),
          completed: updates.completed ?? existingProgress.completed,
          completed_at: updates.completed ? new Date().toISOString() : existingProgress.completed_at,
          last_viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id);

      if (error) throw error;
    } else {
      // Create new progress record
      const { error } = await supabase
        .from('presentation_progress')
        .insert({
          user_id: profile.id,
          presentation_id: presentationId,
          course_id: courseId,
          current_slide: updates.currentSlide || 1,
          slides_viewed: updates.slideViewed ? [updates.slideViewed] : [],
          resources_completed: updates.resourceCompleted ? [updates.resourceCompleted] : [],
          total_time_seconds: updates.timeSpent || 0,
          completed: updates.completed || false,
        });

      if (error) throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['presentation-progress', presentationId] });
  };

  return {
    progress,
    isLoading,
    updateProgress,
  };
};

// Hook for recording quiz attempts
export const useQuizAttempts = (resourceId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const recordAttempt = async (
    score: number,
    passed: boolean,
    answers: Record<string, number>,
    timeTakenSeconds: number
  ) => {
    if (!resourceId || !user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    // Get current attempt count
    const { count } = await supabase
      .from('resource_quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('resource_id', resourceId)
      .eq('user_id', profile.id);

    const attemptNumber = (count || 0) + 1;

    const { error } = await supabase
      .from('resource_quiz_attempts')
      .insert({
        user_id: profile.id,
        resource_id: resourceId,
        score,
        passed,
        answers: JSON.parse(JSON.stringify(answers)),
        time_taken_seconds: timeTakenSeconds,
        attempt_number: attemptNumber,
      });

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['quiz-attempts', resourceId] });
  };

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['quiz-attempts', resourceId],
    queryFn: async () => {
      if (!resourceId || !user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from('resource_quiz_attempts')
        .select('*')
        .eq('resource_id', resourceId)
        .eq('user_id', profile.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!resourceId && !!user,
  });

  return {
    attempts: attempts || [],
    isLoading,
    recordAttempt,
    bestScore: attempts?.length ? Math.max(...attempts.map(a => a.score)) : 0,
    attemptCount: attempts?.length || 0,
  };
};
