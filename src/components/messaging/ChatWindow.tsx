import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Image, 
  Paperclip, 
  Phone, 
  Video, 
  Users,
  ArrowLeft,
  Info,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  VideoIcon
} from 'lucide-react';
import ChatBubble from './ChatBubble';
import CallModal from './CallModal';
import EmojiPicker from './EmojiPicker';
import TypingIndicator from './TypingIndicator';
import { Conversation } from './ConversationList';
import { toast } from 'sonner';
import usePresence from '@/hooks/usePresence';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isRead?: boolean;
  type?: 'message' | 'call';
  callType?: 'voice' | 'video';
  callStatus?: 'missed' | 'answered' | 'rejected' | 'ended';
  callDuration?: number;
}

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  onViewInfo?: () => void;
  isMobile?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  currentChannelName?: string;
}

// Format date for date separator - handles invalid dates gracefully
const formatDateSeparator = (date: Date): string => {
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Today'; // Fallback for invalid dates
  }
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

// Safe date parser - returns a valid Date or current date as fallback
const parseMessageDate = (timestamp: string): Date => {
  // If it's already a valid ISO string or timestamp
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  // Fallback to current date for display strings like "Just now", "5:30 PM"
  return new Date();
};

// Format call duration
const formatCallDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const ChatWindow = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  onViewInfo,
  isMobile,
  onDeleteMessage,
  currentChannelName,
}: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showCall, setShowCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isUserOnline, getTypingUsersForConversation, sendTypingIndicator } = usePresence();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTyping = useCallback(() => {
    if (!conversation) return;
    
    sendTypingIndicator(conversation.id, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(conversation.id, false);
    }, 2000);
  }, [conversation, sendTypingIndicator]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    if (conversation) {
      sendTypingIndicator(conversation.id, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    onSendMessage(newMessage);
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleVoiceCall = () => {
    if (conversation?.type === 'dm') {
      setCallType('voice');
      setShowCall(true);
    } else {
      toast.info('Voice calls coming soon for groups!');
    }
  };

  const handleVideoCall = () => {
    if (conversation?.type === 'dm') {
      setCallType('video');
      setShowCall(true);
    } else {
      toast.info('Video calls coming soon for groups!');
    }
  };

  const getPartnerId = () => {
    if (conversation?.type === 'dm' && conversation.id) {
      // The conversation.id for DMs is the other user's profile id directly
      // Check if it starts with 'dm_' prefix (legacy format) or is a UUID
      if (conversation.id.startsWith('dm_')) {
        return conversation.id.replace('dm_', '');
      }
      // If not prefixed, the id itself is the partner's user_id
      return conversation.id;
    }
    return null;
  };

  const partnerId = getPartnerId();
  const isPartnerOnline = partnerId ? isUserOnline(partnerId) : false;
  const typingUsers = conversation ? getTypingUsersForConversation(conversation.id) : [];

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background/50 text-muted-foreground">
        <Users className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">Select a conversation</p>
        <p className="text-sm">Choose from your existing conversations or start a new one</p>
      </div>
    );
  }

  // Group messages by date and sender
  const groupedMessages: Array<{ 
    date: Date; 
    groups: Array<{ messages: Message[], senderId: string }> 
  }> = [];

  messages.forEach((msg, i) => {
    const msgDate = parseMessageDate(msg.timestamp);
    const prevMsg = messages[i - 1];
    const prevMsgDate = prevMsg ? parseMessageDate(prevMsg.timestamp) : null;
    
    // Check if we need a new date group
    if (!prevMsgDate || !isSameDay(msgDate, prevMsgDate)) {
      groupedMessages.push({ date: msgDate, groups: [] });
    }

    const currentDateGroup = groupedMessages[groupedMessages.length - 1];
    const isNewSenderGroup = !prevMsg || 
      prevMsg.sender.id !== msg.sender.id || 
      !isSameDay(msgDate, parseMessageDate(prevMsg.timestamp));
    
    if (isNewSenderGroup) {
      currentDateGroup.groups.push({ messages: [msg], senderId: msg.sender.id });
    } else {
      currentDateGroup.groups[currentDateGroup.groups.length - 1].messages.push(msg);
    }
  });

  // Render call message
  const renderCallMessage = (msg: Message) => {
    const isSender = msg.sender.id === currentUserId;
    const Icon = msg.callType === 'video' ? VideoIcon : (
      msg.callStatus === 'missed' ? PhoneMissed :
      isSender ? PhoneOutgoing : PhoneIncoming
    );
    const statusColor = msg.callStatus === 'missed' ? 'text-destructive' : 
      msg.callStatus === 'answered' ? 'text-success' : 'text-muted-foreground';

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-3"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
          <Icon className={`w-4 h-4 ${statusColor}`} />
          <span className="text-muted-foreground">
            {msg.callType === 'video' ? 'Video call' : 'Voice call'} • {' '}
            {msg.callStatus === 'missed' ? 'Missed' :
             msg.callStatus === 'answered' && msg.callDuration 
               ? formatCallDuration(msg.callDuration) 
               : msg.callStatus}
          </span>
          <span className="text-xs text-muted-foreground">
            {(() => {
              const callDate = parseMessageDate(msg.timestamp);
              return !isNaN(callDate.getTime()) ? format(callDate, 'h:mm a') : msg.timestamp;
            })()}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        {isMobile && onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.avatar} />
          <AvatarFallback className={
            conversation.type === 'group' 
              ? "bg-primary/20 text-primary" 
              : "bg-gradient-accent text-accent-foreground"
          }>
            {conversation.type === 'group' ? <Users className="w-5 h-5" /> : conversation.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">{conversation.name}</h3>
            {currentChannelName && (
              <Badge variant="secondary" className="text-[10px]">
                #{currentChannelName}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {conversation.type === 'group' 
              ? `${conversation.members} members`
              : (
                <>
                  <span className={`w-2 h-2 rounded-full ${isPartnerOnline ? 'bg-success' : 'bg-muted-foreground'}`} />
                  {isPartnerOnline ? 'Online' : 'Offline'}
                </>
              )
            }
          </p>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" title="Voice Call" onClick={handleVoiceCall}>
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Video Call" onClick={handleVideoCall}>
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onViewInfo} title="Info">
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages with date separators */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-background to-muted/20">
        {groupedMessages.map((dateGroup, dateIndex) => (
          <div key={dateIndex}>
            {/* Date Separator */}
            <div className="flex justify-center my-4">
              <div className="px-3 py-1 rounded-full bg-muted/70 text-xs text-muted-foreground font-medium">
                {formatDateSeparator(dateGroup.date)}
              </div>
            </div>

            {dateGroup.groups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {group.messages.map((msg, msgIndex) => (
                  msg.type === 'call' ? (
                    renderCallMessage(msg)
                  ) : (
                    <ChatBubble
                      key={msg.id}
                      messageId={msg.id}
                      message={msg.content}
                      sender={msg.sender}
                      timestamp={msg.timestamp}
                      isSender={msg.sender.id === currentUserId}
                      showAvatar={msgIndex === group.messages.length - 1}
                      isRead={msg.isRead}
                      isFirstInGroup={msgIndex === 0}
                      isLastInGroup={msgIndex === group.messages.length - 1}
                      onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
                    />
                  )
                ))}
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers} />
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Image className="w-5 h-5 text-muted-foreground" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="pr-10 bg-muted/50"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          </div>
          
          <Button 
            size="icon" 
            className="bg-gradient-accent text-accent-foreground shrink-0"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Call Modal */}
      {partnerId && (
        <CallModal
          open={showCall}
          onOpenChange={setShowCall}
          callType={callType}
          callee={{
            id: partnerId,
            name: conversation.name,
            avatar: conversation.avatar,
          }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
