import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  room_type: 'public' | 'private' | 'kids';
  host_id: string;
  study_topic: string | null;
  education_level: string | null;
  country: string | null;
  max_participants: number;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  is_system_room?: boolean;
  is_always_muted?: boolean;
  host?: {
    full_name: string;
    avatar_url: string | null;
  };
  participant_count?: number;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  study_title: string | null;
  is_mic_on: boolean;
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
    education_level?: string;
  };
  pin_count?: number;
  is_pinned_by_me?: boolean;
}

export const useStudyRooms = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);

  // Fetch all active rooms
  const fetchRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participant counts and host info for each room
      const roomsWithDetails = await Promise.all(
        (data || []).map(async (room) => {
          const { count } = await supabase
            .from('study_room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);
          
          // Get host profile
          const { data: hostData } = await supabase
            .from('public_profiles')
            .select('full_name, avatar_url')
            .eq('id', room.host_id)
            .single();

          return {
            ...room,
            room_type: room.room_type as 'public' | 'private' | 'kids',
            is_system_room: (room as any).is_system_room || false,
            is_always_muted: (room as any).is_always_muted || false,
            participant_count: count || 0,
            host: hostData || { full_name: 'Unknown', avatar_url: null },
          };
        })
      );

      // Sort: system rooms first, then by created_at
      const sortedRooms = roomsWithDetails.sort((a, b) => {
        if (a.is_system_room && !b.is_system_room) return -1;
        if (!a.is_system_room && b.is_system_room) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setRooms(sortedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new room
  const createRoom = async (roomData: {
    name: string;
    description?: string;
    room_type: 'public' | 'private' | 'kids';
    study_topic?: string;
    education_level?: string;
    country?: string;
    max_participants?: number;
  }) => {
    if (!profile?.id) {
      toast({ title: 'Error', description: 'Please log in to create a room', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .insert({
          ...roomData,
          host_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Room Created!', description: 'Your study room is now live' });
      await fetchRooms();
      return data;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  // Join a room
  const joinRoom = async (roomId: string, studyTitle?: string) => {
    if (!profile?.id) {
      toast({ title: 'Error', description: 'Please log in to join a room', variant: 'destructive' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('study_room_participants')
        .insert({
          room_id: roomId,
          user_id: profile.id,
          study_title: studyTitle || null,
        });

      if (error) throw error;

      toast({ title: 'Joined Room!', description: 'You are now in the study room' });
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  // Leave a room
  const leaveRoom = async (roomId: string) => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from('study_room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', profile.id);

      if (error) throw error;

      setCurrentRoom(null);
      toast({ title: 'Left Room', description: 'You have left the study room' });
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  // Toggle microphone
  const toggleMic = async (roomId: string, isMicOn: boolean) => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('study_room_participants')
        .update({ is_mic_on: isMicOn })
        .eq('room_id', roomId)
        .eq('user_id', profile.id);
    } catch (error) {
      console.error('Error toggling mic:', error);
    }
  };

  // Update study title
  const updateStudyTitle = async (roomId: string, studyTitle: string) => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('study_room_participants')
        .update({ study_title: studyTitle })
        .eq('room_id', roomId)
        .eq('user_id', profile.id);
    } catch (error) {
      console.error('Error updating study title:', error);
    }
  };

  // Pin a user
  const pinUser = async (roomId: string, pinnedUserId: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('study_room_pins')
        .insert({
          room_id: roomId,
          pinner_id: profile.id,
          pinned_user_id: pinnedUserId,
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error pinning user:', error);
    }
  };

  // Unpin a user
  const unpinUser = async (roomId: string, pinnedUserId: string) => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('study_room_pins')
        .delete()
        .eq('room_id', roomId)
        .eq('pinner_id', profile.id)
        .eq('pinned_user_id', pinnedUserId);
    } catch (error) {
      console.error('Error unpinning user:', error);
    }
  };

  // Fetch participants for a room
  const fetchParticipants = useCallback(async (roomId: string) => {
    if (!profile?.id) return;

    try {
      const { data: participantsData, error } = await supabase
        .from('study_room_participants')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;

      // Get profile info and pin counts for each participant
      const enrichedParticipants = await Promise.all(
        (participantsData || []).map(async (p) => {
          // Get profile
          const { data: profileData } = await supabase
            .from('public_profiles')
            .select('full_name, avatar_url, username')
            .eq('id', p.user_id)
            .single();

          // Get pin count
          const { count: pinCount } = await supabase
            .from('study_room_pins')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', roomId)
            .eq('pinned_user_id', p.user_id);

          // Check if current user has pinned this user
          const { data: myPin } = await supabase
            .from('study_room_pins')
            .select('id')
            .eq('room_id', roomId)
            .eq('pinner_id', profile.id)
            .eq('pinned_user_id', p.user_id)
            .single();

          return {
            ...p,
            profile: profileData,
            pin_count: pinCount || 0,
            is_pinned_by_me: !!myPin,
          };
        })
      );

      setParticipants(enrichedParticipants as RoomParticipant[]);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, [profile?.id]);

  // Close room (host only)
  const closeRoom = async (roomId: string) => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from('study_rooms')
        .update({ is_active: false })
        .eq('id', roomId)
        .eq('host_id', profile.id);

      if (error) throw error;

      toast({ title: 'Room Closed', description: 'The study room has been closed' });
      await fetchRooms();
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Real-time subscription for participants
  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase
      .channel(`room-${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_room_participants',
          filter: `room_id=eq.${currentRoom.id}`,
        },
        () => {
          fetchParticipants(currentRoom.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRoom, fetchParticipants]);

  return {
    rooms,
    loading,
    currentRoom,
    setCurrentRoom,
    participants,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMic,
    updateStudyTitle,
    pinUser,
    unpinUser,
    fetchParticipants,
    closeRoom,
  };
};
