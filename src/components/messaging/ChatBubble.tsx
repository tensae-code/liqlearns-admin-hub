import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatBubbleProps {
  message: string;
  sender: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isSender: boolean;
  showAvatar?: boolean;
  isRead?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onDelete?: () => void;
  messageId?: string;
}

const ChatBubble = ({ 
  message, 
  sender, 
  timestamp, 
  isSender, 
  showAvatar = true,
  isRead,
  isFirstInGroup = true,
  isLastInGroup = true,
  onDelete,
  messageId,
}: ChatBubbleProps) => {
  const [showOptions, setShowOptions] = useState(false);

  // iPhone-style bubble corners
  const getBubbleRadius = () => {
    if (isSender) {
      if (isFirstInGroup && isLastInGroup) return 'rounded-[20px] rounded-br-[4px]';
      if (isFirstInGroup) return 'rounded-[20px] rounded-br-[4px] rounded-br-[4px]';
      if (isLastInGroup) return 'rounded-[20px] rounded-tr-[4px] rounded-br-[4px]';
      return 'rounded-[20px] rounded-r-[4px]';
    } else {
      if (isFirstInGroup && isLastInGroup) return 'rounded-[20px] rounded-bl-[4px]';
      if (isFirstInGroup) return 'rounded-[20px] rounded-bl-[4px] rounded-bl-[4px]';
      if (isLastInGroup) return 'rounded-[20px] rounded-tl-[4px] rounded-bl-[4px]';
      return 'rounded-[20px] rounded-l-[4px]';
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div 
      className={cn(
        "flex gap-2 group",
        isSender ? "flex-row-reverse" : "flex-row",
        isLastInGroup ? "mb-3" : "mb-0.5"
      )}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Avatar space - only show on last message in group */}
      {!isSender && (
        <div className="w-8 shrink-0">
          {showAvatar && isLastInGroup && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={sender.avatar} />
              <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
                {sender.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
      
      <div className={cn(
        "max-w-[75%] flex flex-col relative",
        isSender ? "items-end" : "items-start"
      )}>
        {/* Sender name - only show on first message in group for non-senders */}
        {!isSender && isFirstInGroup && (
          <span className="text-[11px] text-muted-foreground mb-1 ml-3 font-medium">
            {sender.name}
          </span>
        )}
        
        <div className="flex items-center gap-1">
          {/* Delete option for sender messages */}
          {isSender && showOptions && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-popover border border-border shadow-lg">
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }} 
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Message bubble - iPhone style */}
          <div className={cn(
            "px-3 py-2 relative shadow-sm",
            getBubbleRadius(),
            isSender 
              ? "bg-[hsl(var(--accent))] text-accent-foreground" 
              : "bg-muted text-foreground"
          )}>
            <p className="text-[15px] leading-[1.35] whitespace-pre-wrap break-words">
              {message}
            </p>
            
            {/* Inline timestamp for sender with delivery status */}
            {isSender && isLastInGroup && (
              <span className="inline-flex items-center gap-0.5 float-right ml-2 mt-1">
                <span className="text-[10px] opacity-70">{timestamp}</span>
                {isRead !== undefined && (
                  isRead ? (
                    <CheckCheck className="w-3 h-3 text-blue-400" />
                  ) : (
                    <Check className="w-3 h-3 opacity-70" />
                  )
                )}
              </span>
            )}
          </div>

          {/* Delete option for received messages */}
          {!isSender && showOptions && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="z-50 bg-popover border border-border shadow-lg">
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }} 
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete for me
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Timestamp for receiver - only on last in group */}
        {!isSender && isLastInGroup && (
          <span className="text-[10px] text-muted-foreground mt-1 ml-3">
            {timestamp}
          </span>
        )}
      </div>
      
      {/* Spacer for sender messages */}
      {isSender && <div className="w-1" />}
    </div>
  );
};

export default ChatBubble;
