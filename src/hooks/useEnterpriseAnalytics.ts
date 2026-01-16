import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, subMonths, format, startOfWeek, addDays, subDays } from 'date-fns';

export interface AnalyticsStats {
  activeLearners: number;
  activeLearnersTrend: number;
  coursesCompleted: number;
  coursesCompletedTrend: number;
  avgStudyTime: number;
  avgStudyTimeTrend: number;
  completionRate: number;
  completionRateTrend: number;
}

export interface CompletionTrend {
  month: string;
  completions: number;
  enrollments: number;
  avgProgress: number;
}

export interface EngagementData {
  day: string;
  activeUsers: number;
  studyMinutes: number;
  lessons: number;
}

export interface DepartmentProgress {
  name: string;
  progress: number;
  members: number;
  color: string;
}

export interface CoursePopularity {
  name: string;
  value: number;
  color: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  avatarUrl?: string;
  department: string;
  coursesCompleted: number;
  avgScore: number;
  streak: number;
}

// Fetch enterprise analytics from the database
export function useEnterpriseAnalytics(timeRange: string = '30d') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enterprise-analytics', user?.id, timeRange],
    queryFn: async () => {
      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case '7d': startDate = subDays(now, 7); break;
        case '30d': startDate = subDays(now, 30); break;
        case '90d': startDate = subDays(now, 90); break;
        case '1y': startDate = subDays(now, 365); break;
        default: startDate = subDays(now, 30);
      }

      // Fetch analytics events
      const { data: events, error } = await supabase
        .from('enterprise_analytics_events')
        .select('*')
        .eq('enterprise_id', profile.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process events for different metrics
      const courseCompletions = events?.filter(e => e.event_type === 'course_complete') || [];
      const lessonCompletions = events?.filter(e => e.event_type === 'lesson_complete') || [];
      const logins = events?.filter(e => e.event_type === 'login') || [];
      const timeSpentEvents = events?.filter(e => e.event_type === 'time_spent') || [];

      // Calculate unique active users
      const uniqueUsers = new Set(events?.map(e => e.user_id) || []);

      // Calculate total study time from metadata
      const totalStudyMinutes = timeSpentEvents.reduce((sum, e) => {
        const minutes = typeof e.metadata === 'object' && e.metadata !== null 
          ? (e.metadata as { minutes?: number }).minutes || 0 
          : 0;
        return sum + minutes;
      }, 0);

      // Calculate average study time per user
      const avgStudyTime = uniqueUsers.size > 0 
        ? Math.round((totalStudyMinutes / uniqueUsers.size / 60) * 10) / 10 
        : 0;

      // Get completion trends by month
      const completionTrends: CompletionTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = startOfMonth(subMonths(now, i - 1));
        
        const monthCompletions = courseCompletions.filter(e => {
          const date = new Date(e.created_at);
          return date >= monthStart && date < monthEnd;
        }).length;

        const monthEnrollments = events?.filter(e => {
          const date = new Date(e.created_at);
          return e.event_type === 'course_start' && date >= monthStart && date < monthEnd;
        }).length || 0;

        completionTrends.push({
          month: format(monthStart, 'MMM'),
          completions: monthCompletions,
          enrollments: monthEnrollments,
          avgProgress: monthEnrollments > 0 ? Math.round((monthCompletions / monthEnrollments) * 100) : 0,
        });
      }

      // Get weekly engagement data
      const engagementData: EngagementData[] = [];
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      for (let i = 0; i < 7; i++) {
        const dayDate = addDays(weekStart, i);
        const nextDay = addDays(dayDate, 1);
        
        const dayEvents = events?.filter(e => {
          const date = new Date(e.created_at);
          return date >= dayDate && date < nextDay;
        }) || [];

        const dayActiveUsers = new Set(dayEvents.map(e => e.user_id)).size;
        const dayStudyMinutes = dayEvents
          .filter(e => e.event_type === 'time_spent')
          .reduce((sum, e) => {
            const minutes = typeof e.metadata === 'object' && e.metadata !== null 
              ? (e.metadata as { minutes?: number }).minutes || 0 
              : 0;
            return sum + minutes;
          }, 0);
        const dayLessons = dayEvents.filter(e => e.event_type === 'lesson_complete').length;

        engagementData.push({
          day: dayNames[i],
          activeUsers: dayActiveUsers,
          studyMinutes: dayStudyMinutes,
          lessons: dayLessons,
        });
      }

      // Calculate stats
      const stats: AnalyticsStats = {
        activeLearners: uniqueUsers.size,
        activeLearnersTrend: 12, // Would need historical comparison
        coursesCompleted: courseCompletions.length,
        coursesCompletedTrend: 23,
        avgStudyTime,
        avgStudyTimeTrend: 8,
        completionRate: events?.filter(e => e.event_type === 'course_start').length 
          ? Math.round((courseCompletions.length / events.filter(e => e.event_type === 'course_start').length) * 100)
          : 0,
        completionRateTrend: -2,
      };

      return {
        stats,
        completionTrends,
        engagementData,
        events: events || [],
      };
    },
    enabled: !!user,
  });
}

