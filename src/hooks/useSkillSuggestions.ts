import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface SkillSuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'in_development';
  votes_up: number;
  votes_down: number;
  voting_ends_at: string | null;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  myVote?: 'up' | 'down' | null;
}

export function useSkillSuggestions() {
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [mySuggestions, setMySuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();

  const fetchSuggestions = async () => {
    try {
      // Fetch public suggestions (voting, approved, in_development)
      const { data: publicData, error: publicError } = await supabase
        .from('skill_suggestions')
        .select(`
          id,
          name,
          description,
          category,
          status,
          votes_up,
          votes_down,
          voting_ends_at,
          created_at,
          user_id
        `)
        .in('status', ['voting', 'approved', 'in_development'])
        .order('votes_up', { ascending: false });

      if (publicError) throw publicError;

      // Fetch author profiles
      const userIds = [...new Set((publicData || []).map(s => s.user_id))];
      let profilesMap: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      // Fetch user's votes if authenticated
      let userVotes: Record<string, 'up' | 'down'> = {};
      if (profile?.id) {
        const { data: votes } = await supabase
          .from('skill_suggestion_votes')
          .select('suggestion_id, vote_type')
          .eq('user_id', profile.id);
        
        if (votes) {
          userVotes = votes.reduce((acc, v) => {
            acc[v.suggestion_id] = v.vote_type as 'up' | 'down';
            return acc;
          }, {} as typeof userVotes);
        }
      }

      const formattedSuggestions: SkillSuggestion[] = (publicData || []).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        status: s.status as SkillSuggestion['status'],
        votes_up: s.votes_up,
        votes_down: s.votes_down,
        voting_ends_at: s.voting_ends_at,
        created_at: s.created_at,
        author: profilesMap[s.user_id],
        myVote: userVotes[s.id] || null,
      }));

      setSuggestions(formattedSuggestions);

      // Fetch user's own pending suggestions
      if (profile?.id) {
        const { data: myData } = await supabase
          .from('skill_suggestions')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (myData) {
          setMySuggestions(myData.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            category: s.category,
            status: s.status as SkillSuggestion['status'],
            votes_up: s.votes_up,
            votes_down: s.votes_down,
            voting_ends_at: s.voting_ends_at,
            created_at: s.created_at,
            author: profile ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined,
            myVote: null,
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [profile?.id]);

  const submitSuggestion = async (name: string, description: string, category: string = 'General') => {
    if (!profile?.id) {
      toast.error('Please sign in to submit a suggestion');
      return false;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('skill_suggestions')
        .insert({
          name,
          description,
          category,
          user_id: profile.id,
          status: 'pending', // Starts as pending for admin approval
        });

      if (error) throw error;

      toast.success('Suggestion submitted!', {
        description: 'Your skill suggestion has been sent to admin for approval.',
      });

      await fetchSuggestions();
      return true;
    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      toast.error('Failed to submit suggestion', { description: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (suggestionId: string, voteType: 'up' | 'down') => {
    if (!profile?.id) {
      toast.error('Please sign in to vote');
      return false;
    }

    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return false;

    try {
      if (suggestion.myVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from('skill_suggestion_votes')
          .delete()
          .eq('suggestion_id', suggestionId)
          .eq('user_id', profile.id);

        if (error) throw error;

        setSuggestions(prev => prev.map(s => {
          if (s.id === suggestionId) {
            return {
              ...s,
              votes_up: voteType === 'up' ? s.votes_up - 1 : s.votes_up,
              votes_down: voteType === 'down' ? s.votes_down - 1 : s.votes_down,
              myVote: null,
            };
          }
          return s;
        }));
      } else if (suggestion.myVote) {
        // Change vote
        const { error } = await supabase
          .from('skill_suggestion_votes')
          .update({ vote_type: voteType })
          .eq('suggestion_id', suggestionId)
          .eq('user_id', profile.id);

        if (error) throw error;

        setSuggestions(prev => prev.map(s => {
          if (s.id === suggestionId) {
            return {
              ...s,
              votes_up: voteType === 'up' ? s.votes_up + 1 : s.votes_up - 1,
              votes_down: voteType === 'down' ? s.votes_down + 1 : s.votes_down - 1,
              myVote: voteType,
            };
          }
          return s;
        }));
      } else {
        // New vote
        const { error } = await supabase
          .from('skill_suggestion_votes')
          .insert({
            suggestion_id: suggestionId,
            user_id: profile.id,
            vote_type: voteType,
          });

        if (error) throw error;

        setSuggestions(prev => prev.map(s => {
          if (s.id === suggestionId) {
            return {
              ...s,
              votes_up: voteType === 'up' ? s.votes_up + 1 : s.votes_up,
              votes_down: voteType === 'down' ? s.votes_down + 1 : s.votes_down,
              myVote: voteType,
            };
          }
          return s;
        }));

        toast.success(voteType === 'up' ? 'Upvoted!' : 'Downvoted!');
      }

      return true;
    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error('Failed to vote', { description: error.message });
      return false;
    }
  };

  const deleteSuggestion = async (suggestionId: string) => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from('skill_suggestions')
        .delete()
        .eq('id', suggestionId)
        .eq('user_id', profile.id);

      if (error) throw error;

      setMySuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast.success('Suggestion deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting suggestion:', error);
      toast.error('Failed to delete suggestion');
      return false;
    }
  };

  return {
    suggestions,
    mySuggestions,
    loading,
    submitting,
    submitSuggestion,
    vote,
    deleteSuggestion,
    isAuthenticated: !!user,
  };
}
