import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConversationList, { Conversation } from '@/components/messaging/ConversationList';
import ChatWindow, { Message } from '@/components/messaging/ChatWindow';
import CreateGroupModal from '@/components/messaging/CreateGroupModal';
import NewDMModal, { UserSearchResult } from '@/components/messaging/NewDMModal';
import GroupInfoSheet, { GroupMember, GroupChannel } from '@/components/messaging/GroupInfoSheet';
import FindGroupsModal from '@/components/messaging/FindGroupsModal';
import MessageRequestsModal from '@/components/messaging/MessageRequestsModal';
import CreateChannelModal from '@/components/messaging/CreateChannelModal';
import ManageMemberModal from '@/components/messaging/ManageMemberModal';
import AddMembersModal from '@/components/messaging/AddMembersModal';
import ClubRoomView from '@/components/messaging/ClubRoomView';
import ForwardMessageModal from '@/components/messaging/ForwardMessageModal';
import useMessaging from '@/hooks/useMessaging';
import usePresence from '@/hooks/usePresence';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { Bookmark } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const {
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
  } = useMessaging();

  // Online presence tracking
  const { isUserOnline, onlineUsers } = usePresence('messaging-presence');

  const [filter, setFilter] = useState<'all' | 'dms' | 'groups'>('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showFindGroups, setShowFindGroups] = useState(false);
  const [showMessageRequests, setShowMessageRequests] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showManageMember, setShowManageMember] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showClubRoom, setShowClubRoom] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [forwardContent, setForwardContent] = useState('');
  const [localMessages, setLocalMessages] = useState(messages);
  const [searchParams, setSearchParams] = useSearchParams();
  const dmAutoOpenHandled = useRef(false);

  // Sync local messages with hook messages
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Auto-open DM from URL param (e.g. /messages?dm=userId from live chat)
  useEffect(() => {
    if (dmAutoOpenHandled.current || loading) return;
    const dmUserId = searchParams.get('dm');
    if (dmUserId && user) {
      dmAutoOpenHandled.current = true;
      // Clear the param from URL
      setSearchParams({}, { replace: true });
      // Check if conversation already exists
      const existing = conversations.find(c => c.id === `dm_${dmUserId}`);
      if (existing) {
        handleSelectConversation(existing);
      } else {
        startDM(dmUserId);
        if (isMobile) setShowChat(true);
      }
    }
  }, [searchParams, user, loading, conversations]);

  // Auto-open forward modal from URL param (e.g. /messages?share=... from course learning)
  const shareAutoOpenHandled = useRef(false);
  useEffect(() => {
    if (shareAutoOpenHandled.current || loading) return;
    const shareContent = searchParams.get('share');
    if (shareContent && user) {
      shareAutoOpenHandled.current = true;
      setSearchParams({}, { replace: true });
      setForwardContent(decodeURIComponent(shareContent));
      setShowForward(true);
    }
  }, [searchParams, user, loading]);

  // Saved Messages conversation entry
  const savedConv: Conversation = {
    id: 'saved',
    type: 'dm',
    name: 'Saved Messages',
    lastMessage: '',
    lastMessageTime: '',
  };

  // Update conversations with online status + prepend Saved Messages
  const conversationsWithOnlineStatus = [savedConv, ...conversations.map(conv => {
    if (conv.type === 'dm') {
      const partnerId = conv.id.replace('dm_', '');
      return { ...conv, isOnline: isUserOnline(partnerId) };
    }
    return conv;
  })];

  // Fetch saved messages when "Saved Messages" is selected
  const fetchSavedMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const msgs: Message[] = (data || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      sender: {
        id: user.id,
        name: m.original_sender_name || 'Saved',
      },
      timestamp: m.created_at,
      type: m.message_type === 'text' ? 'message' : m.message_type,
      fileUrl: m.file_url,
      fileName: m.file_name,
      fileSize: m.file_size,
      durationSeconds: m.duration_seconds,
    }));
    setLocalMessages(msgs);
  };

  // Handle delete message - persist to DB
  const handleDeleteMessage = async (messageId: string) => {
    setLocalMessages(prev => prev.filter(m => m.id !== messageId));
    
    if (currentConversation) {
      if (currentConversation.id === 'saved') {
        await supabase.from('saved_messages').delete().eq('id', messageId);
      } else {
        const [type] = currentConversation.id.split('_');
        if (type === 'dm') {
          await supabase.from('direct_messages').delete().eq('id', messageId);
        } else if (type === 'group') {
          await supabase.from('group_messages').delete().eq('id', messageId);
        }
      }
    }
    toast.success('Message deleted');
  };

  // Handle forward message
  const handleForwardMessage = (content: string) => {
    setForwardContent(content);
    setShowForward(true);
  };

  // Handle save message
  const handleSaveMessage = async (msg: Message) => {
    if (!user) return;
    const { error } = await supabase.from('saved_messages').insert({
      user_id: user.id,
      content: msg.content,
      original_sender_name: msg.sender.name,
      original_timestamp: msg.timestamp,
      message_type: msg.type === 'message' ? 'text' : (msg.type || 'text'),
      file_url: msg.fileUrl,
      file_name: msg.fileName,
      file_size: msg.fileSize,
      duration_seconds: msg.durationSeconds,
    });
    if (error) {
      toast.error('Failed to save message');
    } else {
      toast.success('Message saved');
    }
  };

  // Handle forward to conversation (including "saved")
  const handleForwardToConversation = async (conversationId: string, content: string) => {
    if (conversationId === 'saved') {
      if (!user) return;
      await supabase.from('saved_messages').insert({
        user_id: user.id,
        content,
        original_sender_name: 'Forwarded',
        message_type: 'text',
      });
      toast.success('Saved to Saved Messages');
      return;
    }
    const underscoreIdx = conversationId.indexOf('_');
    const type = conversationId.substring(0, underscoreIdx);
    const id = conversationId.substring(underscoreIdx + 1);
    try {
      if (type === 'dm') {
        const { error } = await supabase.from('direct_messages').insert({
          sender_id: user!.id,
          receiver_id: id,
          content,
          message_type: 'text',
        });
        if (error) throw error;
      } else if (type === 'group' && profile) {
        const { data: channel } = await supabase
          .from('group_channels')
          .select('id')
          .eq('group_id', id)
          .eq('is_default', true)
          .maybeSingle();
        
        if (channel) {
          const { error } = await supabase.from('group_messages').insert({
            channel_id: channel.id,
            sender_id: profile.id,
            content,
            message_type: 'text',
          });
          if (error) throw error;
        }
      }
    } catch (err) {
      console.error('Forward error:', err);
      throw err; // re-throw so ForwardMessageModal shows error toast
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    
    if (conversation.id === 'saved') {
      await fetchSavedMessages();
    } else {
      await fetchMessages(conversation.id);
      
      if (conversation.type === 'group') {
        const groupId = conversation.id.replace('group_', '');
        await fetchGroupDetails(groupId);
      }
    }
    
    if (isMobile) {
      setShowChat(true);
    }
  };

  // Search for users
  const handleSearchUsers = async (query: string) => {
    if (!query.trim() || !user) {
      setSearchUsers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('user_id', user.id)
        .limit(20);

      // Check friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = new Set<string>();
      friendships?.forEach(f => {
        if (f.requester_id === user.id) friendIds.add(f.addressee_id);
        else friendIds.add(f.requester_id);
      });

      const results: UserSearchResult[] = (profiles || []).map(p => ({
        id: p.user_id,
        name: p.full_name,
        username: p.username,
        avatar: p.avatar_url,
        isFriend: friendIds.has(p.user_id),
      }));

      setSearchUsers(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle selecting a user for DM
  const handleSelectUserForDM = (selectedUser: UserSearchResult) => {
    startDM(selectedUser.id);
    if (isMobile) {
      setShowChat(true);
    }
  };

  // Get current user's role in a group (using profile.id)
  const getCurrentUserRole = (): 'owner' | 'admin' | 'member' => {
    if (!profile || currentConversation?.type !== 'group') return 'member';
    const member = groupMembers.find(m => m.id === profile.id);
    return member?.role || 'member';
  };

  // Get group info from current conversation
  const getGroupInfo = () => {
    if (!currentConversation || currentConversation.type !== 'group') return null;
    return {
      id: currentConversation.id.replace('group_', ''),
      name: currentConversation.name,
      username: currentConversation.name.toLowerCase().replace(/\s+/g, '_'),
      avatar: currentConversation.avatar,
      memberCount: currentConversation.members,
    };
  };

  return (
    <DashboardLayout>
      <motion.div
        className="h-[calc(100dvh-7rem)] md:h-[calc(100vh-5.5rem)] flex overflow-hidden rounded-xl border border-border bg-card -m-4 md:-m-6 -mb-20 md:mb-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Conversation List - Hidden on mobile when viewing chat */}
        {(!isMobile || !showChat) && (
          <div className={`${isMobile ? 'w-full' : 'w-80 shrink-0'}`}>
            <ConversationList
              conversations={conversationsWithOnlineStatus}
              selectedId={currentConversation?.id}
              onSelect={handleSelectConversation}
              onCreateGroup={() => setShowCreateGroup(true)}
              onNewDM={() => setShowNewDM(true)}
              onFindGroups={() => setShowFindGroups(true)}
              onMessageRequests={() => setShowMessageRequests(true)}
              filter={filter}
              onFilterChange={setFilter}
              isLoading={loading}
            />
          </div>
        )}

        {/* Chat Window - Full width on mobile when viewing chat */}
        {(!isMobile || showChat) && (
          <ChatWindow
            conversation={currentConversation}
            messages={localMessages}
            currentUserId={user?.id || ''}
            currentProfileId={profile?.id || ''}
            onSendMessage={(content, options) => sendMessage(content, options)}
            onBack={isMobile ? () => setShowChat(false) : undefined}
            onViewInfo={currentConversation?.type === 'group' ? () => setShowGroupInfo(true) : undefined}
            isMobile={isMobile}
            onDeleteMessage={handleDeleteMessage}
            onForwardMessage={handleForwardMessage}
            onSaveMessage={handleSaveMessage}
            currentChannelName={currentConversation?.type === 'group' ? currentChannel.channelName : undefined}
            currentChannelId={currentConversation?.type === 'group' ? currentChannel.channelId : undefined}
          />
        )}
      </motion.div>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onCreateGroup={createGroup}
      />

      {/* New DM Modal */}
      <NewDMModal
        open={showNewDM}
        onOpenChange={setShowNewDM}
        users={searchUsers}
        onSelectUser={handleSelectUserForDM}
        onSearch={handleSearchUsers}
        isLoading={searchLoading}
      />

      {/* Group Info Sheet */}
      {currentConversation?.type === 'group' && getGroupInfo() && (
        <GroupInfoSheet
          open={showGroupInfo}
          onOpenChange={setShowGroupInfo}
          group={getGroupInfo()!}
          members={groupMembers}
          channels={groupChannels}
          currentUserId={profile?.id || ''}
          currentUserRole={getCurrentUserRole()}
          onLeaveGroup={() => {
            // TODO: Implement leave group
            setShowGroupInfo(false);
          }}
          onAddMember={() => {
            setShowAddMembers(true);
          }}
          onCreateChannel={() => {
            setShowCreateChannel(true);
          }}
          onSelectChannel={(channel) => {
            const groupId = currentConversation!.id.replace('group_', '');
            if (channel.type === 'voice') {
              // Open Club Room for voice channels
              switchChannel(channel, groupId);
              setShowClubRoom(true);
              setShowGroupInfo(false);
            } else {
              // Switch to text/announcement channel
              switchChannel(channel, groupId);
              toast.success(`Switched to #${channel.name}`);
            }
          }}
          onMemberClick={(member) => {
            setSelectedMember(member);
            setShowManageMember(true);
          }}
        />
      )}

      {/* Find Groups Modal */}
      <FindGroupsModal
        open={showFindGroups}
        onOpenChange={setShowFindGroups}
        onJoinGroup={(groupId) => {
          fetchConversations();
        }}
      />

      {/* Message Requests Modal */}
      <MessageRequestsModal
        open={showMessageRequests}
        onOpenChange={setShowMessageRequests}
        onAccept={(senderId) => {
          fetchConversations();
        }}
      />

      {/* Create Channel Modal */}
      {currentConversation?.type === 'group' && (
        <CreateChannelModal
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
          groupId={currentConversation.id.replace('group_', '')}
          onChannelCreated={() => {
            const groupId = currentConversation.id.replace('group_', '');
            fetchGroupDetails(groupId);
          }}
        />
      )}

      {/* Manage Member Modal */}
      {currentConversation?.type === 'group' && selectedMember && (
        <ManageMemberModal
          open={showManageMember}
          onOpenChange={setShowManageMember}
          member={selectedMember}
          groupId={currentConversation.id.replace('group_', '')}
          currentUserRole={getCurrentUserRole()}
          onMemberUpdated={() => {
            const groupId = currentConversation.id.replace('group_', '');
            fetchGroupDetails(groupId);
          }}
        />
      )}

      {/* Add Members Modal */}
      {currentConversation?.type === 'group' && (
        <AddMembersModal
          open={showAddMembers}
          onOpenChange={setShowAddMembers}
          groupId={currentConversation.id.replace('group_', '')}
          inviteLink={`${window.location.origin}/join/${currentConversation.id.replace('group_', '')}`}
          onMemberAdded={() => {
            const groupId = currentConversation.id.replace('group_', '');
            fetchGroupDetails(groupId);
          }}
        />
      )}

      {/* Club Room View */}
      {showClubRoom && currentConversation?.type === 'group' && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4">
          <ClubRoomView
            channelName={currentChannel.channelName}
            groupName={currentConversation.name}
            participants={groupMembers}
            currentUserId={profile?.id || ''}
            currentUserRole={getCurrentUserRole()}
            activeParticipantIds={[]} // Start empty - participants join when they connect
            onLeave={() => {
              setShowClubRoom(false);
              toast.info('Left the room');
            }}
            onClose={() => setShowClubRoom(false)}
          />
        </div>
      )}

      {/* Forward Message Modal */}
      <ForwardMessageModal
        open={showForward}
        onOpenChange={setShowForward}
        messageContent={forwardContent}
        conversations={conversationsWithOnlineStatus}
        onForward={handleForwardToConversation}
      />
    </DashboardLayout>
  );
};

export default Messages;
