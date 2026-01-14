import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface AdminSkillSuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'in_development';
  votes_up: number;
  votes_down: number;
  admin_notes: string | null;
  voting_ends_at: string | null;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useAdminSkillSuggestions() {
  const [suggestions, setSuggestions] = useState<AdminSkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { profile } = useProfile();

  const fetchSuggestions = async () => {
    try {
      let query = supabase
        .from('skill_suggestions')
        .select(`
          id,
          name,
          description,
          category,
          status,
          votes_up,
          votes_down,
          admin_notes,
          voting_ends_at,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch author profiles
      const userIds = [...new Set((data || []).map(s => s.user_id))];
      let profilesMap: Record<string, { id: string; full_name: string; username: string; avatar_url: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      const formattedSuggestions: AdminSkillSuggestion[] = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        status: s.status as AdminSkillSuggestion['status'],
        votes_up: s.votes_up,
        votes_down: s.votes_down,
        admin_notes: s.admin_notes,
        voting_ends_at: s.voting_ends_at,
        created_at: s.created_at,
        author: profilesMap[s.user_id],
      }));

      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [statusFilter]);

  const updateStatus = async (
    id: string, 
    newStatus: 'voting' | 'approved' | 'rejected' | 'in_development',
    adminNotes?: string,
    votingDays: number = 14
  ) => {
    if (!profile?.id) {
      toast.error('Not authorized');
      return false;
    }

    try {
      const updateData: Record<string, any> = {
        status: newStatus,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      // If approving to voting, set voting end date
      if (newStatus === 'voting') {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + votingDays);
        updateData.voting_ends_at = endDate.toISOString();
      }

      const { error } = await supabase
        .from('skill_suggestions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setSuggestions(prev => prev.map(s => 
        s.id === id ? { ...s, status: newStatus, admin_notes: adminNotes || s.admin_notes } : s
      ));

      const statusMessages: Record<string, string> = {
        voting: 'Suggestion approved for community voting!',
        approved: 'Suggestion approved!',
        rejected: 'Suggestion rejected.',
        in_development: 'Suggestion marked as in development.',
      };

      toast.success(statusMessages[newStatus]);
      return true;
    } catch (error: any) {
      console.error('Error updating suggestion:', error);
      toast.error('Failed to update suggestion', { description: error.message });
      return false;
    }
  };

  const bulkUpdateStatus = async (
    ids: string[], 
    newStatus: 'voting' | 'approved' | 'rejected' | 'in_development',
    votingDays: number = 14
  ) => {
    if (!profile?.id) {
      toast.error('Not authorized');
      return false;
    }

    try {
      const updateData: Record<string, any> = {
        status: newStatus,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      };

      if (newStatus === 'voting') {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + votingDays);
        updateData.voting_ends_at = endDate.toISOString();
      }

      const { error } = await supabase
        .from('skill_suggestions')
        .update(updateData)
        .in('id', ids);

      if (error) throw error;

      setSuggestions(prev => prev.map(s => 
        ids.includes(s.id) ? { ...s, status: newStatus } : s
      ));

      setSelectedIds([]);
      toast.success(`${ids.length} suggestions updated!`);
      return true;
    } catch (error: any) {
      console.error('Error bulk updating suggestions:', error);
      toast.error('Failed to update suggestions', { description: error.message });
      return false;
    }
  };

  const deleteSuggestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('skill_suggestions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast.success('Suggestion deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting suggestion:', error);
      toast.error('Failed to delete suggestion');
      return false;
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === suggestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(suggestions.map(s => s.id));
    }
  };

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return {
    suggestions,
    loading,
    statusFilter,
    setStatusFilter,
    selectedIds,
    toggleSelect,
    selectAll,
    updateStatus,
    bulkUpdateStatus,
    deleteSuggestion,
    pendingCount,
    refresh: fetchSuggestions,
  };
}
