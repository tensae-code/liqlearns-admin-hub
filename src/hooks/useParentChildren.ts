import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';

interface ChildProfile {
  id: string;
  profile_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  xp_points: number;
  current_streak: number;
  nickname: string | null;
}

export const useParentChildren = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('parent_children')
        .select(`
          id,
          nickname,
          child:profiles!parent_children_child_id_fkey (
            id,
            full_name,
            username,
            avatar_url,
            xp_points,
            current_streak
          )
        `)
        .eq('parent_id', profile.id);

      if (error) throw error;

      const formattedChildren: ChildProfile[] = (data || []).map((item: any) => ({
        id: item.id,
        profile_id: item.child.id,
        full_name: item.child.full_name,
        username: item.child.username,
        avatar_url: item.child.avatar_url,
        xp_points: item.child.xp_points,
        current_streak: item.child.current_streak,
        nickname: item.nickname,
      }));

      setChildren(formattedChildren);
    } catch (err: any) {
      console.error('Error fetching children:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user, profile]);

  const searchChildByUsername = async (username: string) => {
    // Require minimum username length to prevent enumeration
    if (!username || username.trim().length < 3) {
      return [];
    }
    
    // Sanitize input - only allow alphanumeric and underscore
    const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (sanitizedUsername.length < 3) {
      return [];
    }
    
    // Use the public_profiles view for safe search (only exposes safe fields)
    // Using exact match to prevent enumeration attacks
    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, full_name, username, avatar_url')
      .eq('username', sanitizedUsername)
      .limit(1);

    if (error) throw error;
    return data || [];
  };

  const addChild = async (childProfileId: string, nickname?: string) => {
    if (!profile) throw new Error('Parent profile not found');

    const { error } = await supabase
      .from('parent_children')
      .insert({
        parent_id: profile.id,
        child_id: childProfileId,
        nickname: nickname || null,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('This child is already linked to your account');
      }
      throw error;
    }

    await fetchChildren();
  };

  const updateChildNickname = async (relationshipId: string, nickname: string) => {
    const { error } = await supabase
      .from('parent_children')
      .update({ nickname })
      .eq('id', relationshipId);

    if (error) throw error;
    await fetchChildren();
  };

  const removeChild = async (relationshipId: string) => {
    const { error } = await supabase
      .from('parent_children')
      .delete()
      .eq('id', relationshipId);

    if (error) throw error;
    await fetchChildren();
  };

  return {
    children,
    loading,
    error,
    refetch: fetchChildren,
    searchChildByUsername,
    addChild,
    updateChildNickname,
    removeChild,
  };
};
