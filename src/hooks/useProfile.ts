import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  xp_points: number;
  current_streak: number;
  longest_streak: number;
  subscription_plan: string | null;
  subscription_status: string | null;
  bio: string | null;
  last_login_date: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setError(error.message);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateStreak = async () => {
    if (!user || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = profile.last_login_date;

    // Check if already logged in today
    if (lastLogin === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastLogin === yesterdayStr) {
      newStreak = (profile.current_streak || 0) + 1;
    }

    const longestStreak = Math.max(newStreak, profile.longest_streak || 0);

    const { error } = await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_login_date: today,
      })
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? {
        ...prev,
        current_streak: newStreak,
        longest_streak: longestStreak,
      } : null);
    }
  };

  return { profile, loading, error, updateStreak };
};
