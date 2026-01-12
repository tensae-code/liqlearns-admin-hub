import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

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
}: ChatBubbleProps) => {
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

  return (
    <div className={cn(
      "flex gap-2",
      isSender ? "flex-row-reverse" : "flex-row",
      isLastInGroup ? "mb-3" : "mb-0.5"
    )}>
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
        "max-w-[75%] flex flex-col",
        isSender ? "items-end" : "items-start"
      )}>
        {/* Sender name - only show on first message in group for non-senders */}
        {!isSender && isFirstInGroup && (
          <span className="text-[11px] text-muted-foreground mb-1 ml-3 font-medium">
            {sender.name}
          </span>
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
          
          {/* Inline timestamp for sender */}
          {isSender && isLastInGroup && (
            <span className="inline-flex items-center gap-0.5 float-right ml-2 mt-1">
              <span className="text-[10px] opacity-70">{timestamp}</span>
              {isRead !== undefined && (
                isRead ? (
                  <CheckCheck className="w-3 h-3 opacity-70" />
                ) : (
                  <Check className="w-3 h-3 opacity-70" />
                )
              )}
            </span>
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
