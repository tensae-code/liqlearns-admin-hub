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
  submission_status?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
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

// Hook for teachers to get their own courses (including drafts)
export const useTeacherCourses = () => {
  const { user } = useAuth();
  const { data: profileId } = useProfileId();

  return useQuery({
    queryKey: ['teacher-courses', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      // First, get courses without the reviewer join (no FK exists for claimed_by)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name, avatar_url)
        `)
        .eq('instructor_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get enrollment counts for each course
      const courseIds = data?.map(c => c.id) || [];
      const { data: enrollmentCounts } = await supabase
        .from('enrollments')
        .select('course_id')
        .in('course_id', courseIds);

      const countMap = enrollmentCounts?.reduce((acc, e) => {
        acc[e.course_id] = (acc[e.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Fetch reviewer info separately for courses that are claimed
      const claimedByIds = data?.filter(c => c.claimed_by).map(c => c.claimed_by) || [];
      let reviewerMap: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {};
      
      if (claimedByIds.length > 0) {
        const { data: reviewers } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', claimedByIds);
        
        reviewerMap = (reviewers || []).reduce((acc, r) => {
          acc[r.id] = r;
          return acc;
        }, {} as Record<string, { id: string; full_name: string; avatar_url: string | null }>);
      }

      return data?.map(course => ({
        ...course,
        enrollment_count: countMap[course.id] || 0,
        thumbnail_emoji: getCategoryEmoji(course.category),
        submission_status: course.submission_status || 'draft',
        reviewer: course.claimed_by ? reviewerMap[course.claimed_by] || null : null,
      })) || [];
    },
    enabled: !!profileId,
  });
};

// Hook for teachers to request escalation or different reviewer
export const useRequestDifferentReviewer = () => {
  const queryClient = useQueryClient();
  const { data: profileId } = useProfileId();

  return useMutation({
    mutationFn: async ({ courseId, reason }: { courseId: string; reason?: string }) => {
      if (!profileId) throw new Error('Not authenticated');

      // Get course details
      const { data: course } = await supabase
        .from('courses')
        .select('title, claimed_by')
        .eq('id', courseId)
        .single();

      if (!course?.claimed_by) {
        throw new Error('Course is not currently claimed by a reviewer');
      }

      // Get teacher name
      const { data: teacher } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', profileId)
        .single();

      // Notify the current reviewer
      await supabase
        .from('notifications')
        .insert({
          user_id: course.claimed_by,
          type: 'course',
          title: 'Reviewer Change Requested',
          message: `${teacher?.full_name || 'A teacher'} has requested a different reviewer for "${course.title}".${reason ? ` Reason: ${reason}` : ''}`,
          data: { course_id: courseId, requested_by: profileId },
        });

      // Unclaim the course so another admin can pick it up
      const { error } = await supabase
        .from('courses')
        .update({
          claimed_by: null,
          claimed_at: null,
        })
        .eq('id', courseId);

      if (error) throw error;
      return { courseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast.success('Request sent! Another reviewer will be assigned.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to request different reviewer');
    },
  });
};

// Hook to create a new course
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { data: profileId } = useProfileId();

  return useMutation({
    mutationFn: async (courseData: {
      title: string;
      description?: string;
      category: string;
      difficulty: string;
      price?: number;
      estimated_duration?: number;
      is_published?: boolean;
    }) => {
      if (!profileId) {
        throw new Error('You must be logged in to create a course');
      }

      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseData,
          instructor_id: profileId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast.success('Course created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create course');
    },
  });
};

// Hook to update a course
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, updates }: {
      courseId: string;
      updates: Partial<Course>;
    }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast.success('Course updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update course');
    },
  });
};

// Hook to submit a course for review
export const useSubmitCourseForReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase
        .from('courses')
        .update({
          submission_status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast.success('Course submitted for review!', {
        description: 'An admin will review your course and approve it for publishing.',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit course for review');
    },
  });
};
