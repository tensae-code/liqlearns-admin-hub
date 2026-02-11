import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useClans } from '@/hooks/useClans';
import { toast } from 'sonner';

export interface ClanWar {
  id: string;
  challenger_clan_id: string;
  opponent_clan_id: string;
  status: string;
  total_games: number;
  challenger_score: number;
  opponent_score: number;
  winner_clan_id: string | null;
  stake_per_member: number;
  game_ids: string[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  // joined
  challenger_clan?: { name: string; avatar_url: string | null };
  opponent_clan?: { name: string; avatar_url: string | null };
}

export interface ClanWarRound {
  id: string;
  war_id: string;
  round_number: number;
  game_id: string | null;
  challenger_player_id: string | null;
  opponent_player_id: string | null;
  challenger_score: number | null;
  opponent_score: number | null;
  winner_player_id: string | null;
  status: string;
  battle_id: string | null;
  game?: { title: string; type: string };
  challenger_player?: { full_name: string; avatar_url: string | null };
  opponent_player?: { full_name: string; avatar_url: string | null };
}

export const useClanWars = () => {
  const { profile } = useProfile();
  const { myClans } = useClans();
  const [wars, setWars] = useState<ClanWar[]>([]);
  const [loading, setLoading] = useState(true);

  const myClanIds = myClans.map(c => c.id);

  const fetchWars = useCallback(async () => {
    if (myClanIds.length === 0) { setWars([]); setLoading(false); return; }
    
    const { data, error } = await supabase
      .from('clan_wars')
      .select('*')
      .or(myClanIds.map(id => `challenger_clan_id.eq.${id},opponent_clan_id.eq.${id}`).join(','))
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) { console.error('fetch wars error', error); setLoading(false); return; }

    if (data?.length) {
      const clanIds = new Set<string>();
      data.forEach((w: any) => { clanIds.add(w.challenger_clan_id); clanIds.add(w.opponent_clan_id); });
      const { data: clans } = await supabase.from('clans').select('id, name, avatar_url').in('id', Array.from(clanIds));

      setWars(data.map((w: any) => ({
        ...w,
        challenger_clan: clans?.find((c: any) => c.id === w.challenger_clan_id),
        opponent_clan: clans?.find((c: any) => c.id === w.opponent_clan_id),
      })));
    } else {
      setWars([]);
    }
    setLoading(false);
  }, [myClanIds.join(',')]);

  // Request a clan war
  const requestWar = useCallback(async (opts: {
    challengerClanId: string;
    opponentClanId: string;
    totalGames: number;
    stakePerMember: number;
    gameIds: string[];
  }) => {
    if (!profile?.id) { toast.error('Sign in first'); return null; }

    const { data, error } = await supabase.from('clan_wars').insert({
      challenger_clan_id: opts.challengerClanId,
      opponent_clan_id: opts.opponentClanId,
      total_games: opts.totalGames,
      stake_per_member: opts.stakePerMember,
      game_ids: opts.gameIds,
    }).select().single();

    if (error) { toast.error('Failed to request war: ' + error.message); return null; }
    toast.success('Clan War challenge sent! ⚔️');
    await fetchWars();
    return data;
  }, [profile?.id, fetchWars]);

  // Accept a clan war
  const acceptWar = useCallback(async (warId: string) => {
    const { error } = await supabase.from('clan_wars').update({
      status: 'accepted',
      started_at: new Date().toISOString(),
    }).eq('id', warId).eq('status', 'pending');

    if (error) { toast.error('Failed to accept'); return false; }
    toast.success('Clan War accepted! Prepare your warriors!');
    await fetchWars();
    return true;
  }, [fetchWars]);

  // Decline a clan war
  const declineWar = useCallback(async (warId: string) => {
    const { error } = await supabase.from('clan_wars').update({
      status: 'cancelled',
    }).eq('id', warId).eq('status', 'pending');

    if (error) { toast.error('Failed to decline'); return false; }
    toast.success('War declined');
    await fetchWars();
    return true;
  }, [fetchWars]);

  useEffect(() => {
    fetchWars();
  }, [fetchWars]);

  // Realtime
  useEffect(() => {
    if (myClanIds.length === 0) return;
    const channel = supabase
      .channel('clan-wars-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_wars' }, () => {
        fetchWars();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myClanIds.join(','), fetchWars]);

  return { wars, loading, requestWar, acceptWar, declineWar, fetchWars, myClanIds };
};
