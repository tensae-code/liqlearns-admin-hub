import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface SkillProposal {
  id: string;
  skill_level_id: string;
  author_id: string;
  proposed_content: any;
  proposed_title: string;
  proposed_description: string | null;
  status: string;
  review_votes_up: number;
  review_votes_down: number;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  author?: { full_name: string; avatar_url: string | null };
  skill_level?: { title: string; level_number: number; skill?: { name: string; icon: string } };
}

export interface ProposalComment {
  id: string;
  proposal_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { full_name: string; avatar_url: string | null };
}

export interface ProposalVote {
  id: string;
  proposal_id: string;
  voter_id: string;
  vote: 'approve' | 'reject';
  comment: string | null;
}

export const useTeacherContributions = () => {
  const { profile } = useProfile();
  const [proposals, setProposals] = useState<SkillProposal[]>([]);
  const [myProposals, setMyProposals] = useState<SkillProposal[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [approvalThreshold, setApprovalThreshold] = useState(3);
  const [loading, setLoading] = useState(true);

  const fetchApprovalThreshold = useCallback(async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'skill_approval_threshold')
      .maybeSingle();
    if (data?.value) {
      const val = data.value as any;
      setApprovalThreshold(val.votes_required || 3);
    }
  }, []);

  const fetchProposals = useCallback(async () => {
    // Fetch all pending/under_review proposals
    const { data } = await supabase
      .from('skill_edit_proposals')
      .select(`
        *,
        author:profiles!skill_edit_proposals_author_id_fkey(full_name, avatar_url),
        skill_level:skill_levels!skill_edit_proposals_skill_level_id_fkey(title, level_number, skill:skills!skill_levels_skill_id_fkey(name, icon))
      `)
      .in('status', ['pending', 'under_review'])
      .order('created_at', { ascending: false });
    if (data) setProposals(data as any);
  }, []);

  const fetchMyProposals = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('skill_edit_proposals')
      .select(`
        *,
        skill_level:skill_levels!skill_edit_proposals_skill_level_id_fkey(title, level_number, skill:skills!skill_levels_skill_id_fkey(name, icon))
      `)
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setMyProposals(data as any);
  }, [profile?.id]);

  const fetchPoints = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('teacher_contribution_points')
      .select('points')
      .eq('teacher_id', profile.id);
    if (data) setTotalPoints(data.reduce((sum, r) => sum + (r as any).points, 0));
  }, [profile?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProposals(), fetchMyProposals(), fetchPoints(), fetchApprovalThreshold()]);
    setLoading(false);
  }, [fetchProposals, fetchMyProposals, fetchPoints, fetchApprovalThreshold]);

  useEffect(() => { load(); }, [load]);

  const createProposal = useCallback(async (
    skillLevelId: string,
    title: string,
    description: string,
    content: any,
    contributorComment?: string,
    sourceLinks?: string[]
  ) => {
    if (!profile?.id) return { success: false, error: 'Not logged in' };
    try {
      const { error } = await supabase.from('skill_edit_proposals').insert({
        skill_level_id: skillLevelId,
        author_id: profile.id,
        proposed_title: title,
        proposed_description: description,
        proposed_content: content,
        contributor_comment: contributorComment || null,
        source_links: sourceLinks || [],
        status: 'under_review',
      });
      if (error) throw error;

      // Award points
      await supabase.from('teacher_contribution_points').insert({
        teacher_id: profile.id,
        points: 5,
        action_type: 'proposal_created',
        description: `Created content proposal for "${title}"`,
      });

      toast.success('Proposal submitted for peer review!');
      await load();
      return { success: true };
    } catch (err: any) {
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  }, [profile?.id, load]);

  const voteOnProposal = useCallback(async (proposalId: string, vote: 'approve' | 'reject', comment?: string) => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase.from('skill_level_review_votes').upsert({
        proposal_id: proposalId,
        voter_id: profile.id,
        vote,
        comment: comment || null,
      }, { onConflict: 'proposal_id,voter_id' });
      if (error) throw error;

      // Award points for voting
      await supabase.from('teacher_contribution_points').insert({
        teacher_id: profile.id,
        points: 2,
        action_type: 'review_vote',
        reference_id: proposalId,
        description: `Voted on proposal`,
      });

      toast.success(`Vote recorded: ${vote}`);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [profile?.id, load]);

  const addComment = useCallback(async (proposalId: string, content: string) => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase.from('skill_proposal_comments').insert({
        proposal_id: proposalId,
        author_id: profile.id,
        content,
      });
      if (error) throw error;

      // Award points
      await supabase.from('teacher_contribution_points').insert({
        teacher_id: profile.id,
        points: 3,
        action_type: 'review_comment',
        reference_id: proposalId,
        description: 'Commented on proposal',
      });

      toast.success('Comment added');
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [profile?.id]);

  const fetchComments = useCallback(async (proposalId: string) => {
    const { data } = await supabase
      .from('skill_proposal_comments')
      .select('*, author:profiles!skill_proposal_comments_author_id_fkey(full_name, avatar_url)')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true });
    return (data || []) as ProposalComment[];
  }, []);

  const fetchVotes = useCallback(async (proposalId: string) => {
    const { data } = await supabase
      .from('skill_level_review_votes')
      .select('*')
      .eq('proposal_id', proposalId);
    return (data || []) as ProposalVote[];
  }, []);

  const editProposalContent = useCallback(async (
    proposalId: string,
    editedContent: any,
    editedTitle?: string
  ) => {
    if (!profile?.id) return { success: false, error: 'Not logged in' };
    try {
      const updateData: any = {
        edited_content: editedContent,
        edited_by: profile.id,
        edited_at: new Date().toISOString(),
      };
      if (editedTitle) updateData.proposed_title = editedTitle;

      const { error } = await supabase
        .from('skill_edit_proposals')
        .update(updateData)
        .eq('id', proposalId);
      if (error) throw error;

      // Award points for editing
      await supabase.from('teacher_contribution_points').insert({
        teacher_id: profile.id,
        points: 8,
        action_type: 'senior_edit',
        reference_id: proposalId,
        description: 'Edited proposal as Senior Teacher',
      });

      toast.success('Content edited and saved!');
      await load();
      return { success: true };
    } catch (err: any) {
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  }, [profile?.id, load]);

  return {
    proposals,
    myProposals,
    totalPoints,
    approvalThreshold,
    loading,
    createProposal,
    voteOnProposal,
    addComment,
    fetchComments,
    fetchVotes,
    editProposalContent,
    refresh: load,
  };
};
