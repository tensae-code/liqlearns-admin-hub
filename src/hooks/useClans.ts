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
  member_count?: number;
}

export interface ClanMember {
  id: string;
  user_id: string;
  clan_id: string;
  role: string;
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export const useClans = () => {
  const { profile } = useProfile();
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClans, setMyClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);

  // Fetch all public clans
  const fetchClans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClans(data || []);
    } catch (error) {
      console.error('Error fetching clans:', error);
    }
  }, []);

  // Fetch user's clans
  const fetchMyClans = useCallback(async () => {
    if (!profile) return;

    try {
      const { data: memberships, error } = await supabase
        .from('clan_members')
        .select(`
          clan_id,
          role,
          clans:clan_id (*)
        `)
        .eq('user_id', profile.id);

      if (error) throw error;

      const userClans = memberships
        ?.map(m => m.clans)
        .filter(Boolean) as unknown as Clan[];
      
      setMyClans(userClans || []);
    } catch (error) {
      console.error('Error fetching my clans:', error);
    }
  }, [profile]);

  // Fetch clan members
  const fetchClanMembers = useCallback(async (clanId: string) => {
    try {
      const { data, error } = await supabase
        .from('clan_members')
        .select(`
          id,
          user_id,
          clan_id,
          role,
          joined_at
        `)
        .eq('clan_id', clanId);

      if (error) throw error;

      if (data) {
        // Fetch profiles for members
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

  // Create a new clan
  const createClan = useCallback(async (data: {
    name: string;
    description?: string;
    avatarUrl?: string;
  }) => {
    if (!profile) {
      toast.error('Please sign in to create a clan');
      return null;
    }

    try {
      // Create the clan
      const { data: clan, error: clanError } = await supabase
        .from('clans')
        .insert({
          name: data.name,
          description: data.description || null,
          avatar_url: data.avatarUrl || null,
          owner_id: profile.id,
          owner_type: 'student', // Default to student, can be 'enterprise' for approved teachers
        })
        .select()
        .single();

      if (clanError) throw clanError;

      // Add owner as member
      const { error: memberError } = await supabase
        .from('clan_members')
        .insert({
          clan_id: clan.id,
          user_id: profile.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('Error adding owner as clan member:', memberError);
      }

      toast.success('Clan created!', { description: `${data.name} is now active` });
      await fetchMyClans();
      return clan;
    } catch (error: any) {
      console.error('Error creating clan:', error);
      if (error.code === '23505') {
        toast.error('Clan name already taken');
      } else {
        toast.error('Failed to create clan', { description: error.message });
      }
      return null;
    }
  }, [profile, fetchMyClans]);

  // Join a clan
  const joinClan = useCallback(async (clanId: string) => {
    if (!profile) {
      toast.error('Please sign in to join a clan');
      return false;
    }

    try {
      const { error } = await supabase
        .from('clan_members')
        .insert({
          clan_id: clanId,
          user_id: profile.id,
          role: 'member',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You are already a member of this clan');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Joined clan successfully!');
      await fetchMyClans();
      return true;
    } catch (error: any) {
      console.error('Error joining clan:', error);
      toast.error('Failed to join clan', { description: error.message });
      return false;
    }
  }, [profile, fetchMyClans]);

  // Leave a clan
  const leaveClan = useCallback(async (clanId: string) => {
    if (!profile) return false;

    try {
      // Check if user is the owner
      const { data: clan } = await supabase
        .from('clans')
        .select('owner_id')
        .eq('id', clanId)
        .single();

      if (clan?.owner_id === profile.id) {
        toast.error('Clan owners cannot leave. Transfer ownership first.');
        return false;
      }

      const { error } = await supabase
        .from('clan_members')
        .delete()
        .eq('clan_id', clanId)
        .eq('user_id', profile.id);

      if (error) throw error;

      toast.success('Left clan');
      await fetchMyClans();
      return true;
    } catch (error: any) {
      console.error('Error leaving clan:', error);
      toast.error('Failed to leave clan', { description: error.message });
      return false;
    }
  }, [profile, fetchMyClans]);

  // Invite user to clan
  const inviteToClan = useCallback(async (clanId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('clan_members')
        .insert({
          clan_id: clanId,
          user_id: userId,
          role: 'member',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('User is already a member');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Member added to clan!');
      return true;
    } catch (error: any) {
      console.error('Error inviting to clan:', error);
      toast.error('Failed to add member', { description: error.message });
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClans(), fetchMyClans()]);
      setLoading(false);
    };

    loadData();
  }, [fetchClans, fetchMyClans]);

  return {
    clans,
    myClans,
    clanMembers,
    loading,
    fetchClans,
    fetchMyClans,
    fetchClanMembers,
    createClan,
    joinClan,
    leaveClan,
    inviteToClan,
  };
};

export default useClans;
