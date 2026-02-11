import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface Clan {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
  owner_type: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  min_level: number;
  is_recruiting: boolean;
  invite_code: string | null;
  max_members: number;
  clan_xp: number;
  clan_level: number;
  badge_icon: string;
  badge_color: string;
  enterprise_id: string | null;
}

export interface ClanMember {
  id: string;
  user_id: string;
  clan_id: string;
  role: string; // 'leader' | 'co_leader' | 'elder' | 'member'
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export interface Party {
  id: string;
  clan_id: string;
  name: string;
  created_by: string;
  max_members: number;
  created_at: string;
  members?: { id: string; user_id: string; profile?: { full_name: string; avatar_url: string | null } }[];
}

export interface ClanBattleLog {
  id: string;
  clan_id: string;
  battle_id: string | null;
  war_id: string | null;
  event_type: string;
  description: string | null;
  xp_earned: number;
  metadata: any;
  created_at: string;
}

export interface ClanJoinRequest {
  id: string;
  clan_id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null; username: string };
}

export const useClans = () => {
  const { profile } = useProfile();
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClans, setMyClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [battleLog, setBattleLog] = useState<ClanBattleLog[]>([]);
  const [joinRequests, setJoinRequests] = useState<ClanJoinRequest[]>([]);

  const fetchClans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clans')
        .select('*')
        .order('clan_xp', { ascending: false });
      if (error) throw error;
      setClans((data || []) as unknown as Clan[]);
    } catch (error) {
      console.error('Error fetching clans:', error);
    }
  }, []);

  const fetchMyClans = useCallback(async () => {
    if (!profile) return;
    try {
      const { data: memberships, error } = await supabase
        .from('clan_members')
        .select('clan_id, role, clans:clan_id (*)')
        .eq('user_id', profile.id);
      if (error) throw error;
      const userClans = memberships?.map(m => m.clans).filter(Boolean) as unknown as Clan[];
      setMyClans(userClans || []);
    } catch (error) {
      console.error('Error fetching my clans:', error);
    }
  }, [profile]);

  const fetchClanMembers = useCallback(async (clanId: string) => {
    try {
      const { data, error } = await supabase
        .from('clan_members')
        .select('id, user_id, clan_id, role, joined_at')
        .eq('clan_id', clanId);
      if (error) throw error;
      if (data) {
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', userIds);
        const membersWithProfiles: ClanMember[] = data.map(m => ({
          ...m,
          profile: profiles?.find(p => p.id === m.user_id) as ClanMember['profile'],
        }));
        setClanMembers(membersWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching clan members:', error);
    }
  }, []);

  const fetchParties = useCallback(async (clanId: string) => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('clan_id', clanId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        // Fetch party members
        const partyIds = data.map(p => p.id);
        const { data: members } = await supabase
          .from('party_members')
          .select('id, party_id, user_id')
          .in('party_id', partyIds);
        const memberUserIds = members?.map(m => m.user_id) || [];
        const { data: memberProfiles } = memberUserIds.length > 0
          ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', memberUserIds)
          : { data: [] };

        const partiesWithMembers: Party[] = data.map(p => ({
          ...p,
          members: (members || [])
            .filter(m => m.party_id === p.id)
            .map(m => ({
              ...m,
              profile: memberProfiles?.find(pr => pr.id === m.user_id) as any,
            })),
        }));
        setParties(partiesWithMembers);
      }
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  }, []);

  const fetchBattleLog = useCallback(async (clanId: string) => {
    try {
      const { data, error } = await supabase
        .from('clan_battle_log')
        .select('*')
        .eq('clan_id', clanId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setBattleLog((data || []) as ClanBattleLog[]);
    } catch (error) {
      console.error('Error fetching battle log:', error);
    }
  }, []);

  const fetchJoinRequests = useCallback(async (clanId: string) => {
    try {
      const { data, error } = await supabase
        .from('clan_join_requests')
        .select('*')
        .eq('clan_id', clanId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const userIds = data.map(r => r.user_id);
        const { data: profiles } = userIds.length > 0
          ? await supabase.from('profiles').select('id, full_name, avatar_url, username').in('id', userIds)
          : { data: [] };
        setJoinRequests(data.map(r => ({
          ...r,
          profile: profiles?.find(p => p.id === r.user_id) as any,
        })));
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  }, []);

  const createClan = useCallback(async (data: {
    name: string;
    description?: string;
    avatarUrl?: string;
    badgeIcon?: string;
    badgeColor?: string;
    minLevel?: number;
    maxMembers?: number;
  }) => {
    if (!profile) { toast.error('Please sign in'); return null; }
    try {
      const ownerType = (profile as any).teacher_type === 'enterprise' ? 'enterprise_teacher' : 'students';
      const { data: clan, error } = await supabase
        .from('clans')
        .insert({
          name: data.name,
          description: data.description || null,
          avatar_url: data.avatarUrl || null,
          owner_id: profile.id,
          owner_type: ownerType,
          badge_icon: data.badgeIcon || 'shield',
          badge_color: data.badgeColor || '#FFD700',
          min_level: data.minLevel || 0,
          max_members: data.maxMembers || 30,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('clan_members').insert({
        clan_id: clan.id,
        user_id: profile.id,
        role: 'leader',
      });

      // Log creation
      await supabase.from('clan_battle_log').insert({
        clan_id: clan.id,
        event_type: 'clan_created',
        description: `${data.name} was created`,
        xp_earned: 10,
      });

      toast.success('Clan created!', { description: data.name });
      await fetchMyClans();
      return clan;
    } catch (error: any) {
      if (error.code === '23505') toast.error('Clan name already taken');
      else toast.error('Failed to create clan', { description: error.message });
      return null;
    }
  }, [profile, fetchMyClans]);

  const joinClan = useCallback(async (clanId: string) => {
    if (!profile) { toast.error('Please sign in'); return false; }
    try {
      const { error } = await supabase.from('clan_members').insert({
        clan_id: clanId,
        user_id: profile.id,
        role: 'member',
      });
      if (error) {
        if (error.code === '23505') toast.error('Already a member');
        else throw error;
        return false;
      }
      await supabase.from('clan_battle_log').insert({
        clan_id: clanId,
        event_type: 'member_joined',
        description: `${profile.full_name || 'A user'} joined the clan`,
        xp_earned: 5,
      });
      toast.success('Joined clan!');
      await fetchMyClans();
      return true;
    } catch (error: any) {
      toast.error('Failed to join', { description: error.message });
      return false;
    }
  }, [profile, fetchMyClans]);

  const joinByInviteCode = useCallback(async (code: string) => {
    if (!profile) { toast.error('Please sign in'); return false; }
    try {
      const { data: clan, error: findError } = await supabase
        .from('clans')
        .select('id, name')
        .eq('invite_code', code.trim())
        .maybeSingle();
      if (findError) throw findError;
      if (!clan) { toast.error('Invalid invite code'); return false; }
      return await joinClan(clan.id);
    } catch (error: any) {
      toast.error('Failed to join', { description: error.message });
      return false;
    }
  }, [profile, joinClan]);

  const requestToJoin = useCallback(async (clanId: string, message?: string) => {
    if (!profile) { toast.error('Please sign in'); return false; }
    try {
      const { error } = await supabase.from('clan_join_requests').insert({
        clan_id: clanId,
        user_id: profile.id,
        message: message || null,
      });
      if (error) {
        if (error.code === '23505') toast.error('Request already sent');
        else throw error;
        return false;
      }
      toast.success('Join request sent!');
      return true;
    } catch (error: any) {
      toast.error('Failed to send request', { description: error.message });
      return false;
    }
  }, [profile]);

  const handleJoinRequest = useCallback(async (requestId: string, action: 'accepted' | 'rejected') => {
    if (!profile) return false;
    try {
      const { data: req, error: fetchErr } = await supabase
        .from('clan_join_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      if (fetchErr) throw fetchErr;

      await supabase.from('clan_join_requests').update({
        status: action,
        reviewed_by: profile.id,
      }).eq('id', requestId);

      if (action === 'accepted') {
        await supabase.from('clan_members').insert({
          clan_id: req.clan_id,
          user_id: req.user_id,
          role: 'member',
        });
        await supabase.from('clan_battle_log').insert({
          clan_id: req.clan_id,
          event_type: 'member_joined',
          description: 'New member accepted via request',
          xp_earned: 5,
        });
      }
      toast.success(action === 'accepted' ? 'Member accepted!' : 'Request rejected');
      return true;
    } catch (error: any) {
      toast.error('Failed', { description: error.message });
      return false;
    }
  }, [profile]);

  const leaveClan = useCallback(async (clanId: string) => {
    if (!profile) return false;
    try {
      const { data: clan } = await supabase.from('clans').select('owner_id').eq('id', clanId).single();
      if (clan?.owner_id === profile.id) {
        toast.error('Owners cannot leave. Transfer ownership first.');
        return false;
      }
      const { error } = await supabase.from('clan_members').delete().eq('clan_id', clanId).eq('user_id', profile.id);
      if (error) throw error;
      toast.success('Left clan');
      await fetchMyClans();
      return true;
    } catch (error: any) {
      toast.error('Failed to leave', { description: error.message });
      return false;
    }
  }, [profile, fetchMyClans]);

  const updateMemberRole = useCallback(async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('clan_members').update({ role: newRole }).eq('id', memberId);
      if (error) throw error;
      toast.success(`Role updated to ${newRole}`);
      return true;
    } catch (error: any) {
      toast.error('Failed to update role', { description: error.message });
      return false;
    }
  }, []);

  const createParty = useCallback(async (clanId: string, name: string) => {
    if (!profile) return null;
    try {
      const { data, error } = await supabase.from('parties').insert({
        clan_id: clanId,
        name,
        created_by: profile.id,
      }).select().single();
      if (error) throw error;
      // Auto-join creator
      await supabase.from('party_members').insert({ party_id: data.id, user_id: profile.id });
      toast.success('Party created!');
      return data;
    } catch (error: any) {
      toast.error('Failed to create party', { description: error.message });
      return null;
    }
  }, [profile]);

  const joinParty = useCallback(async (partyId: string) => {
    if (!profile) return false;
    try {
      const { error } = await supabase.from('party_members').insert({ party_id: partyId, user_id: profile.id });
      if (error) {
        if (error.code === '23505') toast.error('Already in this party');
        else throw error;
        return false;
      }
      toast.success('Joined party!');
      return true;
    } catch (error: any) {
      toast.error('Failed to join party', { description: error.message });
      return false;
    }
  }, [profile]);

  const leaveParty = useCallback(async (partyId: string) => {
    if (!profile) return false;
    try {
      const { error } = await supabase.from('party_members').delete().eq('party_id', partyId).eq('user_id', profile.id);
      if (error) throw error;
      toast.success('Left party');
      return true;
    } catch (error: any) {
      toast.error('Failed', { description: error.message });
      return false;
    }
  }, [profile]);

  const inviteToClan = useCallback(async (clanId: string, userId: string) => {
    try {
      const { error } = await supabase.from('clan_members').insert({
        clan_id: clanId,
        user_id: userId,
        role: 'member',
      });
      if (error) {
        if (error.code === '23505') toast.error('User is already a member');
        else throw error;
        return false;
      }
      toast.success('Member added!');
      return true;
    } catch (error: any) {
      toast.error('Failed to add member', { description: error.message });
      return false;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClans(), fetchMyClans()]);
      setLoading(false);
    };
    loadData();
  }, [fetchClans, fetchMyClans]);

  return {
    clans, myClans, clanMembers, parties, battleLog, joinRequests, loading,
    fetchClans, fetchMyClans, fetchClanMembers, fetchParties, fetchBattleLog, fetchJoinRequests,
    createClan, joinClan, joinByInviteCode, requestToJoin, handleJoinRequest,
    leaveClan, inviteToClan, updateMemberRole,
    createParty, joinParty, leaveParty,
  };
};

export default useClans;
