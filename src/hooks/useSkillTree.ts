import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  parent_id: string | null;
  sort_order: number;
  skills_count?: number;
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  max_level: number;
  sort_order: number;
  levels?: SkillLevel[];
  user_progress?: UserSkillProgress | null;
}

export interface SkillLevel {
  id: string;
  skill_id: string;
  level_number: number;
  title: string;
  description: string | null;
  coin_cost: number;
  xp_reward: number;
  content: any;
  is_active: boolean;
}

export interface UserSkillProgress {
  id: string;
  user_id: string;
  skill_id: string;
  current_level: number;
  xp_earned: number;
  is_max_level: boolean;
}

export const useSkills = () => {
  const { profile } = useProfile();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userProgress, setUserProgress] = useState<UserSkillProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('skill_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) setCategories(data as any);
  }, []);

  const fetchSkills = useCallback(async (categoryId?: string) => {
    let query = supabase.from('skills').select('*').eq('is_active', true).order('sort_order');
    if (categoryId) query = query.eq('category_id', categoryId);
    const { data } = await query;
    if (data) setSkills(data as any);
  }, []);

  const fetchProgress = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('user_skill_progress')
      .select('*')
      .eq('user_id', profile.id);
    if (data) setUserProgress(data as any);
  }, [profile?.id]);

  const fetchSkillLevels = useCallback(async (skillId: string) => {
    const { data } = await supabase
      .from('skill_levels')
      .select('*')
      .eq('skill_id', skillId)
      .eq('is_active', true)
      .order('level_number');
    return (data || []) as SkillLevel[];
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchSkills(), fetchProgress()]);
      setLoading(false);
    };
    load();
  }, [fetchCategories, fetchSkills, fetchProgress]);

  useEffect(() => {
    if (selectedCategory) fetchSkills(selectedCategory);
    else fetchSkills();
  }, [selectedCategory, fetchSkills]);

  const getSkillProgress = (skillId: string) => userProgress.find(p => p.skill_id === skillId) || null;

  const getSkillsWithProgress = () => skills.map(s => ({
    ...s,
    user_progress: getSkillProgress(s.id),
  }));

  return {
    categories,
    skills: getSkillsWithProgress(),
    userProgress,
    loading,
    selectedCategory,
    setSelectedCategory,
    fetchSkillLevels,
    getSkillProgress,
    refresh: () => Promise.all([fetchCategories(), fetchSkills(), fetchProgress()]),
  };
};
