import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export interface StudyRoomPresenceUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  studyTitle?: string;
  isMicOn?: boolean;
  isVideoOn?: boolean;
  isHandRaised?: boolean;
  joinedAt: string;
  lastActiveAt: string;
}

export const useStudyRoomPresence = (roomId: string | null) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [presentUsers, setPresentUsers] = useState<Map<string, StudyRoomPresenceUser>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Track presence in the room
  useEffect(() => {
    if (!roomId || !user || !profile) {
      setPresentUsers(new Map());
      setIsConnected(false);
      return;
    }

    const channelName = `study-room-presence:${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Map<string, StudyRoomPresenceUser>();
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0] as any;
          if (presence) {
            users.set(key, {
              id: key,
              name: presence.name,
              username: presence.username,
              avatar: presence.avatar,
              studyTitle: presence.studyTitle,
              isMicOn: presence.isMicOn,
              isVideoOn: presence.isVideoOn,
              isHandRaised: presence.isHandRaised,
              joinedAt: presence.joinedAt,
              lastActiveAt: presence.lastActiveAt,
            });
          }
        });
        
        setPresentUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (newPresences[0]) {
          const presence = newPresences[0] as any;
          setPresentUsers(prev => {
            const updated = new Map(prev);
            updated.set(key, {
              id: key,
              name: presence.name,
              username: presence.username,
              avatar: presence.avatar,
              studyTitle: presence.studyTitle,
              isMicOn: presence.isMicOn,
              isVideoOn: presence.isVideoOn,
              isHandRaised: presence.isHandRaised,
              joinedAt: presence.joinedAt,
              lastActiveAt: presence.lastActiveAt,
            });
            return updated;
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setPresentUsers(prev => {
          const updated = new Map(prev);
          updated.delete(key);
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({
            name: profile.full_name,
            username: profile.username,
            avatar: profile.avatar_url,
            studyTitle: '',
            isMicOn: false,
            isVideoOn: false,
            isHandRaised: false,
            joinedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      setIsConnected(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, user, profile]);

  // Update my presence state
  const updateMyPresence = useCallback(async (updates: Partial<Omit<StudyRoomPresenceUser, 'id' | 'joinedAt'>>) => {
    if (!channelRef.current || !user || !profile) return;

    const currentPresence = presentUsers.get(user.id);
    
    await channelRef.current.track({
      name: profile.full_name,
      username: profile.username,
      avatar: profile.avatar_url,
      studyTitle: updates.studyTitle ?? currentPresence?.studyTitle ?? '',
      isMicOn: updates.isMicOn ?? currentPresence?.isMicOn ?? false,
      isVideoOn: updates.isVideoOn ?? currentPresence?.isVideoOn ?? false,
      isHandRaised: updates.isHandRaised ?? currentPresence?.isHandRaised ?? false,
      joinedAt: currentPresence?.joinedAt ?? new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
  }, [user, profile, presentUsers]);

  // Check if a specific user is present
  const isUserPresent = useCallback((userId: string): boolean => {
    return presentUsers.has(userId);
  }, [presentUsers]);

  // Get presence info for a user
  const getUserPresence = useCallback((userId: string): StudyRoomPresenceUser | undefined => {
    return presentUsers.get(userId);
  }, [presentUsers]);

  return {
    presentUsers: Array.from(presentUsers.values()),
    presentUserIds: Array.from(presentUsers.keys()),
    isConnected,
    isUserPresent,
    getUserPresence,
    updateMyPresence,
    onlineCount: presentUsers.size,
  };
};

export default useStudyRoomPresence;
