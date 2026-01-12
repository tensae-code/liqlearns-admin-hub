import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, User, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onCreateGroup?: () => void;
  onNewDM?: () => void;
  filter: 'all' | 'dms' | 'groups';
  onFilterChange: (filter: 'all' | 'dms' | 'groups') => void;
}

const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
  onCreateGroup,
  onNewDM,
  filter,
  onFilterChange
}: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => {
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
            <Button variant="ghost" size="icon" onClick={onNewDM} title="New DM">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onCreateGroup} title="Create Group">
              <Users className="w-4 h-4" />
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
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <Users className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm text-center">No conversations yet</p>
            <p className="text-xs text-center mt-1">Start a new chat or create a group</p>
          </div>
        ) : (
          filteredConversations.map((conv, i) => (
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
                    conv.type === 'group' 
                      ? "bg-primary/20 text-primary" 
                      : "bg-gradient-accent text-accent-foreground"
                  )}>
                    {conv.type === 'group' ? <Users className="w-5 h-5" /> : conv.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {conv.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground truncate">{conv.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastMessageTime}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  {conv.unreadCount && conv.unreadCount > 0 && (
                    <Badge className="bg-accent text-accent-foreground text-[10px] h-5 min-w-5 rounded-full shrink-0">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </Badge>
                  )}
                </div>
                {conv.type === 'group' && conv.members && (
                  <span className="text-[10px] text-muted-foreground">{conv.members} members</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
