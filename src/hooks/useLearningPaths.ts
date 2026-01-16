import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LearningPath {
  id: string;
  enterprise_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  estimated_duration: number | null;
  difficulty: string;
  created_at: string;
  updated_at: string;
  courses?: LearningPathCourse[];
  milestones?: LearningPathMilestone[];
}

export interface LearningPathCourse {
  id: string;
  learning_path_id: string;
  course_id: string;
  order_index: number;
  is_required: boolean;
  prerequisite_course_ids: string[];
  course?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    difficulty: string;
  };
}

export interface LearningPathMilestone {
  id: string;
  learning_path_id: string;
  title: string;
  description: string | null;
  trigger_after_course_id: string | null;
  trigger_at_progress_percent: number | null;
  xp_reward: number;
  badge_id: string | null;
  order_index: number;
}

export interface LearningPathProgress {
  id: string;
  user_id: string;
  learning_path_id: string;
  current_course_index: number;
  completed_course_ids: string[];
  completed_milestone_ids: string[];
  progress_percent: number;
  started_at: string;
  completed_at: string | null;
}

// Hook to fetch learning paths for an enterprise
export function useEnterpriseLearningPaths() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['learning-paths', user?.id],
    queryFn: async () => {
      // First get the profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_courses (
            *,
            course:courses (id, title, thumbnail_url, difficulty)
          ),
          learning_path_milestones (*)
        `)
        .eq('enterprise_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LearningPath[];
    },
    enabled: !!user,
  });
}

// Hook to fetch a single learning path
export function useLearningPath(pathId: string) {
  return useQuery({
    queryKey: ['learning-path', pathId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_courses (
            *,
            course:courses (id, title, thumbnail_url, difficulty)
          ),
          learning_path_milestones (*)
        `)
        .eq('id', pathId)
        .single();

      if (error) throw error;
      return data as LearningPath;
    },
    enabled: !!pathId,
  });
}

// Hook to create a learning path
export function useCreateLearningPath() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      difficulty?: string;
      estimated_duration?: number;
      is_published?: boolean;
      courses: { course_id: string; order_index: number; is_required: boolean; prerequisite_course_ids: string[] }[];
      milestones: { title: string; description?: string; trigger_after_course_id?: string; xp_reward: number; order_index: number }[];
    }) => {
      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Create learning path
      const { data: path, error: pathError } = await supabase
        .from('learning_paths')
        .insert({
          enterprise_id: profile.id,
          title: data.title,
          description: data.description,
          difficulty: data.difficulty || 'intermediate',
          estimated_duration: data.estimated_duration,
          is_published: data.is_published || false,
        })
        .select()
        .single();

      if (pathError) throw pathError;

      // Add courses
      if (data.courses.length > 0) {
        const { error: coursesError } = await supabase
          .from('learning_path_courses')
          .insert(
            data.courses.map(c => ({
              learning_path_id: path.id,
              course_id: c.course_id,
              order_index: c.order_index,
              is_required: c.is_required,
              prerequisite_course_ids: c.prerequisite_course_ids,
            }))
          );
        if (coursesError) throw coursesError;
      }

      // Add milestones
      if (data.milestones.length > 0) {
        const { error: milestonesError } = await supabase
          .from('learning_path_milestones')
          .insert(
            data.milestones.map(m => ({
              learning_path_id: path.id,
              title: m.title,
              description: m.description,
              trigger_after_course_id: m.trigger_after_course_id,
              xp_reward: m.xp_reward,
              order_index: m.order_index,
            }))
          );
        if (milestonesError) throw milestonesError;
      }

      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
      toast.success('Learning path created!');
    },
    onError: (error) => {
      toast.error('Failed to create learning path');
      console.error(error);
    },
  });
}

// Hook to update user progress on a learning path
export function useUpdateLearningPathProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      learning_path_id: string;
      current_course_index?: number;
      completed_course_ids?: string[];
      completed_milestone_ids?: string[];
      progress_percent?: number;
    }) => {
      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data: progress, error } = await supabase
        .from('learning_path_progress')
        .upsert({
          user_id: profile.id,
          learning_path_id: data.learning_path_id,
          current_course_index: data.current_course_index,
          completed_course_ids: data.completed_course_ids,
          completed_milestone_ids: data.completed_milestone_ids,
          progress_percent: data.progress_percent,
          completed_at: data.progress_percent === 100 ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return progress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path-progress'] });
    },
  });
}

// Hook to fetch user's progress on learning paths
export function useMyLearningPathProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['learning-path-progress', user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('learning_path_progress')
        .select(`
          *,
          learning_path:learning_paths (
            id, title, description, thumbnail_url
          )
        `)
        .eq('user_id', profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
