import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Conversation } from '@/components/messaging/ConversationList';
import { Message } from '@/components/messaging/ChatWindow';
import { GroupMember, GroupChannel } from '@/components/messaging/GroupInfoSheet';

// Current channel state
interface ChannelState {
  channelId: string | null;
  channelName: string;
  channelType: 'text' | 'announcement' | 'voice';
}

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

// Send message options for files/voice
interface SendMessageOptions {
  type?: 'text' | 'voice' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  durationSeconds?: number;
  replyToId?: string;
  mediaOptions?: {
    viewOnce?: boolean;
    saveInChat?: boolean;
    repeat?: boolean;
    blur?: boolean;
  };
}

export const useMessaging = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupChannels, setGroupChannels] = useState<GroupChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<ChannelState>({
    channelId: null,
    channelName: 'general',
    channelType: 'text',
  });

  // Keep messagesRef in sync for stale closure avoidance
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const formatTimeHelper = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Refetch conversations (used by external callers)
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data: dmData } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      const dmConversationsMap = new Map<string, any>();
      (dmData || []).forEach(dm => {
        const partnerId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
        if (!dmConversationsMap.has(partnerId)) {
          dmConversationsMap.set(partnerId, dm);
        }
      });

      const partnerIds = Array.from(dmConversationsMap.keys());
      let dmConversations: Conversation[] = [];
      
      if (partnerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, username, avatar_url')
          .in('user_id', partnerIds);

        dmConversations = partnerIds.map(partnerId => {
          const partnerProfile = profilesData?.find(p => p.user_id === partnerId);
          const lastDm = dmConversationsMap.get(partnerId);
          const unreadCount = (dmData || []).filter(dm => dm.sender_id === partnerId && !dm.is_read).length || 0;

          return {
            id: `dm_${partnerId}`,
            type: 'dm' as const,
            name: partnerProfile?.full_name || 'Unknown User',
            avatar: partnerProfile?.avatar_url,
            lastMessage: lastDm?.content?.substring(0, 50) || '',
            lastMessageTime: formatTimeHelper(lastDm?.created_at),
            unreadCount,
            isOnline: false,
            lastMessageIsMine: lastDm?.sender_id === user.id,
          };
        });
      }

      let groupConversations: Conversation[] = [];
      if (profile?.id) {
        const { data: groupData } = await supabase
          .from('group_members')
          .select(`group_id, groups:group_id (id, name, username, avatar_url, description)`)
          .eq('user_id', profile.id);

        // For each group, get the actual member count
        const groupsWithCounts = await Promise.all(
          (groupData || []).map(async (membership: any) => {
            const groupId = membership.groups?.id;
            if (!groupId) return null;
            
            // Get actual member count
            const { count } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', groupId);
            
            return {
              id: `group_${groupId}`,
              type: 'group' as const,
              name: membership.groups?.name || 'Unknown Group',
              avatar: membership.groups?.avatar_url,
              lastMessage: '',
              lastMessageTime: '',
              members: count || 0,
            };
          })
        );

        groupConversations = groupsWithCounts.filter(Boolean) as Conversation[];
      }

      setConversations([...dmConversations, ...groupConversations]);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.id]);

  // Fetch messages for a conversation (including call logs)
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) {
      console.log('fetchMessages: no user yet');
      return;
    }

    // For DMs we only need user.id, for groups we need profile
    const [type, id] = conversationId.split('_');
    
    if (type === 'group' && !profile) {
      console.log('fetchMessages: waiting for profile for group messages');
      return;
    }

    setMessagesLoading(true);
    
    try {
      if (type === 'dm') {
        // Fetch regular DM messages including reply_to_id
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*, reply_to_id')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Fetch sender profiles
        const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, avatar_url')
          .in('user_id', senderIds);

        // Get partner's profile.id for call logs (id is user_id, call_logs uses profile.id)
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', id)
          .single();

        // Fetch call logs for this conversation using profile.id
        let callLogs: any[] = [];
        if (partnerProfile) {
          const { data: logs } = await supabase
            .from('call_logs')
            .select('*')
            .or(`and(caller_id.eq.${profile.id},receiver_id.eq.${partnerProfile.id}),and(caller_id.eq.${partnerProfile.id},receiver_id.eq.${profile.id})`)
            .order('started_at', { ascending: true });
          callLogs = logs || [];
        }

        // Format regular messages - include reply data
        const formattedMessages: Message[] = (data || []).map(msg => {
          const msgProfile = profiles?.find(p => p.user_id === msg.sender_id);
          const msgType = msg.message_type || 'text';
          const mediaOpts = msg.media_options as Message['mediaOptions'];
          
          // Look up reply_to data if present
          let replyTo: Message['replyTo'] = undefined;
          if (msg.reply_to_id) {
            const replyMsg = data?.find(m => m.id === msg.reply_to_id);
            if (replyMsg) {
              const replyProfile = profiles?.find(p => p.user_id === replyMsg.sender_id);
              replyTo = {
                content: replyMsg.content,
                senderName: replyProfile?.full_name || 'Unknown',
                messageId: replyMsg.id,
              };
            }
          }
          
          return {
            id: msg.id,
            content: msg.content,
            sender: {
              id: msg.sender_id,
              name: msgProfile?.full_name || 'Unknown',
              avatar: msgProfile?.avatar_url,
            },
            timestamp: msg.created_at,
            isRead: msg.is_read,
            type: msgType === 'text' ? 'message' : msgType as Message['type'],
            fileUrl: msg.file_url,
            fileName: msg.file_name,
            fileSize: msg.file_size,
            durationSeconds: msg.duration_seconds,
            mediaOptions: mediaOpts,
            replyTo,
          };
        });

        // Format call logs as messages
        const callMessages: Message[] = (callLogs || []).map(call => {
          const isCaller = call.caller_id === profile.id;
          return {
            id: `call_${call.id}`,
            content: '',
            sender: {
              id: call.caller_id,
              name: isCaller ? 'You' : 'Partner',
            },
            timestamp: call.started_at,
            type: 'call' as const,
            callType: call.call_type as 'voice' | 'video',
            callStatus: call.status as 'missed' | 'answered' | 'ended',
            callDuration: call.duration_seconds || 0,
          };
        });

        // Merge and sort by timestamp
        const allMessages = [...formattedMessages, ...callMessages].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setMessages(allMessages);

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
            .select('*, reply_to:reply_to_id(id, content, sender_id)')
            .eq('channel_id', channels.id)
            .order('created_at', { ascending: true });

          if (error) throw error;

          // Group messages use profile.id as sender_id, so lookup by id not user_id
          const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, avatar_url, nickname')
            .in('id', senderIds);

          const formattedMessages: Message[] = (data || []).map(msg => {
            const msgProfile = profiles?.find(p => p.id === msg.sender_id);
            const msgType = msg.message_type || 'text';
            const mediaOpts = msg.media_options as Message['mediaOptions'];
            
            // Handle reply info
            let replyTo: Message['replyTo'] = undefined;
            if (msg.reply_to && typeof msg.reply_to === 'object') {
              const replyData = msg.reply_to as { id: string; content: string; sender_id: string };
              const replyProfile = profiles?.find(p => p.id === replyData.sender_id);
              replyTo = {
                content: replyData.content,
                senderName: (replyProfile as any)?.nickname || (replyProfile?.full_name?.split(' ')[0]) || 'Unknown',
                messageId: replyData.id,
              };
            }
            
            return {
              id: msg.id,
              content: msg.content,
              sender: {
                id: msg.sender_id,
                name: (msgProfile as any)?.nickname || (msgProfile?.full_name?.split(' ')[0]) || 'Unknown',
                avatar: msgProfile?.avatar_url,
              },
              timestamp: msg.created_at,
              type: msgType === 'text' ? 'message' : msgType as Message['type'],
              fileUrl: msg.file_url,
              fileName: msg.file_name,
              fileSize: msg.file_size,
              durationSeconds: msg.duration_seconds,
              replyTo,
              mediaOptions: mediaOpts,
            };
          });

          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, [user, profile]);

  // Send a message (with support for files/voice)
  const sendMessage = useCallback(async (content: string, options?: SendMessageOptions) => {
    if (!user || !profile || !currentConversation) {
      console.error('Cannot send message: missing requirements', { user: !!user, profile: !!profile, conv: !!currentConversation });
      toast.error('Unable to send message');
      return;
    }

    try {
      const [type, id] = currentConversation.id.split('_');
      const messageType = options?.type || 'text';
      
      console.log('Sending message:', { type, id, messageType, content: content.substring(0, 20) });

      if (type === 'dm') {
        // Get replyTo content for optimistic UI
        let replyToData: Message['replyTo'] = undefined;
        if (options?.replyToId) {
          const replyMsg = messagesRef.current.find(m => m.id === options.replyToId);
          if (replyMsg) {
            replyToData = {
              content: replyMsg.content,
              senderName: replyMsg.sender.name,
            };
          }
        }

        const { data, error } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            receiver_id: id,
            content,
            message_type: messageType,
            file_url: options?.fileUrl,
            file_name: options?.fileName,
            file_size: options?.fileSize,
            duration_seconds: options?.durationSeconds,
            media_options: options?.mediaOptions || {},
            reply_to_id: options?.replyToId,
          })
          .select()
          .single();

        if (error) {
          console.error('DM insert error:', error);
          throw error;
        }
        
        console.log('DM sent successfully:', data?.id);
        
        // Optimistically add message to UI
        const newMessage: Message = {
          id: data.id,
          content: data.content,
          sender: {
            id: user.id,
            name: 'You',
          },
          timestamp: new Date().toISOString(),
          isRead: false,
          type: messageType === 'text' ? 'message' : messageType as Message['type'],
          fileUrl: options?.fileUrl,
          fileName: options?.fileName,
          fileSize: options?.fileSize,
          durationSeconds: options?.durationSeconds,
          mediaOptions: options?.mediaOptions,
          replyTo: replyToData,
        };
        setMessages(prev => [...prev, newMessage]);
        
      } else if (type === 'group') {
        // Get default channel or current channel
        const channelId = currentChannel.channelId;
        let targetChannelId = channelId;
        
        if (!targetChannelId) {
          const { data: channel, error: channelError } = await supabase
            .from('group_channels')
            .select('id')
            .eq('group_id', id)
            .eq('is_default', true)
            .single();

          if (channelError) {
            console.error('Channel fetch error:', channelError);
            throw new Error('Could not find group channel');
          }
          targetChannelId = channel?.id;
        }

        if (targetChannelId) {
          // Get replyTo content for optimistic UI
          let replyToData: Message['replyTo'] = undefined;
          if (options?.replyToId) {
            const replyMsg = messagesRef.current.find(m => m.id === options.replyToId);
            if (replyMsg) {
              replyToData = {
                content: replyMsg.content,
                senderName: replyMsg.sender.name,
              };
            }
          }

          // Use profile.id for group messages (RLS requires it)
          const { data, error } = await supabase
            .from('group_messages')
            .insert({
              channel_id: targetChannelId,
              sender_id: profile.id,
              content,
              message_type: messageType,
              file_url: options?.fileUrl,
              file_name: options?.fileName,
              file_size: options?.fileSize,
              duration_seconds: options?.durationSeconds,
              reply_to_id: options?.replyToId,
              media_options: options?.mediaOptions || {},
            })
            .select()
            .single();

          if (error) {
            console.error('Group message insert error:', error);
            throw error;
          }
          
          console.log('Group message sent:', data?.id);
          
          // Optimistically add message to UI
          const newMessage: Message = {
            id: data.id,
            content: data.content,
            sender: {
              id: profile.id,
              name: 'You',
            },
            timestamp: new Date().toISOString(),
            type: messageType === 'text' ? 'message' : messageType as Message['type'],
            fileUrl: options?.fileUrl,
            fileName: options?.fileName,
            fileSize: options?.fileSize,
            durationSeconds: options?.durationSeconds,
            replyTo: replyToData,
            mediaOptions: options?.mediaOptions,
          };
          setMessages(prev => [...prev, newMessage]);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error?.message || 'Failed to send message';
      toast.error(errorMessage);
    }
  }, [user, profile, currentConversation, currentChannel.channelId]);

  // Create a new group
  const createGroup = useCallback(async (data: {
    name: string;
    username: string;
    description: string;
    isPublic: boolean;
    avatarUrl?: string;
    clanId?: string;
  }) => {
    if (!user || !profile) {
      toast.error('Please sign in to create a group');
      return;
    }

    try {
      // Create the group with profile.id as owner
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          username: data.username,
          description: data.description,
          is_public: data.isPublic,
          owner_id: profile.id,
          invite_link: `https://liqlearns.com/join/${data.username}`,
          avatar_url: data.avatarUrl || null,
          clan_id: data.clanId || null,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add owner as member with profile.id
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: profile.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('Error adding owner as member:', memberError);
      }

      // Create default channel
      const { error: channelError } = await supabase
        .from('group_channels')
        .insert({
          group_id: group.id,
          name: 'general',
          channel_type: 'text',
          is_default: true,
          description: 'General discussion',
        });

      if (channelError) {
        console.error('Error creating default channel:', channelError);
      }

      toast.success('Group created!', { description: `@${data.username} is now live` });
      await fetchConversations();
    } catch (error: any) {
      console.error('Error creating group:', error);
      if (error.code === '23505') {
        toast.error('Username already taken', { description: 'Please choose a different username' });
      } else {
        toast.error('Failed to create group', { description: error.message });
      }
    }
  }, [user, profile, fetchConversations]);

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

    // Fetch user profile - MUST include profile.id for call signaling
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('user_id', userId)
      .single();

    const newConv: Conversation = {
      id: `dm_${userId}`,
      type: 'dm',
      name: partnerProfile?.full_name || 'Unknown User',
      avatar: partnerProfile?.avatar_url,
      isOnline: false,
      // CRITICAL: Include the profile.id for call signaling (not the auth user_id)
      partnerProfileId: partnerProfile?.id,
    };

    console.log('Created new DM conversation with partnerProfileId:', partnerProfile?.id);

    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(newConv);
  }, [user, conversations]);

  // Fetch group details
  const fetchGroupDetails = useCallback(async (groupId: string) => {
    try {
      // Fetch members - user_id in group_members is actually profile.id
      const { data: members } = await supabase
        .from('group_members')
        .select(`
          user_id,
          role,
          admin_title
        `)
        .eq('group_id', groupId);

      if (members) {
        // user_id is profile.id, so we need to fetch profiles by id, not user_id
        const profileIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, avatar_url')
          .in('id', profileIds);

        const formattedMembers: GroupMember[] = members.map(m => {
          const memberProfile = profiles?.find(p => p.id === m.user_id);
          return {
            id: m.user_id, // This is profile.id
            name: memberProfile?.full_name || 'Unknown',
            avatar: memberProfile?.avatar_url,
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

  // Switch to a specific channel and fetch its messages
  const switchChannel = useCallback(async (channel: GroupChannel, groupId: string) => {
    setCurrentChannel({
      channelId: channel.id,
      channelName: channel.name,
      channelType: channel.type,
    });

    // Update channel as default for UI display
    setGroupChannels(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === channel.id,
    })));

    // For voice channels, don't fetch messages - they'll open the Club Room
    if (channel.type === 'voice') {
      return;
    }

    // Fetch messages for this channel
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url')
        .in('id', senderIds);

      const formattedMessages: Message[] = (data || []).map(msg => {
        const senderProfile = profiles?.find(p => p.id === msg.sender_id);
        const msgType = msg.message_type || 'text';
        const mediaOpts = msg.media_options as Message['mediaOptions'];
        
        return {
          id: msg.id,
          content: msg.content,
          sender: {
            id: msg.sender_id,
            name: senderProfile?.full_name || 'Unknown',
            avatar: senderProfile?.avatar_url,
          },
          timestamp: msg.created_at,
          type: msgType === 'text' ? 'message' : msgType as Message['type'],
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          fileSize: msg.file_size,
          durationSeconds: msg.duration_seconds,
          mediaOptions: mediaOpts,
        };
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching channel messages:', error);
    }
  }, []);

  // Real-time subscription for new messages (DMs)
  useEffect(() => {
    if (!user) return;

    const dmChannel = supabase
      .channel('dm-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New DM received:', payload);
          
          // If viewing this conversation, add message directly to UI
          if (currentConversation?.id === `dm_${payload.new.sender_id}`) {
            // Fetch sender profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', payload.new.sender_id)
              .single();

            // Fetch reply_to data if present
            let replyToData: Message['replyTo'] = undefined;
            if (payload.new.reply_to_id) {
              const { data: replyMsg } = await supabase
                .from('direct_messages')
                .select('content, sender_id')
                .eq('id', payload.new.reply_to_id)
                .single();
              
              if (replyMsg) {
                const { data: replyProfile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('user_id', replyMsg.sender_id)
                  .single();
                
                replyToData = {
                  content: replyMsg.content,
                  senderName: replyProfile?.full_name || 'Unknown',
                  messageId: payload.new.reply_to_id,
                };
              }
            }

            const msgType = payload.new.message_type || 'text';
            const mediaOpts = payload.new.media_options as Message['mediaOptions'];
            
            const newMessage: Message = {
              id: payload.new.id,
              content: payload.new.content,
              sender: {
                id: payload.new.sender_id,
                name: senderProfile?.full_name || 'Unknown',
                avatar: senderProfile?.avatar_url,
              },
              timestamp: payload.new.created_at,
              isRead: false,
              type: msgType === 'text' ? 'message' : msgType as Message['type'],
              fileUrl: payload.new.file_url,
              fileName: payload.new.file_name,
              fileSize: payload.new.file_size,
              durationSeconds: payload.new.duration_seconds,
              mediaOptions: mediaOpts,
              replyTo: replyToData,
            };
            
            setMessages(prev => {
              // Check if message already exists (avoid duplicates from optimistic update)
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, newMessage];
            });
          }
          
          // Refresh conversations to update last message
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
    };
  }, [user, currentConversation?.id]);

  // Real-time subscription for group messages
  useEffect(() => {
    if (!profile || !currentConversation?.type) return;
    if (currentConversation.type !== 'group') return;

    const groupId = currentConversation.id.replace('group_', '');
    const activeChannelId = currentChannel.channelId;
    
    // If no channel selected yet, don't subscribe
    if (!activeChannelId) return;
    
    console.log('Setting up group message subscription for channel:', activeChannelId);
    
    const groupChannel = supabase
      .channel(`group-messages-${groupId}-${activeChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `channel_id=eq.${activeChannelId}`,
        },
        async (payload) => {
          console.log('New group message:', payload);
          
          // Don't add our own messages (already added optimistically)
          if (payload.new.sender_id === profile.id) return;
          
          // Verify message is for current channel
          if (payload.new.channel_id !== activeChannelId) return;
          
          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, nickname')
            .eq('id', payload.new.sender_id)
            .single();

          // Fetch reply_to message if exists
          let replyToData: Message['replyTo'] = undefined;
          if (payload.new.reply_to_id) {
            const { data: replyMsg } = await supabase
              .from('group_messages')
              .select('content, sender_id')
              .eq('id', payload.new.reply_to_id)
              .single();
            
            if (replyMsg) {
              const { data: replyProfile } = await supabase
                .from('profiles')
                .select('full_name, nickname')
                .eq('id', replyMsg.sender_id)
                .single();
              
              replyToData = {
                content: replyMsg.content,
                senderName: (replyProfile as any)?.nickname || (replyProfile?.full_name?.split(' ')[0]) || 'Unknown',
                messageId: payload.new.reply_to_id,
              };
            }
          }

          const msgType = payload.new.message_type || 'text';
          const mediaOpts = payload.new.media_options as Message['mediaOptions'];
          
          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            sender: {
              id: payload.new.sender_id,
              name: (senderProfile as any)?.nickname || (senderProfile?.full_name?.split(' ')[0]) || 'Unknown',
              avatar: senderProfile?.avatar_url,
            },
            timestamp: payload.new.created_at,
            type: msgType === 'text' ? 'message' : msgType as Message['type'],
            fileUrl: payload.new.file_url,
            fileName: payload.new.file_name,
            fileSize: payload.new.file_size,
            durationSeconds: payload.new.duration_seconds,
            replyTo: replyToData,
            mediaOptions: mediaOpts,
          };
          
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupChannel);
    };
  }, [profile?.id, currentConversation?.id, currentConversation?.type, currentChannel.channelId]);

  // Fetch conversations when user/profile is ready
  useEffect(() => {
    const loadConversations = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Get the current profile at the time of execution (not stale closure value)
      const currentProfile = profile;
      
      console.log('Loading conversations for user:', user.id, 'profile:', currentProfile?.id);
      setLoading(true);

      try {
        // Fetch DMs using auth.uid() - matches RLS policy
        const { data: dmData, error: dmError } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (dmError) {
          console.error('Error fetching DMs:', dmError);
          throw dmError;
        }

        console.log('Got DMs:', dmData?.length || 0);

        // Get unique conversation partners
        const dmConversationsMap = new Map<string, any>();
        
        (dmData || []).forEach(dm => {
          const partnerId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
          if (!dmConversationsMap.has(partnerId)) {
            dmConversationsMap.set(partnerId, dm);
          }
        });

        const partnerIds = Array.from(dmConversationsMap.keys());
        
        // Fetch partner profiles
        let dmConversations: Conversation[] = [];
        
        if (partnerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, username, avatar_url')
            .in('user_id', partnerIds);

          dmConversations = partnerIds.map(partnerId => {
            const partnerProfile = profilesData?.find(p => p.user_id === partnerId);
            const lastDm = dmConversationsMap.get(partnerId);
            
            const unreadCount = (dmData || []).filter(
              dm => dm.sender_id === partnerId && !dm.is_read
            ).length || 0;

            return {
              id: `dm_${partnerId}`,
              type: 'dm' as const,
              name: partnerProfile?.full_name || 'Unknown User',
              avatar: partnerProfile?.avatar_url,
              lastMessage: lastDm?.content?.substring(0, 50) || '',
              lastMessageTime: formatTime(lastDm?.created_at),
              unreadCount,
              isOnline: false,
              lastMessageIsMine: lastDm?.sender_id === user.id,
              // CRITICAL: Include the profile.id for call signaling (not the auth user_id)
              partnerProfileId: partnerProfile?.id,
            };
          });
        }

        // Fetch groups if profile is ready
        let groupConversations: Conversation[] = [];
        
        if (currentProfile?.id) {
          console.log('Fetching groups for profile:', currentProfile.id);
          const { data: groupData, error: groupError } = await supabase
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
            .eq('user_id', currentProfile.id);

          if (groupError) {
            console.error('Error fetching groups:', groupError);
          } else {
            groupConversations = (groupData || []).map((membership: any) => ({
              id: `group_${membership.groups?.id}`,
              type: 'group' as const,
              name: membership.groups?.name || 'Unknown Group',
              avatar: membership.groups?.avatar_url,
              lastMessage: '',
              lastMessageTime: '',
              members: membership.groups?.member_count || 0,
            }));
            console.log('Got groups:', groupConversations.length);
          }
        } else {
          console.log('Profile not yet loaded, skipping groups');
        }

        const allConversations = [...dmConversations, ...groupConversations];
        console.log('Total conversations:', allConversations.length);
        setConversations(allConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user?.id, profile?.id]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setCurrentConversation(null);
      setLoading(true);
    }
  }, [user]);

  return {
    conversations,
    messages,
    loading,
    messagesLoading,
    currentConversation,
    setCurrentConversation,
    groupMembers,
    groupChannels,
    currentChannel,
    fetchMessages,
    sendMessage,
    createGroup,
    startDM,
    fetchGroupDetails,
    fetchConversations,
    switchChannel,
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
