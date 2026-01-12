import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Conversation } from '@/components/messaging/ConversationList';
import { Message } from '@/components/messaging/ChatWindow';
import { GroupMember, GroupChannel } from '@/components/messaging/GroupInfoSheet';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

export const useMessaging = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupChannels, setGroupChannels] = useState<GroupChannel[]>([]);

  // Fetch all conversations (DMs and Groups)
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch DM conversations
      const { data: dmData, error: dmError } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (dmError) throw dmError;

      // Get unique conversation partners (use a map to avoid duplicates)
      const dmConversationsMap = new Map<string, any>();
      
      dmData?.forEach(dm => {
        const partnerId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
        // Only set if not already present (keep the most recent message which comes first)
        if (!dmConversationsMap.has(partnerId)) {
          dmConversationsMap.set(partnerId, dm);
        }
      });

      const partnerIds = Array.from(dmConversationsMap.keys());
      
      // Fetch partner profiles
      let dmConversations: Conversation[] = [];
      
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, username, avatar_url')
          .in('user_id', partnerIds);

        dmConversations = partnerIds.map(partnerId => {
          const profile = profiles?.find(p => p.user_id === partnerId);
          const lastDm = dmConversationsMap.get(partnerId);
          
          // Count unread messages
          const unreadCount = dmData?.filter(
            dm => dm.sender_id === partnerId && !dm.is_read
          ).length || 0;

          return {
            id: `dm_${partnerId}`,
            type: 'dm' as const,
            name: profile?.full_name || 'Unknown User',
            avatar: profile?.avatar_url,
            lastMessage: lastDm?.content?.substring(0, 50) || '',
            lastMessageTime: formatTime(lastDm?.created_at),
            unreadCount,
            isOnline: false, // Presence handled separately
          };
        });
      }

      // Fetch group conversations
      const { data: groupMemberships, error: groupError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups:group_id (
            id,
            name,
            username,
            avatar_url,
            member_count,
            description
          )
        `)
        .eq('user_id', user.id);

      if (groupError) throw groupError;

      const groupConversations: Conversation[] = (groupMemberships || []).map(membership => ({
        id: `group_${membership.groups?.id}`,
        type: 'group' as const,
        name: membership.groups?.name || 'Unknown Group',
        avatar: membership.groups?.avatar_url,
        lastMessage: '', // Would need to fetch last message from channels
        lastMessageTime: '',
        members: membership.groups?.member_count || 0,
      }));

      setConversations([...dmConversations, ...groupConversations]);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const [type, id] = conversationId.split('_');

      if (type === 'dm') {
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Fetch sender profiles
        const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, avatar_url')
          .in('user_id', senderIds);

        const formattedMessages: Message[] = (data || []).map(msg => {
          const profile = profiles?.find(p => p.user_id === msg.sender_id);
          return {
            id: msg.id,
            content: msg.content,
            sender: {
              id: msg.sender_id,
              name: profile?.full_name || 'Unknown',
              avatar: profile?.avatar_url,
            },
            timestamp: formatTime(msg.created_at),
            isRead: msg.is_read,
          };
        });

        setMessages(formattedMessages);

        // Mark messages as read
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', id);
      } else if (type === 'group') {
        // Fetch group messages from default channel
        const { data: channels } = await supabase
          .from('group_channels')
          .select('id')
          .eq('group_id', id)
          .eq('is_default', true)
          .single();

        if (channels) {
          const { data, error } = await supabase
            .from('group_messages')
            .select('*')
            .eq('channel_id', channels.id)
            .order('created_at', { ascending: true });

          if (error) throw error;

          const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, avatar_url')
            .in('user_id', senderIds);

          const formattedMessages: Message[] = (data || []).map(msg => {
            const profile = profiles?.find(p => p.user_id === msg.sender_id);
            return {
              id: msg.id,
              content: msg.content,
              sender: {
                id: msg.sender_id,
                name: profile?.full_name || 'Unknown',
                avatar: profile?.avatar_url,
              },
              timestamp: formatTime(msg.created_at),
            };
          });

          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !currentConversation) return;

    try {
      const [type, id] = currentConversation.id.split('_');

      if (type === 'dm') {
        const { error } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            receiver_id: id,
            content,
          });

        if (error) throw error;
      } else if (type === 'group') {
        // Get default channel
        const { data: channel } = await supabase
          .from('group_channels')
          .select('id')
          .eq('group_id', id)
          .eq('is_default', true)
          .single();

        if (channel) {
          const { error } = await supabase
            .from('group_messages')
            .insert({
              channel_id: channel.id,
              sender_id: user.id,
              content,
            });

          if (error) throw error;
        }
      }

      // Refresh messages
      await fetchMessages(currentConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [user, currentConversation, fetchMessages]);

  // Create a new group
  const createGroup = useCallback(async (data: {
    name: string;
    username: string;
    description: string;
    isPublic: boolean;
  }) => {
    if (!user) return;

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          username: data.username,
          description: data.description,
          is_public: data.isPublic,
          owner_id: user.id,
          invite_link: `https://liqlearns.com/join/${data.username}`,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add owner as member
      await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
        });

      // Create default channel
      await supabase
        .from('group_channels')
        .insert({
          group_id: group.id,
          name: 'general',
          channel_type: 'text',
          is_default: true,
          description: 'General discussion',
        });

      toast.success('Group created!', { description: `@${data.username} is now live` });
      await fetchConversations();
    } catch (error: any) {
      console.error('Error creating group:', error);
      if (error.code === '23505') {
        toast.error('Username already taken', { description: 'Please choose a different username' });
      } else {
        toast.error('Failed to create group');
      }
    }
  }, [user, fetchConversations]);

  // Start a new DM
  const startDM = useCallback(async (userId: string) => {
    if (!user) return;

    // Check if conversation already exists
    const existingConv = conversations.find(
      c => c.type === 'dm' && c.id === `dm_${userId}`
    );

    if (existingConv) {
      setCurrentConversation(existingConv);
      return;
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', userId)
      .single();

    const newConv: Conversation = {
      id: `dm_${userId}`,
      type: 'dm',
      name: profile?.full_name || 'Unknown User',
      avatar: profile?.avatar_url,
      isOnline: false,
    };

    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(newConv);
  }, [user, conversations]);

  // Fetch group details
  const fetchGroupDetails = useCallback(async (groupId: string) => {
    try {
      // Fetch members
      const { data: members } = await supabase
        .from('group_members')
        .select(`
          user_id,
          role,
          admin_title
        `)
        .eq('group_id', groupId);

      if (members) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const formattedMembers: GroupMember[] = members.map(m => {
          const profile = profiles?.find(p => p.user_id === m.user_id);
          return {
            id: m.user_id,
            name: profile?.full_name || 'Unknown',
            avatar: profile?.avatar_url,
            role: m.role as 'owner' | 'admin' | 'member',
            adminTitle: m.admin_title,
          };
        });

        setGroupMembers(formattedMembers);
      }

      // Fetch channels
      const { data: channels } = await supabase
        .from('group_channels')
        .select('*')
        .eq('group_id', groupId)
        .order('order_index', { ascending: true });

      if (channels) {
        const formattedChannels: GroupChannel[] = channels.map(c => ({
          id: c.id,
          name: c.name,
          type: c.channel_type as 'text' | 'announcement' | 'voice',
          description: c.description || undefined,
          isDefault: c.is_default || false,
        }));

        setGroupChannels(formattedChannels);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  }, []);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messaging-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // Refresh conversations without causing infinite loop
          fetchConversations();
          
          // If viewing this conversation, refresh messages
          if (currentConversation?.id === `dm_${payload.new.sender_id}`) {
            fetchMessages(currentConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Remove fetchConversations and fetchMessages from dependencies

  // Initial fetch - only run once when user changes
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user?.id]); // Only depend on user.id, not the whole user object or fetchConversations

  return {
    conversations,
    messages,
    loading,
    currentConversation,
    setCurrentConversation,
    groupMembers,
    groupChannels,
    fetchMessages,
    sendMessage,
    createGroup,
    startDM,
    fetchGroupDetails,
    fetchConversations,
  };
};

// Helper function to format time
function formatTime(dateString?: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export default useMessaging;