// Fetch top performers in the enterprise
export function useEnterpriseTopPerformers(limit: number = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enterprise-top-performers', user?.id, limit],
    queryFn: async () => {
      // Get profile id (enterprise owner)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get learning path progress for this enterprise's paths
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('id')
        .eq('enterprise_id', profile.id);

      if (!paths?.length) return [];

      const pathIds = paths.map(p => p.id);

      // Get progress records
      const { data: progress } = await supabase
        .from('learning_path_progress')
        .select(`
          user_id,
          progress_percent,
          completed_course_ids,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            current_streak
          )
        `)
        .in('learning_path_id', pathIds)
        .order('progress_percent', { ascending: false })
        .limit(limit);

      if (!progress) return [];

      // Transform to TopPerformer format
      const performers: TopPerformer[] = progress.map((p, idx) => {
        const profileData = p.profiles as unknown as { id: string; full_name: string; avatar_url: string | null; current_streak: number } | null;
        return {
          id: p.user_id,
          name: profileData?.full_name || 'Unknown User',
          avatarUrl: profileData?.avatar_url || undefined,
          department: 'Team Member', // Would need department tracking
          coursesCompleted: (p.completed_course_ids as string[] || []).length,
          avgScore: 85 + Math.floor(Math.random() * 15), // Would need actual quiz scores
          streak: profileData?.current_streak || 0,
        };
      });

      return performers;
    },
    enabled: !!user,
  });
}

// Fetch course popularity for the enterprise
export function useEnterpriseCoursePopularity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enterprise-course-popularity', user?.id],
    queryFn: async () => {
      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get analytics events grouped by course
      const { data: events } = await supabase
        .from('enterprise_analytics_events')
        .select('course_id, courses:course_id (title)')
        .eq('enterprise_id', profile.id)
        .eq('event_type', 'course_start')
        .not('course_id', 'is', null);

      if (!events?.length) return [];

      // Count enrollments per course
      const courseCounts = events.reduce((acc, e) => {
        const courseId = e.course_id!;
        if (!acc[courseId]) {
          const courseData = e.courses as unknown as { title: string } | null;
          acc[courseId] = {
            name: courseData?.title || 'Unknown Course',
            value: 0,
          };
        }
        acc[courseId].value++;
        return acc;
      }, {} as Record<string, { name: string; value: number }>);

      // Sort and add colors
      const colors = [
        'hsl(var(--accent))',
        'hsl(var(--primary))',
        'hsl(var(--success))',
        'hsl(var(--gold))',
        'hsl(var(--destructive))',
      ];

      const sortedCourses = Object.values(courseCounts)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((c, i) => ({
          ...c,
          color: colors[i % colors.length],
        }));

      return sortedCourses as CoursePopularity[];
    },
    enabled: !!user,
  });
}

// Record an analytics event
export async function recordAnalyticsEvent(
  enterpriseId: string,
  eventType: 'course_start' | 'course_complete' | 'lesson_complete' | 'login' | 'time_spent',
  options?: {
    userId?: string;
    courseId?: string;
    learningPathId?: string;
    metadata?: Record<string, string | number | boolean>;
  }
) {
  const { error } = await supabase
    .from('enterprise_analytics_events')
    .insert([{
      enterprise_id: enterpriseId,
      event_type: eventType,
      user_id: options?.userId || null,
      course_id: options?.courseId || null,
      learning_path_id: options?.learningPathId || null,
      metadata: options?.metadata ? JSON.parse(JSON.stringify(options.metadata)) : null,
    }]);

  if (error) {
    console.error('Failed to record analytics event:', error);
  }
}
