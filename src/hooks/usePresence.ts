import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  online_at: string;
}

interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
  conversationId: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export const usePresence = (channelName: string = 'online-users') => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(new Map());
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);

  // Fetch user's profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setMyProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user || !myProfile) return;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Map<string, PresenceUser>();
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0] as any;
          if (presence && key !== user.id) {
            users.set(key, {
              id: key,
              name: presence.name,
              avatar: presence.avatar,
              online_at: presence.online_at,
            });
          }
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id && newPresences[0]) {
          const presence = newPresences[0] as any;
          setOnlineUsers(prev => {
            const updated = new Map(prev);
            updated.set(key, {
              id: key,
              name: presence.name,
              avatar: presence.avatar,
              online_at: presence.online_at,
            });
            return updated;
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.delete(key);
          return updated;
        });
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, userName, userAvatar, conversationId, isTyping } = payload.payload;
        
        if (userId === user.id) return;
        
        setTypingUsers(prev => {
          if (isTyping) {
            const exists = prev.find(u => u.id === userId && u.conversationId === conversationId);
            if (!exists) {
              return [...prev, { id: userId, name: userName, avatar: userAvatar, conversationId }];
            }
            return prev;
          } else {
            return prev.filter(u => !(u.id === userId && u.conversationId === conversationId));
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: myProfile.full_name,
            avatar: myProfile.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, myProfile, channelName]);

  const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!user || !myProfile) return;

    const channel = supabase.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        userName: myProfile.full_name,
        userAvatar: myProfile.avatar_url,
        conversationId,
        isTyping,
      },
    });
  }, [user, myProfile, channelName]);

  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  const getTypingUsersForConversation = useCallback((conversationId: string): TypingUser[] => {
    return typingUsers.filter(u => u.conversationId === conversationId);
  }, [typingUsers]);

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    typingUsers,
    isUserOnline,
    getTypingUsersForConversation,
    sendTypingIndicator,
  };
};

export default usePresence;
