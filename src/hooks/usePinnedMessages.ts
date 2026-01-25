import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Message } from '@/components/messaging/ChatWindow';

export interface PinnedMessage {
  id: string;
  message_id: string;
  channel_id?: string;
  conversation_id?: string;
  pinned_by: string;
  pinned_at: string;
  message?: Message;
}

export const usePinnedMessages = (channelId?: string | null, conversationId?: string | null) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch pinned messages for the channel or conversation
  const fetchPinnedMessages = useCallback(async () => {
    if (!channelId && !conversationId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('pinned_messages')
        .select('*')
        .order('pinned_at', { ascending: false });
      
      if (channelId) {
        query = query.eq('channel_id', channelId);
      } else if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setPinnedMessages(data || []);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    } finally {
      setLoading(false);
    }
  }, [channelId, conversationId]);

  // Pin a message
  const pinMessage = useCallback(async (messageId: string) => {
    if (!profile?.id) {
      toast.error('Please sign in to pin messages');
      return false;
    }
    
    try {
      const insertData: any = {
        message_id: messageId,
        pinned_by: profile.id,
      };
      
      if (channelId) {
        insertData.channel_id = channelId;
      } else if (conversationId) {
        insertData.conversation_id = conversationId;
      }
      
      const { error } = await supabase
        .from('pinned_messages')
        .insert(insertData);
      
      if (error) {
        if (error.code === '23505') {
          toast.error('Message is already pinned');
        } else {
          throw error;
        }
        return false;
      }
      
      toast.success('Message pinned');
      await fetchPinnedMessages();
      return true;
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error('Failed to pin message');
      return false;
    }
  }, [profile?.id, channelId, conversationId, fetchPinnedMessages]);

  // Unpin a message
  const unpinMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('message_id', messageId);
      
      if (error) throw error;
      
      toast.success('Message unpinned');
      await fetchPinnedMessages();
      return true;
    } catch (error) {
      console.error('Error unpinning message:', error);
      toast.error('Failed to unpin message');
      return false;
    }
  }, [fetchPinnedMessages]);

  // Check if a message is pinned
  const isMessagePinned = useCallback((messageId: string): boolean => {
    return pinnedMessages.some(pm => pm.message_id === messageId);
  }, [pinnedMessages]);

  // Fetch on mount and when channel/conversation changes
  useEffect(() => {
    fetchPinnedMessages();
  }, [fetchPinnedMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!channelId && !conversationId) return;
    
    const channel = supabase
      .channel('pinned_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pinned_messages',
        },
        () => {
          fetchPinnedMessages();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, conversationId, fetchPinnedMessages]);

  return {
    pinnedMessages,
    loading,
    pinMessage,
    unpinMessage,
    isMessagePinned,
    refetch: fetchPinnedMessages,
  };
};
