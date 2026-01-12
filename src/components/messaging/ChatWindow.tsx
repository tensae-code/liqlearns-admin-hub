import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Smile, 
  Image, 
  Paperclip, 
  Phone, 
  Video, 
  MoreVertical,
  Users,
  ArrowLeft,
  Info
} from 'lucide-react';
import ChatBubble from './ChatBubble';
import CallModal from './CallModal';
import { Conversation } from './ConversationList';
import { toast } from 'sonner';

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
}

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  onViewInfo?: () => void;
  isMobile?: boolean;
}

const ChatWindow = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  onViewInfo,
  isMobile
}: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showCall, setShowCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
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

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background/50 text-muted-foreground">
        <Users className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">Select a conversation</p>
        <p className="text-sm">Choose from your existing conversations or start a new one</p>
      </div>
    );
  }

  // Group messages by sender for sequential messages with better tracking
  const groupedMessages = messages.reduce<Array<{ messages: Message[], senderId: string }>>((acc, msg, i) => {
    const prevMsg = messages[i - 1];
    const isNewGroup = !prevMsg || prevMsg.sender.id !== msg.sender.id;
    
    if (isNewGroup) {
      acc.push({ messages: [msg], senderId: msg.sender.id });
    } else {
      acc[acc.length - 1].messages.push(msg);
    }
    return acc;
  }, []);

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
          <h3 className="font-medium text-foreground">{conversation.name}</h3>
          <p className="text-xs text-muted-foreground">
            {conversation.type === 'group' 
              ? `${conversation.members} members`
              : conversation.isOnline ? 'Online' : 'Offline'
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

      {/* Messages - iPhone style background */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-background to-muted/20">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.messages.map((msg, msgIndex) => (
              <ChatBubble
                key={msg.id}
                message={msg.content}
                sender={msg.sender}
                timestamp={msg.timestamp}
                isSender={msg.sender.id === currentUserId}
                showAvatar={msgIndex === group.messages.length - 1}
                isRead={msg.isRead}
                isFirstInGroup={msgIndex === 0}
                isLastInGroup={msgIndex === group.messages.length - 1}
              />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
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
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-10 bg-muted/50"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <Smile className="w-5 h-5 text-muted-foreground" />
            </Button>
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
      <CallModal
        open={showCall}
        onOpenChange={setShowCall}
        callType={callType}
        callee={{
          id: conversation.id,
          name: conversation.name,
          avatar: conversation.avatar,
        }}
      />
    </div>
  );
};

export default ChatWindow;
