import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface QuestBoardQuestion {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  link_url: string | null;
  hashtags: string[];
  status: 'pending' | 'approved' | 'rejected';
  views_count: number;
  answers_count: number;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export interface QuestBoardAnswer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  video_url: string | null;
  link_url: string | null;
  is_accepted: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export interface CreateQuestionInput {
  title: string;
  content?: string;
  video_url?: string;
  link_url?: string;
  hashtags?: string[];
}

export interface HashtagPreference {
  hashtag: string;
  enabled: boolean;
}

export const useQuestBoard = () => {
  const { user, userRole } = useAuth();
  const { profile } = useProfile();
  const [questions, setQuestions] = useState<QuestBoardQuestion[]>([]);
  const [myQuestions, setMyQuestions] = useState<QuestBoardQuestion[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<QuestBoardQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hashtagPreferences, setHashtagPreferences] = useState<HashtagPreference[]>([]);
  const [allHashtags, setAllHashtags] = useState<string[]>([]);

  const isAdmin = userRole === 'admin' || userRole === 'ceo';

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Fetch approved questions
      const { data: approvedData, error: approvedError } = await supabase
        .from('quest_board_questions')
        .select(`
          *,
          author:profiles!quest_board_questions_user_id_fkey(id, full_name, avatar_url, username)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (approvedError) throw approvedError;
      setQuestions((approvedData as unknown as QuestBoardQuestion[]) || []);

      // Extract unique hashtags
      const tags = new Set<string>();
      approvedData?.forEach(q => {
        (q.hashtags || []).forEach((tag: string) => tags.add(tag));
      });
      setAllHashtags(Array.from(tags));

      // Fetch user's own questions if logged in
      if (profile?.id) {
        const { data: myData, error: myError } = await supabase
          .from('quest_board_questions')
          .select(`
            *,
            author:profiles!quest_board_questions_user_id_fkey(id, full_name, avatar_url, username)
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        if (!myError) {
          setMyQuestions((myData as unknown as QuestBoardQuestion[]) || []);
        }
      }

      // Fetch pending questions for admins
      if (isAdmin) {
        const { data: pendingData, error: pendingError } = await supabase
          .from('quest_board_questions')
          .select(`
            *,
            author:profiles!quest_board_questions_user_id_fkey(id, full_name, avatar_url, username)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!pendingError) {
          setPendingQuestions((pendingData as unknown as QuestBoardQuestion[]) || []);
        }
      }

      // Fetch hashtag preferences
      if (profile?.id) {
        const { data: prefsData } = await supabase
          .from('user_hashtag_preferences')
          .select('hashtag, enabled')
          .eq('user_id', profile.id);

        if (prefsData) {
          setHashtagPreferences(prefsData);
        }
      }
    } catch (err) {
      console.error('Error fetching quest board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [profile?.id, isAdmin]);

  const createQuestion = async (input: CreateQuestionInput) => {
    if (!profile?.id) {
      toast.error('Please sign in to ask a question');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('quest_board_questions')
        .insert({
          user_id: profile.id,
          title: input.title,
          content: input.content || null,
          video_url: input.video_url || null,
          link_url: input.link_url || null,
          hashtags: input.hashtags || [],
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Question submitted for approval! 📝');
      setMyQuestions(prev => [data as unknown as QuestBoardQuestion, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating question:', err);
      toast.error('Failed to submit question');
      return null;
    }
  };

  const approveQuestion = async (questionId: string) => {
    if (!isAdmin || !profile?.id) return false;

    try {
      const { error } = await supabase
        .from('quest_board_questions')
        .update({
          status: 'approved',
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Question approved! ✅');
      await fetchQuestions();
      return true;
    } catch (err) {
      console.error('Error approving question:', err);
      toast.error('Failed to approve question');
      return false;
    }
  };

  const rejectQuestion = async (questionId: string, reason: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('quest_board_questions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Question rejected');
      await fetchQuestions();
      return true;
    } catch (err) {
      console.error('Error rejecting question:', err);
      toast.error('Failed to reject question');
      return false;
    }
  };

  const answerQuestion = async (questionId: string, content: string, videoUrl?: string, linkUrl?: string) => {
    if (!profile?.id) {
      toast.error('Please sign in to answer');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('quest_board_answers')
        .insert({
          question_id: questionId,
          user_id: profile.id,
          content,
          video_url: videoUrl || null,
          link_url: linkUrl || null,
        })
        .select(`
          *,
          author:profiles!quest_board_answers_user_id_fkey(id, full_name, avatar_url, username)
        `)
        .single();

      if (error) throw error;

      toast.success('Answer posted! 🎉');
      return data as unknown as QuestBoardAnswer;
    } catch (err) {
      console.error('Error posting answer:', err);
      toast.error('Failed to post answer');
      return null;
    }
  };

  const updateHashtagPreference = async (hashtag: string, enabled: boolean) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('user_hashtag_preferences')
        .upsert({
          user_id: profile.id,
          hashtag,
          enabled,
        }, { onConflict: 'user_id,hashtag' });

      if (error) throw error;

      setHashtagPreferences(prev => {
        const existing = prev.find(p => p.hashtag === hashtag);
        if (existing) {
          return prev.map(p => p.hashtag === hashtag ? { ...p, enabled } : p);
        }
        return [...prev, { hashtag, enabled }];
      });
    } catch (err) {
      console.error('Error updating preference:', err);
    }
  };

  const getFilteredQuestions = () => {
    const disabledTags = hashtagPreferences
      .filter(p => !p.enabled)
      .map(p => p.hashtag);

    if (disabledTags.length === 0) return questions;

    return questions.filter(q => {
      const qTags = q.hashtags || [];
      return !qTags.some(tag => disabledTags.includes(tag));
    });
  };

  return {
    questions: getFilteredQuestions(),
    allQuestions: questions,
    myQuestions,
    pendingQuestions,
    loading,
    allHashtags,
    hashtagPreferences,
    isAdmin,
    createQuestion,
    approveQuestion,
    rejectQuestion,
    answerQuestion,
    updateHashtagPreference,
    refetch: fetchQuestions,
  };
};

export const useQuestBoardAnswers = (questionId: string) => {
  const [answers, setAnswers] = useState<QuestBoardAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const { data, error } = await supabase
          .from('quest_board_answers')
          .select(`
            *,
            author:profiles!quest_board_answers_user_id_fkey(id, full_name, avatar_url, username)
          `)
          .eq('question_id', questionId)
          .order('is_accepted', { ascending: false })
          .order('upvotes', { ascending: false });

        if (error) throw error;
        setAnswers((data as unknown as QuestBoardAnswer[]) || []);
      } catch (err) {
        console.error('Error fetching answers:', err);
      } finally {
        setLoading(false);
      }
    };

    if (questionId) fetchAnswers();
  }, [questionId]);

  return { answers, loading };
};
