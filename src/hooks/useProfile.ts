import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  xp_points: number;
  current_streak: number;
  longest_streak: number;
  subscription_plan: string | null;
  subscription_status: string | null;
  bio: string | null;
  last_login_date: string | null;
  birthday: string | null;
  teacher_type: string | null;
  enterprise_status: string | null;
  enterprise_org_name: string | null;
}

// Helper to calculate age from birthday
const calculateAge = (birthday: string | null): number | null => {
  if (!birthday) return null;
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const refetch = () => {
    setLoading(true);
    fetchProfile();
  };

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

  const addXP = async (amount: number): Promise<boolean> => {
    if (!user || !profile) return false;

    const newXP = (profile.xp_points || 0) + amount;

    const { error } = await supabase
      .from('profiles')
      .update({ xp_points: newXP })
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, xp_points: newXP } : null);
      return true;
    }
    return false;
  };

  const age = profile ? calculateAge(profile.birthday) : null;
  const isUnderage = age !== null && age < 16;

  return { profile, loading, error, updateStreak, addXP, refetch, age, isUnderage };
};
