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
  VideoIcon,
  Mic,
  X,
  Play,
  Pause,
  FileIcon,
  Download,
  Loader2
} from 'lucide-react';
import ChatBubble from './ChatBubble';
import EmojiPicker from './EmojiPicker';
import TypingIndicator from './TypingIndicator';
import VoiceRecorder from './VoiceRecorder';
import FileAttachmentPreview from './FileAttachmentPreview';
import { Conversation } from './ConversationList';
import { toast } from 'sonner';
import usePresence from '@/hooks/usePresence';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalLiveKitContext } from '@/contexts/LiveKitContext';

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
  type?: 'message' | 'call' | 'voice' | 'file' | 'image';
  callType?: 'voice' | 'video';
  callStatus?: 'missed' | 'answered' | 'rejected' | 'ended';
  callDuration?: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  durationSeconds?: number;
}

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, options?: { 
    type?: 'text' | 'voice' | 'file' | 'image';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    durationSeconds?: number;
  }) => void;
  onBack?: () => void;
  onViewInfo?: () => void;
  isMobile?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  currentChannelName?: string;
}

// Format date for date separator - handles invalid dates gracefully
const formatDateSeparator = (date: Date): string => {
  if (isNaN(date.getTime())) {
    return 'Today';
  }
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

// Safe date parser - returns a valid Date or current date as fallback
const parseMessageDate = (timestamp: string): Date => {
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
};

// Format call duration
const formatCallDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

// Format voice message duration
const formatVoiceDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const { user } = useAuth();
  const liveKitContext = useOptionalLiveKitContext();
  const startDMCall = liveKitContext?.startDMCall;
  const startGroupCall = liveKitContext?.startGroupCall;
  const [newMessage, setNewMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  
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

  const handleSend = async () => {
    if (!newMessage.trim() && !pendingFile) return;
    
    if (conversation) {
      sendTypingIndicator(conversation.id, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Handle file upload first
    if (pendingFile) {
      await handleFileUpload(pendingFile);
      return;
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
    if (!startDMCall || !startGroupCall) {
      toast.error('Call feature not available');
      return;
    }
    if (conversation?.type === 'dm') {
      // CRITICAL: Use partnerProfileId (profile.id) for call signaling, NOT the auth user_id
      const partnerProfileId = conversation.partnerProfileId;
      if (partnerProfileId) {
        startDMCall(partnerProfileId, conversation.name, conversation.avatar, 'voice');
      } else {
        // Fallback: extract user_id from dm_XXX and look up profile
        const partnerId = conversation.id.replace('dm_', '');
        console.warn('partnerProfileId not available, using fallback for:', partnerId);
        toast.error('Unable to start call. Please refresh the page.');
      }
    } else if (conversation?.type === 'group') {
      // Extract group ID from group_XXX format
      const groupId = conversation.id.replace('group_', '');
      startGroupCall(groupId, 'voice');
    }
  };

  const handleVideoCall = () => {
    if (!startDMCall || !startGroupCall) {
      toast.error('Call feature not available');
      return;
    }
    if (conversation?.type === 'dm') {
      // CRITICAL: Use partnerProfileId (profile.id) for call signaling, NOT the auth user_id
      const partnerProfileId = conversation.partnerProfileId;
      if (partnerProfileId) {
        startDMCall(partnerProfileId, conversation.name, conversation.avatar, 'video');
      } else {
        // Fallback: extract user_id from dm_XXX and look up profile
        const partnerId = conversation.id.replace('dm_', '');
        console.warn('partnerProfileId not available, using fallback for:', partnerId);
        toast.error('Unable to start call. Please refresh the page.');
      }
    } else if (conversation?.type === 'group') {
      // Extract group ID from group_XXX format
      const groupId = conversation.id.replace('group_', '');
      startGroupCall(groupId, 'video');
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!user) return;
    
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);
      
      const isImage = file.type.startsWith('image/');
      
      onSendMessage(file.name, {
        type: isImage ? 'image' : 'file',
        fileUrl: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
      });
      
      setPendingFile(null);
      toast.success('File sent!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Voice message handler
  const handleVoiceSend = async (audioBlob: Blob, durationSeconds: number) => {
    if (!user) return;
    
    setIsUploading(true);
    
    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      
      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);
      
      onSendMessage('Voice message', {
        type: 'voice',
        fileUrl: urlData.publicUrl,
        durationSeconds,
      });
      
      setShowVoiceRecorder(false);
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast.error('Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  };

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File too large', { description: 'Maximum file size is 10MB' });
        return;
      }
      setPendingFile(file);
    }
    e.target.value = ''; // Reset input
  };

  // Audio playback
  const toggleAudioPlayback = (messageId: string, audioUrl: string) => {
    let audio = audioRefs.current.get(messageId);
    
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudioId(null);
      audioRefs.current.set(messageId, audio);
    }
    
    if (playingAudioId === messageId) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      // Stop any currently playing audio
      if (playingAudioId) {
        const currentAudio = audioRefs.current.get(playingAudioId);
        currentAudio?.pause();
      }
      audio.play();
      setPlayingAudioId(messageId);
    }
  };

  const getPartnerId = () => {
    if (conversation?.type === 'dm' && conversation.id) {
      if (conversation.id.startsWith('dm_')) {
        return conversation.id.replace('dm_', '');
      }
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
    
    if (!prevMsgDate || !isSameDay(msgDate, prevMsgDate)) {
      groupedMessages.push({ date: msgDate, groups: [] });
    }

    const currentDateGroup = groupedMessages[groupedMessages.length - 1];
    const isNewSenderGroup = !prevMsg || 
      prevMsg.sender.id !== msg.sender.id || 
      !isSameDay(msgDate, parseMessageDate(prevMsg.timestamp)) ||
      msg.type === 'call';
    
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

  // Render voice message bubble
  const renderVoiceMessage = (msg: Message, isSender: boolean) => {
    const isPlaying = playingAudioId === msg.id;
    
    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div 
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[280px] ${
            isSender 
              ? 'bg-[hsl(var(--accent))] text-accent-foreground' 
              : 'bg-muted text-foreground'
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={() => msg.fileUrl && toggleAudioPlayback(msg.id, msg.fileUrl)}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full ${isSender ? 'bg-accent-foreground/50' : 'bg-foreground/30'}`}
                  style={{ height: `${Math.random() * 16 + 4}px` }}
                />
              ))}
            </div>
          </div>
          
          <span className={`text-xs ${isSender ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
            {msg.durationSeconds ? formatVoiceDuration(msg.durationSeconds) : '0:00'}
          </span>
        </div>
      </motion.div>
    );
  };

  // Render file message
  const renderFileMessage = (msg: Message, isSender: boolean) => {
    const isImage = msg.type === 'image';
    
    if (isImage && msg.fileUrl) {
      return (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}
        >
          <div className="max-w-[280px] rounded-2xl overflow-hidden">
            <img 
              src={msg.fileUrl} 
              alt={msg.fileName || 'Image'} 
              className="w-full h-auto"
            />
            <div className={`px-3 py-2 text-xs ${
              isSender 
                ? 'bg-[hsl(var(--accent))] text-accent-foreground/70' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {(() => {
                const msgDate = parseMessageDate(msg.timestamp);
                return !isNaN(msgDate.getTime()) ? format(msgDate, 'h:mm a') : msg.timestamp;
              })()}
            </div>
          </div>
        </motion.div>
      );
    }
    
    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div 
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[280px] ${
            isSender 
              ? 'bg-[hsl(var(--accent))] text-accent-foreground' 
              : 'bg-muted text-foreground'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isSender ? 'bg-accent-foreground/20' : 'bg-foreground/10'
          }`}>
            <FileIcon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{msg.fileName || 'File'}</p>
            <p className={`text-xs ${isSender ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
              {msg.fileSize ? formatFileSize(msg.fileSize) : ''}
            </p>
          </div>
          
          {msg.fileUrl && (
            <a 
              href={msg.fileUrl} 
              download={msg.fileName}
              className="shrink-0"
            >
              <Download className={`w-4 h-4 ${isSender ? 'text-accent-foreground/70' : 'text-muted-foreground'}`} />
            </a>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full max-h-full overflow-hidden">
      {/* Header - Fixed height, shrink-0 */}
      <div className="flex items-center gap-2 p-2 md:p-4 border-b border-border bg-card shrink-0">
        {isMobile && onBack && (
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        
        <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
          <AvatarImage src={conversation.avatar} />
          <AvatarFallback className={
            conversation.type === 'group' 
              ? "bg-primary/20 text-primary" 
              : "bg-gradient-accent text-accent-foreground"
          }>
            {conversation.type === 'group' ? <Users className="w-4 h-4" /> : conversation.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground text-sm md:text-base truncate">{conversation.name}</h3>
            {currentChannelName && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
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

        <div className="flex gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Voice Call" onClick={handleVoiceCall}>
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Video Call" onClick={handleVideoCall}>
            <Video className="w-4 h-4" />
          </Button>
          {onViewInfo && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onViewInfo} title="Info">
              <Info className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages with date separators - flex-1 with overflow */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gradient-to-b from-background to-muted/20" style={{ minHeight: 0 }}>
        {groupedMessages.map((dateGroup, dateIndex) => (
          <div key={dateIndex}>
            {/* Date Separator */}
            <div className="flex justify-center my-3">
              <div className="px-3 py-1 rounded-full bg-muted/70 text-xs text-muted-foreground font-medium">
                {formatDateSeparator(dateGroup.date)}
              </div>
            </div>

            {dateGroup.groups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {group.messages.map((msg, msgIndex) => {
                  const isSender = msg.sender.id === currentUserId;
                  
                  if (msg.type === 'call') {
                    return renderCallMessage(msg);
                  }
                  
                  if (msg.type === 'voice') {
                    return renderVoiceMessage(msg, isSender);
                  }
                  
                  if (msg.type === 'file' || msg.type === 'image') {
                    return renderFileMessage(msg, isSender);
                  }
                  
                  return (
                    <ChatBubble
                      key={msg.id}
                      messageId={msg.id}
                      message={msg.content}
                      sender={msg.sender}
                      timestamp={msg.timestamp}
                      isSender={isSender}
                      showAvatar={msgIndex === group.messages.length - 1}
                      isRead={msg.isRead}
                      isFirstInGroup={msgIndex === 0}
                      isLastInGroup={msgIndex === group.messages.length - 1}
                      onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
                    />
                  );
                })}
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

      {/* File attachment preview */}
      <AnimatePresence>
        {pendingFile && (
          <div className="p-3 border-t border-border bg-card">
            <FileAttachmentPreview
              file={pendingFile}
              onRemove={() => setPendingFile(null)}
              isUploading={isUploading}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Voice recorder - shrink-0 */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <div className="p-3 md:p-4 border-t border-border bg-card shrink-0">
            <VoiceRecorder
              onSend={handleVoiceSend}
              onCancel={() => setShowVoiceRecorder(false)}
              isUploading={isUploading}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Input - always visible at bottom */}
      {!showVoiceRecorder && (
        <div className="p-2 md:p-4 border-t border-border bg-card flex-shrink-0 pb-safe">
          <div className="flex items-center gap-1 md:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8 hidden md:flex"
              onClick={() => setShowVoiceRecorder(true)}
            >
              <Mic className="w-4 h-4 text-muted-foreground" />
            </Button>
            
            <div className="flex-1 relative min-w-0">
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="pr-10 bg-muted/50 h-9 md:h-10 text-sm"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            </div>
            
            <Button 
              size="icon" 
              className="bg-gradient-accent text-accent-foreground shrink-0 h-8 w-8 md:h-10 md:w-10"
              onClick={handleSend}
              disabled={(!newMessage.trim() && !pendingFile) || isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
