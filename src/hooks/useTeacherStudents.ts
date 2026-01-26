import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeacherStudent {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  courseId: string;
  courseName: string;
  progress: number;
  enrolledAt: string;
  lastActiveAt: string;
  quizScore: number;
  quizAttempts: number;
  resourcesCompleted: number;
  totalResources: number;
}

// Hook to get profile ID from auth user
const useProfileId = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile-id-teacher', user?.id],
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

export const useTeacherStudents = () => {
  const { data: profileId } = useProfileId();

  return useQuery({
    queryKey: ['teacher-students', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      // Get all courses this teacher owns
      const { data: teacherCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', profileId);

      if (coursesError) throw coursesError;
      if (!teacherCourses || teacherCourses.length === 0) return [];

      const courseIds = teacherCourses.map(c => c.id);
      const courseMap = Object.fromEntries(teacherCourses.map(c => [c.id, c.title]));

      // Get all enrollments for these courses with student profiles
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          user_id,
          progress_percentage,
          created_at,
          last_accessed_at,
          student:profiles!enrollments_user_id_fkey(id, full_name, avatar_url, email)
        `)
        .in('course_id', courseIds);

      if (enrollmentsError) throw enrollmentsError;
      if (!enrollments || enrollments.length === 0) return [];

      // Get student IDs
      const studentIds = enrollments.map(e => e.user_id);

      // Get presentation progress for these students
      const { data: progressData } = await supabase
        .from('presentation_progress')
        .select('user_id, course_id, slides_viewed, resources_completed, completed')
        .in('user_id', studentIds)
        .in('course_id', courseIds);

      // Get quiz attempts for these students on these courses
      const { data: quizAttempts } = await supabase
        .from('resource_quiz_attempts')
        .select(`
          user_id,
          score,
          passed,
          resource:course_resources!resource_quiz_attempts_resource_id_fkey(course_id)
        `)
        .in('user_id', studentIds);

      // Get total resources per course
      const { data: resourceCounts } = await supabase
        .from('course_resources')
        .select('course_id')
        .in('course_id', courseIds);

      // Aggregate resource counts per course
      const resourceCountMap: Record<string, number> = {};
      resourceCounts?.forEach(r => {
        resourceCountMap[r.course_id] = (resourceCountMap[r.course_id] || 0) + 1;
      });

      // Build student data
      const students: TeacherStudent[] = enrollments.map(enrollment => {
        const student = enrollment.student as { id: string; full_name: string; avatar_url: string | null; email: string } | null;
        
        // Get progress for this student in this course
        const studentProgress = progressData?.filter(
          p => p.user_id === enrollment.user_id && p.course_id === enrollment.course_id
        ) || [];

        const resourcesCompleted = studentProgress.reduce(
          (acc, p) => acc + (p.resources_completed?.length || 0), 
          0
        );

        // Get quiz scores for this student in this course
        const studentQuizzes = quizAttempts?.filter(q => {
          const resource = q.resource as { course_id: string } | null;
          return q.user_id === enrollment.user_id && resource?.course_id === enrollment.course_id;
        }) || [];

        const avgQuizScore = studentQuizzes.length > 0
          ? Math.round(studentQuizzes.reduce((acc, q) => acc + (Number(q.score) || 0), 0) / studentQuizzes.length)
          : 0;

        // Calculate progress percentage from slides viewed
        const slidesViewed = studentProgress.reduce(
          (acc, p) => acc + (p.slides_viewed?.length || 0),
          0
        );

        return {
          id: student?.id || enrollment.user_id,
          name: student?.full_name || 'Unknown Student',
          avatar: student?.avatar_url || undefined,
          email: student?.email || '',
          courseId: enrollment.course_id,
          courseName: courseMap[enrollment.course_id] || 'Unknown Course',
          progress: enrollment.progress_percentage || slidesViewed,
          enrolledAt: enrollment.created_at,
          lastActiveAt: enrollment.last_accessed_at || enrollment.created_at,
          quizScore: avgQuizScore,
          quizAttempts: studentQuizzes.length,
          resourcesCompleted,
          totalResources: resourceCountMap[enrollment.course_id] || 0,
        };
      });

      // Sort by most recent activity
      return students.sort((a, b) => 
        new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
      );
    },
    enabled: !!profileId,
  });
};

// Hook for getting quiz results for a specific course
export const useCourseQuizResults = (courseId?: string) => {
  const { data: profileId } = useProfileId();

  return useQuery({
    queryKey: ['course-quiz-results', courseId, profileId],
    queryFn: async () => {
      if (!courseId || !profileId) return [];

      // Verify this teacher owns this course
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('instructor_id', profileId)
        .maybeSingle();

      if (!course) return [];

      // Get all resources for this course
      const { data: resources } = await supabase
        .from('course_resources')
        .select('id, title, type')
        .eq('course_id', courseId)
        .eq('type', 'quiz');

      if (!resources || resources.length === 0) return [];

      const resourceIds = resources.map(r => r.id);
      const resourceMap = Object.fromEntries(resources.map(r => [r.id, r.title]));

      // Get all quiz attempts for these resources
      const { data: attempts } = await supabase
        .from('resource_quiz_attempts')
        .select(`
          id,
          user_id,
          resource_id,
          score,
          passed,
          attempt_number,
          completed_at
        `)
        .in('resource_id', resourceIds)
        .order('completed_at', { ascending: false });

      if (!attempts || attempts.length === 0) return [];

      // Get student profiles separately
      const studentIds = [...new Set(attempts.map(a => a.user_id))];
      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', studentIds);

      const studentMap = Object.fromEntries(
        (students || []).map(s => [s.id, s])
      );

      return attempts.map(attempt => ({
        id: attempt.id,
        studentName: studentMap[attempt.user_id]?.full_name || 'Unknown',
        studentAvatar: studentMap[attempt.user_id]?.avatar_url || undefined,
        quizTitle: resourceMap[attempt.resource_id] || 'Unknown Quiz',
        score: Number(attempt.score) || 0,
        passed: attempt.passed,
        attemptNumber: attempt.attempt_number,
        completedAt: attempt.completed_at,
      }));
    },
    enabled: !!courseId && !!profileId,
  });
};
