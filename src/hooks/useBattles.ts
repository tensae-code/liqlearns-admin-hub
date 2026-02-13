import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface BattleWallet {
  id: string;
  user_id: string;
  balance: number;
  total_won: number;
  total_lost: number;
  wins: number;
  losses: number;
  draws: number;
  rank_points: number;
}

export interface Battle {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  course_id: string | null;
  game_id: string | null;
  stake_amount: number;
  status: string;
  winner_id: string | null;
  challenger_score: number | null;
  opponent_score: number | null;
  challenger_time_seconds: number | null;
  opponent_time_seconds: number | null;
  is_open: boolean;
  voice_enabled: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  // joined data
  challenger_profile?: { full_name: string; avatar_url: string | null; username: string };
  opponent_profile?: { full_name: string; avatar_url: string | null; username: string };
  course?: { title: string };
  game?: { title: string; type: string };
}

export interface BattleMessage {
  id: string;
  battle_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_profile?: { full_name: string; avatar_url: string | null };
}

export const useBattles = () => {
  const { profile } = useProfile();
  const [wallet, setWallet] = useState<BattleWallet | null>(null);
  const [myBattles, setMyBattles] = useState<Battle[]>([]);
  const [openBattles, setOpenBattles] = useState<Battle[]>([]);
  const [leaderboard, setLeaderboard] = useState<(BattleWallet & { profile?: { full_name: string; avatar_url: string | null; username: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  // Ensure wallet exists
  const ensureWallet = useCallback(async () => {
    if (!profile?.id) return null;
    const { data } = await supabase
      .from('battle_wallets')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();
    if (data) { setWallet(data as unknown as BattleWallet); return data; }
    // Create wallet
    const { data: newWallet, error } = await supabase
      .from('battle_wallets')
      .insert({ user_id: profile.id })
      .select()
      .single();
    if (error) { console.error('Wallet creation error:', error); return null; }
    setWallet(newWallet as unknown as BattleWallet);
    return newWallet;
  }, [profile?.id]);

  // Fetch battles involving user
  const fetchMyBattles = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('battles')
      .select('*')
      .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      // Fetch profiles for battles
      const userIds = new Set<string>();
      data.forEach((b: any) => { userIds.add(b.challenger_id); if (b.opponent_id) userIds.add(b.opponent_id); });
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url, username').in('id', Array.from(userIds));
      const courseIds = data.filter((b: any) => b.course_id).map((b: any) => b.course_id);
      const { data: courses } = courseIds.length ? await supabase.from('courses').select('id, title').in('id', courseIds) : { data: [] };
      const gameIds = data.filter((b: any) => b.game_id).map((b: any) => b.game_id);
      const { data: games } = gameIds.length ? await supabase.from('game_templates').select('id, title, type').in('id', gameIds) : { data: [] };

      setMyBattles(data.map((b: any) => ({
        ...b,
        challenger_profile: profiles?.find((p: any) => p.id === b.challenger_id),
        opponent_profile: b.opponent_id ? profiles?.find((p: any) => p.id === b.opponent_id) : undefined,
        course: courses?.find((c: any) => c.id === b.course_id),
        game: games?.find((g: any) => g.id === b.game_id),
      })));
    }
  }, [profile?.id]);

  // Fetch open battles (matchmaking - sorted by similar rank)
  const fetchOpenBattles = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('battles')
      .select('*')
      .eq('is_open', true)
      .eq('status', 'pending')
      .neq('challenger_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) {
      const userIds = data.map((b: any) => b.challenger_id);
      const { data: profiles } = userIds.length ? await supabase.from('profiles').select('id, full_name, avatar_url, username').in('id', userIds) : { data: [] };
      const gameIds = data.filter((b: any) => b.game_id).map((b: any) => b.game_id);
      const { data: games } = gameIds.length ? await supabase.from('game_templates').select('id, title, type').in('id', gameIds) : { data: [] };
      const courseIds = data.filter((b: any) => b.course_id).map((b: any) => b.course_id);
      const { data: courses } = courseIds.length ? await supabase.from('courses').select('id, title').in('id', courseIds) : { data: [] };

      // Fetch challenger wallets for rank-based sorting
      const challengerIds = data.map((b: any) => b.challenger_id);
      const { data: wallets } = challengerIds.length ? await supabase.from('battle_wallets').select('user_id, rank_points').in('user_id', challengerIds) : { data: [] };

      const enriched = data.map((b: any) => ({
        ...b,
        challenger_profile: profiles?.find((p: any) => p.id === b.challenger_id),
        game: games?.find((g: any) => g.id === b.game_id),
        course: courses?.find((c: any) => c.id === b.course_id),
        challenger_rank: wallets?.find((w: any) => w.user_id === b.challenger_id)?.rank_points || 1000,
      }));

      // Sort by closest rank to current user
      const myRank = wallet?.rank_points || 1000;
      enriched.sort((a: any, b: any) => Math.abs(a.challenger_rank - myRank) - Math.abs(b.challenger_rank - myRank));

      setOpenBattles(enriched);
    }
  }, [profile?.id, wallet?.rank_points]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('battle_wallets')
      .select('*')
      .order('rank_points', { ascending: false })
      .limit(20);
    if (data) {
      const userIds = data.map((w: any) => w.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url, username').in('id', userIds);
      setLeaderboard(data.map((w: any) => ({
        ...w,
        profile: profiles?.find((p: any) => p.id === w.user_id),
      })));
    }
  }, []);

  // Create a battle challenge
  const createBattle = useCallback(async (opts: {
    opponentId?: string;
    courseId?: string;
    gameId?: string;
    stakeAmount: number;
    isOpen: boolean;
    voiceEnabled: boolean;
    mode?: string;
    maxTeamSize?: number;
    isJudged?: boolean;
    isPrivate?: boolean;
    allowSpectators?: boolean;
    spectatorCamera?: boolean;
    spectatorAudio?: boolean;
    spectatorChat?: boolean;
  }) => {
    if (!profile?.id) { toast.error('Sign in first'); return null; }
    if (!wallet || wallet.balance < opts.stakeAmount) { toast.error('Insufficient battle points'); return null; }

    const { data, error } = await supabase.from('battles').insert({
      challenger_id: profile.id,
      opponent_id: opts.opponentId || null,
      course_id: opts.courseId || null,
      game_id: opts.gameId || null,
      stake_amount: opts.stakeAmount,
      is_open: opts.isOpen,
      voice_enabled: opts.voiceEnabled,
      mode: opts.mode || '1v1',
      max_team_size: opts.maxTeamSize || 1,
      is_judged: opts.isJudged || false,
      is_private: opts.isPrivate || false,
      allow_spectators: opts.allowSpectators ?? true,
      spectator_camera: opts.spectatorCamera || false,
      spectator_audio: opts.spectatorAudio || false,
      spectator_chat: opts.spectatorChat ?? true,
    }).select().single();

    if (error) { toast.error('Failed to create battle'); return null; }
    toast.success('Battle challenge sent!');
    await fetchMyBattles();
    return data;
  }, [profile?.id, wallet, fetchMyBattles]);

  // Accept a battle
  const acceptBattle = useCallback(async (battleId: string) => {
    if (!profile?.id) return false;
    if (!wallet || wallet.balance < 10) { toast.error('Insufficient battle points'); return false; }

    const { error } = await supabase.from('battles').update({
      opponent_id: profile.id,
      status: 'accepted',
    }).eq('id', battleId).eq('status', 'pending');

    if (error) { toast.error('Failed to accept battle'); return false; }
    toast.success('Battle accepted! Get ready!');
    await Promise.all([fetchMyBattles(), fetchOpenBattles()]);
    return true;
  }, [profile?.id, wallet, fetchMyBattles, fetchOpenBattles]);

  // Cancel a battle
  const cancelBattle = useCallback(async (battleId: string) => {
    if (!profile?.id) return false;
    const { error } = await supabase.from('battles').update({ status: 'cancelled' }).eq('id', battleId).eq('challenger_id', profile.id);
    if (error) { toast.error('Failed to cancel'); return false; }
    toast.success('Battle cancelled');
    await fetchMyBattles();
    return true;
  }, [profile?.id, fetchMyBattles]);

  // Get rank title
  const getRankTitle = (points: number) => {
    if (points >= 2500) return { title: 'Legendary', color: 'text-yellow-400' };
    if (points >= 2000) return { title: 'Master', color: 'text-purple-400' };
    if (points >= 1500) return { title: 'Diamond', color: 'text-cyan-400' };
    if (points >= 1200) return { title: 'Gold', color: 'text-yellow-500' };
    if (points >= 1000) return { title: 'Silver', color: 'text-gray-400' };
    if (points >= 800) return { title: 'Bronze', color: 'text-orange-600' };
    return { title: 'Rookie', color: 'text-muted-foreground' };
  };

  // Initial load
  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([ensureWallet(), fetchMyBattles(), fetchOpenBattles(), fetchLeaderboard()]);
      setLoading(false);
    };
    load();
  }, [profile?.id, ensureWallet, fetchMyBattles, fetchOpenBattles, fetchLeaderboard]);

  // Realtime subscription for battles
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('battles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles' }, () => {
        fetchMyBattles();
        fetchOpenBattles();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, fetchMyBattles, fetchOpenBattles]);

  return {
    wallet,
    myBattles,
    openBattles,
    leaderboard,
    loading,
    createBattle,
    acceptBattle,
    cancelBattle,
    getRankTitle,
    fetchMyBattles,
    fetchOpenBattles,
    fetchLeaderboard,
    ensureWallet,
  };
};
