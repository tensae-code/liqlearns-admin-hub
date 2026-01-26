import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SubmittedCourse {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  submission_status: string | null;
  submitted_at: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  total_lessons: number | null;
  estimated_duration: number | null;
  instructor: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  claimer?: {
    id: string;
    full_name: string;
  } | null;
}

export interface CourseReviewComment {
  id: string;
  course_id: string;
  comment: string;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

// Hook to fetch courses pending review
export const useSubmittedCourses = () => {
  return useQuery({
    queryKey: ['submitted-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          difficulty,
          submission_status,
          submitted_at,
          claimed_by,
          claimed_at,
          total_lessons,
          estimated_duration,
          instructor:profiles!courses_instructor_id_fkey(id, full_name, avatar_url)
        `)
        .eq('submission_status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as SubmittedCourse[];
    },
  });
};

// Hook to fetch review comments for a course
export const useCourseReviewComments = (courseId: string) => {
  return useQuery({
    queryKey: ['course-review-comments', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_review_comments')
        .select(`
          id,
          course_id,
          comment,
          created_at,
          reviewer:profiles!course_review_comments_reviewer_id_fkey(id, full_name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CourseReviewComment[];
    },
    enabled: !!courseId,
  });
};

// Hook to add a review comment
export const useAddReviewComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, comment, reviewerId }: { 
      courseId: string; 
      comment: string;
      reviewerId: string;
    }) => {
      const { data, error } = await supabase
        .from('course_review_comments')
        .insert({
          course_id: courseId,
          reviewer_id: reviewerId,
          comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course-review-comments', courseId] });
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
};

// Hook to claim a course for review
export const useClaimCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, profileId }: { courseId: string; profileId: string }) => {
      // First get the course to find instructor
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id, title')
        .eq('id', courseId)
        .single();

      // Get reviewer name
      const { data: reviewerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', profileId)
        .single();

      const { error } = await supabase
        .from('courses')
        .update({
          claimed_by: profileId,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .is('claimed_by', null); // Only claim if not already claimed

      if (error) throw error;

      // Send notification to instructor that their course is being reviewed
      if (course?.instructor_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: course.instructor_id,
            type: 'course',
            title: 'Course Under Review',
            message: `Your course "${course.title}" is now being reviewed by ${reviewerProfile?.full_name || 'an admin'}.`,
            data: { course_id: courseId, reviewer_id: profileId },
          });
      }

      return { courseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submitted-courses'] });
      toast.success('Course claimed for review');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to claim course');
    },
  });
};

// Hook to unclaim a course
export const useUnclaimCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
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
      queryClient.invalidateQueries({ queryKey: ['submitted-courses'] });
      toast.success('Course unclaimed');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unclaim course');
    },
  });
};

// Hook to approve a course
export const useApproveCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ courseId, instructorId }: { courseId: string; instructorId: string }) => {
      // Update course status
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          submission_status: 'approved',
          is_published: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: null,
          claimed_by: null,
          claimed_at: null,
        })
        .eq('id', courseId);

      if (updateError) throw updateError;

      // Create notification for teacher
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: instructorId,
          type: 'course',
          title: 'Course Approved! 🎉',
          message: 'Your course has been approved and is now published.',
          data: { course_id: courseId },
        });

      if (notifError) console.error('Failed to send notification:', notifError);

      return { courseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submitted-courses'] });
      toast.success('Course approved and published!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve course');
    },
  });
};

// Hook to reject a course
export const useRejectCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      instructorId, 
      reason 
    }: { 
      courseId: string; 
      instructorId: string;
      reason?: string;
    }) => {
      // Update course status
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          submission_status: 'rejected',
          is_published: false,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: reason || 'Needs revision',
          claimed_by: null,
          claimed_at: null,
        })
        .eq('id', courseId);

      if (updateError) throw updateError;

      // Create notification for teacher
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: instructorId,
          type: 'course',
          title: 'Course Needs Revision',
          message: reason 
            ? `Your course needs changes: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`
            : 'Your course needs some revisions before it can be published.',
          data: { course_id: courseId, rejection_reason: reason },
        });

      if (notifError) console.error('Failed to send notification:', notifError);

      return { courseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submitted-courses'] });
      toast.success('Course sent back for revision');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject course');
    },
  });
};

// Hook to get teacher's course review comments (for dashboard)
export const useTeacherCourseComments = (courseId: string) => {
  return useQuery({
    queryKey: ['teacher-course-comments', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_review_comments')
        .select(`
          id,
          course_id,
          comment,
          created_at,
          reviewer:profiles!course_review_comments_reviewer_id_fkey(id, full_name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CourseReviewComment[];
    },
    enabled: !!courseId,
  });
};
