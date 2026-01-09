import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  total_lessons: number | null;
  estimated_duration: number | null;
  price: number | null;
  thumbnail_url: string | null;
  is_published: boolean | null;
  instructor_id: string | null;
  created_at: string;
  instructor?: {
    full_name: string;
    avatar_url: string | null;
  };
  enrollment_count?: number;
  is_enrolled?: boolean;
  thumbnail_emoji?: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  progress_percentage: number | null;
  created_at: string;
  last_accessed_at: string | null;
  completed_at: string | null;
}

const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    language: '📚',
    culture: '🏛️',
    tech: '💻',
    business: '💼',
    kids: '🎨',
    science: '🔬',
    arts: '🎭',
    music: '🎵',
    health: '💪',
    default: '📖',
  };
  return emojiMap[category.toLowerCase()] || emojiMap.default;
};

// Helper hook to get user's profile ID
const useProfileId = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.id || null;
    },
    enabled: !!user?.id,
  });
};

export const useCourses = () => {
  const { user } = useAuth();
  const { data: profileId } = useProfileId();

  return useQuery({
    queryKey: ['courses', profileId],
    queryFn: async () => {
      // Fetch courses with instructor info
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name, avatar_url)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get enrollment counts for each course
      const { data: enrollmentCounts } = await supabase
        .from('enrollments')
        .select('course_id');

      const countMap = enrollmentCounts?.reduce((acc, e) => {
        acc[e.course_id] = (acc[e.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Check user enrollments if logged in
      let userEnrollments: string[] = [];
      if (profileId) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', profileId);
        userEnrollments = enrollments?.map(e => e.course_id) || [];
      }

      return courses?.map(course => ({
        ...course,
        enrollment_count: countMap[course.id] || 0,
        is_enrolled: userEnrollments.includes(course.id),
        thumbnail_emoji: getCategoryEmoji(course.category),
      })) || [];
    },
  });
};

export const useCourse = (courseId: string) => {
  const { data: profileId } = useProfileId();

  return useQuery({
    queryKey: ['course', courseId, profileId],
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name, avatar_url, bio)
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;

      // Get enrollment count
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      // Check if user is enrolled
      let isEnrolled = false;
      let enrollment: Enrollment | null = null;
      if (profileId) {
        const { data } = await supabase
          .from('enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', profileId)
          .maybeSingle();
        isEnrolled = !!data;
        enrollment = data;
      }

      // Get lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      return {
        ...course,
        enrollment_count: count || 0,
        is_enrolled: isEnrolled,
        enrollment,
        lessons: lessons || [],
        thumbnail_emoji: getCategoryEmoji(course.category),
      };
    },
    enabled: !!courseId,
  });
};

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();
  const { data: profileId } = useProfileId();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!profileId) {
        throw new Error('You must be logged in to enroll');
      }

      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          user_id: profileId,
          progress_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      toast.success('Successfully enrolled in course! 🎉');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enroll in course');
    },
  });
};

export const useMyEnrollments = () => {
  const { data: profileId } = useProfileId();

  return useQuery({
    queryKey: ['my-courses', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor:profiles!courses_instructor_id_fkey(full_name, avatar_url)
          )
        `)
        .eq('user_id', profileId)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('category')
        .eq('is_published', true);

      if (error) throw error;

      // Count courses per category
      const counts = data?.reduce((acc, course) => {
        acc[course.category] = (acc[course.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const categories = Object.entries(counts).map(([id, count]) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        count,
        emoji: getCategoryEmoji(id),
      }));

      return [
        { id: 'all', label: 'All Courses', count: data?.length || 0, emoji: '📖' },
        ...categories,
      ];
    },
  });
};
