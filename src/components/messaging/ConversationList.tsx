import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, User, Plus, Settings, Compass, Inbox, Check, CheckCheck, Phone, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import usePresence from '@/hooks/usePresence';
import { useOptionalLiveKitContext } from '@/contexts/LiveKitContext';
import { useMessagingSettings } from '@/hooks/useMessagingSettings';
import MessageSettingsModal from './MessageSettingsModal';

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  members?: number;
  lastMessageIsMine?: boolean;
  lastMessageStatus?: 'sent' | 'delivered' | 'seen';
  // For DM calls - the partner's profile.id (NOT their auth user_id)
  partnerProfileId?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onCreateGroup?: () => void;
  onNewDM?: () => void;
  onFindGroups?: () => void;
  onMessageRequests?: () => void;
  filter: 'all' | 'dms' | 'groups';
  onFilterChange: (filter: 'all' | 'dms' | 'groups') => void;
  isLoading?: boolean;
}

const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
  onCreateGroup,
  onNewDM,
  onFindGroups,
  onMessageRequests,
  filter,
  onFilterChange,
  isLoading = false
}: ConversationListProps) => {
  const { user } = useAuth();
  const { isUserOnline, getTypingUsersForConversation } = usePresence('messaging-presence');
  const liveKitContext = useOptionalLiveKitContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [requestCount, setRequestCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const { settings: msgSettings } = useMessagingSettings();

  // Fetch pending request count (message requests + friend requests)
  useEffect(() => {
    const fetchRequestCount = async () => {
      if (!user) return;

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (myProfile) {
        // Count pending message requests
        const { count: msgCount } = await supabase
          .from('message_requests')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', myProfile.id)
          .eq('status', 'pending');

        // Count pending friend requests (where I'm the addressee - uses user_id not profile.id)
        const { count: friendCount } = await supabase
          .from('friendships')
          .select('id', { count: 'exact', head: true })
          .eq('addressee_id', user.id)
          .eq('status', 'pending');

        setRequestCount((msgCount || 0) + (friendCount || 0));
      }
    };

    fetchRequestCount();
  }, [user]);

  const filteredConversations = conversations.filter(conv => {
    if (conv.id === 'saved') return filter === 'all' || filter === 'dms';
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'dms' && conv.type === 'dm') ||
      (filter === 'groups' && conv.type === 'group');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} title="Settings">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNewDM} title="New DM">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onCreateGroup} title="Create Group">
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onFindGroups} title="Find Groups">
              <Compass className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMessageRequests} 
              title="Message Requests"
              className="relative"
            >
              <Inbox className="w-4 h-4" />
              {requestCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 text-[10px] p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
                  {requestCount > 9 ? '9+' : requestCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 bg-muted/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "flex-1",
              filter === 'all' && "bg-gradient-accent text-accent-foreground"
            )}
            onClick={() => onFilterChange('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'dms' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "flex-1",
              filter === 'dms' && "bg-gradient-accent text-accent-foreground"
            )}
            onClick={() => onFilterChange('dms')}
          >
            DMs
          </Button>
          <Button
            variant={filter === 'groups' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "flex-1",
              filter === 'groups' && "bg-gradient-accent text-accent-foreground"
            )}
            onClick={() => onFilterChange('groups')}
          >
            Groups
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b border-border/50">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm text-center">No results found</p>
            <p className="text-xs text-center mt-1">Try a different search term</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <Users className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm text-center">No conversations yet</p>
            <p className="text-xs text-center mt-1">Start a new chat or create a group</p>
          </div>
        ) : (
          filteredConversations.map((conv, i) => {
            // Get typing users for this conversation
            const typingUsersForConv = getTypingUsersForConversation(conv.id);
            
            // Check if this conversation has an active call
            const isInCall = liveKitContext?.callState?.status === 'connected' && (
              (conv.type === 'dm' && liveKitContext.callState.roomContext === 'dm' && conv.id === `dm_${liveKitContext.callState.contextId}`) ||
              (conv.type === 'group' && liveKitContext.callState.roomContext === 'group' && conv.id === `group_${liveKitContext.callState.contextId}`)
            );
            const callParticipantCount = isInCall ? (liveKitContext?.remoteParticipants?.length || 0) + 1 : 0;

            // Activity text
            let activityText = '';
            if (msgSettings.show_activity && typingUsersForConv.length === 1) {
              activityText = `${typingUsersForConv[0].name.split(' ')[0]} typing...`;
            } else if (msgSettings.show_activity && typingUsersForConv.length > 1) {
              activityText = `${typingUsersForConv.length} typing...`;
            }

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-border/50",
                  selectedId === conv.id 
                    ? "bg-accent/10 border-l-2 border-l-accent" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => onSelect(conv)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.avatar} />
                    <AvatarFallback className={cn(
                      "text-sm",
                      conv.id === 'saved'
                        ? "bg-accent/20 text-accent"
                        : conv.type === 'group' 
                          ? "bg-primary/20 text-primary" 
                          : "bg-gradient-accent text-accent-foreground"
                    )}>
                      {conv.id === 'saved' ? <Bookmark className="w-5 h-5" /> : conv.type === 'group' ? <Users className="w-5 h-5" /> : conv.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {msgSettings.show_status && conv.type === 'dm' && (conv.isOnline || isUserOnline(conv.id.replace('dm_', ''))) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card animate-pulse" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground truncate">{conv.name?.split(' ')[0]}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{conv.lastMessageTime}</span>
                      {/* Message status indicator */}
                      {conv.type === 'dm' && conv.lastMessageIsMine && (
                        conv.lastMessageStatus === 'seen' ? (
                          <CheckCheck className="w-3 h-3 text-primary" />
                        ) : (
                          <Check className="w-3 h-3 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    {activityText ? (
                      <p className="text-xs text-accent italic truncate">{activityText}</p>
                    ) : (
                      <p className={cn(
                        "text-sm truncate",
                        conv.lastMessageIsMine 
                          ? "text-accent" 
                          : "text-muted-foreground"
                      )}>
                        {conv.lastMessageIsMine && <span className="text-muted-foreground">You: </span>}
                        {conv.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Call indicator */}
                      {isInCall && (
                        <Badge className="bg-success/20 text-success text-[10px] h-5 min-w-5 rounded-full flex items-center gap-0.5 px-1.5">
                          <Phone className="w-2.5 h-2.5" />
                          {callParticipantCount}
                        </Badge>
                      )}
                      {/* Unread badge - red */}
                      {(conv.unreadCount ?? 0) > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground text-[10px] h-5 min-w-5 rounded-full">
                          {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {conv.type === 'group' && conv.members && (
                    <span className="text-[10px] text-muted-foreground">{conv.members} members</span>
                  )}
                </div>
              </motion.div>
            );
          })

        )}
      </div>

      {/* Message Settings Modal */}
      <MessageSettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
};

export default ConversationList;
