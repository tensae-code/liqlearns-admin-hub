import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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
}

const ChatBubble = ({ 
  message, 
  sender, 
  timestamp, 
  isSender, 
  showAvatar = true,
  isRead 
}: ChatBubbleProps) => {
  return (
    <div className={cn(
      "flex gap-2 mb-2",
      isSender ? "flex-row-reverse" : "flex-row"
    )}>
      {showAvatar && !isSender && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={sender.avatar} />
          <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
            {sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {showAvatar && isSender && <div className="w-8" />}
      
      <div className={cn(
        "max-w-[75%] flex flex-col",
        isSender ? "items-end" : "items-start"
      )}>
        {!isSender && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1 px-3">{sender.name}</span>
        )}
        <div className={cn(
          "px-4 py-2 rounded-2xl relative",
          isSender 
            ? "bg-gradient-accent text-accent-foreground rounded-br-md" 
            : "bg-muted text-foreground rounded-bl-md"
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1 mt-1 px-3",
          isSender ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[10px] text-muted-foreground">{timestamp}</span>
          {isSender && isRead !== undefined && (
            <span className="text-[10px] text-muted-foreground">
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
