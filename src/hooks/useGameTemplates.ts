import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import type { GameConfig, GameType } from '@/lib/gameTypes';

export interface GameTemplate {
  id: string;
  title: string;
  description: string | null;
  type: string;
  level: string | null;
  sub_level: string | null;
  config: GameConfig;
  thumbnail_url: string | null;
  is_published: boolean;
  is_template: boolean;
  share_code: string | null;
  created_by: string;
  course_id: string | null;
  module_id: string | null;
  created_at: string;
  updated_at: string;
}

const generateShareCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export const useTeacherGameTemplates = () => {
  const { profile } = useProfile();
  return useQuery({
    queryKey: ['game-templates', 'teacher', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('game_templates')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({ ...d, config: (d.config || {}) as GameConfig })) as GameTemplate[];
    },
    enabled: !!profile?.id,
  });
};

export const useCourseGameTemplates = (courseId?: string) => {
  return useQuery({
    queryKey: ['game-templates', 'course', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('game_templates')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({ ...d, config: (d.config || {}) as GameConfig })) as GameTemplate[];
    },
    enabled: !!courseId,
  });
};

export const useCreateGameTemplate = () => {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  return useMutation({
    mutationFn: async (template: {
      title: string;
      description?: string;
      type: GameType;
      level?: string;
      sub_level?: string;
      config: GameConfig;
      course_id?: string;
      module_id?: string;
      is_published?: boolean;
    }) => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('game_templates')
        .insert({
          ...template,
          config: template.config as any,
          created_by: profile.id,
          share_code: generateShareCode(),
          is_published: template.is_published ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-templates'] });
      toast.success('Game template created!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
};

export const useUpdateGameTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GameTemplate> & { id: string }) => {
      const { config, ...rest } = updates;
      const { data, error } = await supabase
        .from('game_templates')
        .update({ ...rest, ...(config ? { config: config as any } : {}), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-templates'] });
      toast.success('Game template updated!');
    },
  });
};

export const useDeleteGameTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('game_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-templates'] });
      toast.success('Game template deleted');
    },
  });
};
