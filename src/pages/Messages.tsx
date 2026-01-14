import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConversationList, { Conversation } from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import CreateGroupModal from '@/components/messaging/CreateGroupModal';
import NewDMModal, { UserSearchResult } from '@/components/messaging/NewDMModal';
import GroupInfoSheet from '@/components/messaging/GroupInfoSheet';
import FindGroupsModal from '@/components/messaging/FindGroupsModal';
import MessageRequestsModal from '@/components/messaging/MessageRequestsModal';
import useMessaging from '@/hooks/useMessaging';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

import { toast } from 'sonner';
import { useEffect } from 'react';

const Messages = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
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
  } = useMessaging();

  const [filter, setFilter] = useState<'all' | 'dms' | 'groups'>('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showFindGroups, setShowFindGroups] = useState(false);
  const [showMessageRequests, setShowMessageRequests] = useState(false);
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [localMessages, setLocalMessages] = useState(messages);

  // Sync local messages with hook messages
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Handle delete message
  const handleDeleteMessage = (messageId: string) => {
    setLocalMessages(prev => prev.filter(m => m.id !== messageId));
    toast.success('Message deleted');
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    await fetchMessages(conversation.id);
    
    if (conversation.type === 'group') {
      const groupId = conversation.id.replace('group_', '');
      await fetchGroupDetails(groupId);
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

  // Get current user's role in a group
  const getCurrentUserRole = (): 'owner' | 'admin' | 'member' => {
    if (!user || currentConversation?.type !== 'group') return 'member';
    const member = groupMembers.find(m => m.id === user.id);
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
        className="h-[calc(100vh-8rem)] flex overflow-hidden rounded-xl border border-border bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Conversation List - Hidden on mobile when viewing chat */}
        {(!isMobile || !showChat) && (
          <div className={`${isMobile ? 'w-full' : 'w-80 shrink-0'}`}>
            <ConversationList
              conversations={conversations}
              selectedId={currentConversation?.id}
              onSelect={handleSelectConversation}
              onCreateGroup={() => setShowCreateGroup(true)}
              onNewDM={() => setShowNewDM(true)}
              onFindGroups={() => setShowFindGroups(true)}
              onMessageRequests={() => setShowMessageRequests(true)}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>
        )}

        {/* Chat Window - Full width on mobile when viewing chat */}
        {(!isMobile || showChat) && (
          <ChatWindow
            conversation={currentConversation}
            messages={localMessages}
            currentUserId={user?.id || ''}
            onSendMessage={sendMessage}
            onBack={isMobile ? () => setShowChat(false) : undefined}
            onViewInfo={currentConversation?.type === 'group' ? () => setShowGroupInfo(true) : undefined}
            isMobile={isMobile}
            onDeleteMessage={handleDeleteMessage}
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
          currentUserId={user?.id || ''}
          currentUserRole={getCurrentUserRole()}
          onLeaveGroup={() => {
            // TODO: Implement leave group
            setShowGroupInfo(false);
          }}
          onAddMember={() => {
            // TODO: Implement add member
          }}
          onCreateChannel={() => {
            // TODO: Implement create channel
          }}
          onSelectChannel={() => {
            // TODO: Implement channel selection
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
    </DashboardLayout>
  );
};

export default Messages;
