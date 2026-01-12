import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface StudySession {
  id: string;
  user_id: string;
  room_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  session_date: string;
}

interface DailyStats {
  total_seconds: number;
  sessions_count: number;
  streak_eligible: boolean;
}

const STREAK_REQUIREMENT_SECONDS = 1800; // 30 minutes

export const useStudyTime = () => {
  const { profile } = useProfile();
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [todayStats, setTodayStats] = useState<DailyStats>({
    total_seconds: 0,
    sessions_count: 0,
    streak_eligible: false,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch today's study stats
  const fetchTodayStats = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_study_stats')
        .select('total_seconds, sessions_count, streak_eligible')
        .eq('user_id', profile.id)
        .eq('study_date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTodayStats({
          total_seconds: data.total_seconds,
          sessions_count: data.sessions_count,
          streak_eligible: data.streak_eligible,
        });
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  }, [profile?.id]);

  // Check for active session on mount
  const checkActiveSession = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentSession(data as StudySession);
        // Calculate elapsed time
        const startTime = new Date(data.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  }, [profile?.id]);

  // Start a study session
  const startSession = async (roomId?: string) => {
    if (!profile?.id) return null;

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: profile.id,
          room_id: roomId || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data as StudySession);
      setElapsedSeconds(0);
      return data;
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  };

  // End a study session
  const endSession = async () => {
    if (!currentSession || !profile?.id) return false;

    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', currentSession.id);

      if (error) throw error;

      setCurrentSession(null);
      setElapsedSeconds(0);
      await fetchTodayStats();
      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  };

  // Timer effect
  useEffect(() => {
    if (currentSession) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentSession]);

  // Fetch stats on mount
  useEffect(() => {
    fetchTodayStats();
    checkActiveSession();
  }, [fetchTodayStats, checkActiveSession]);

  // Calculate total time including current session
  const totalTodaySeconds = todayStats.total_seconds + (currentSession ? elapsedSeconds : 0);
  const remainingForStreak = Math.max(0, STREAK_REQUIREMENT_SECONDS - totalTodaySeconds);
  const streakProgress = Math.min(100, (totalTodaySeconds / STREAK_REQUIREMENT_SECONDS) * 100);
  const isStreakEligible = totalTodaySeconds >= STREAK_REQUIREMENT_SECONDS;

  // Format time helper
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return {
    currentSession,
    elapsedSeconds,
    todayStats,
    totalTodaySeconds,
    remainingForStreak,
    streakProgress,
    isStreakEligible,
    startSession,
    endSession,
    fetchTodayStats,
    formatTime,
    STREAK_REQUIREMENT_SECONDS,
  };
};
