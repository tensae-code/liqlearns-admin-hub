import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Trash2, MoreVertical, Reply, Pin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SwipeableChatBubbleProps {
  message: string;
  sender: {
    id?: string;
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
  onReply?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  isPinned?: boolean;
  messageId?: string;
  replyTo?: {
    content: string;
    senderName: string;
  };
  highlightId?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

const SwipeableChatBubble = ({ 
  message, 
  sender, 
  timestamp, 
  isSender, 
  showAvatar = true,
  isRead,
  isFirstInGroup = true,
  isLastInGroup = true,
  onDelete,
  onReply,
  onPin,
  onUnpin,
  isPinned = false,
  messageId,
  replyTo,
  highlightId,
}: SwipeableChatBubbleProps) => {
  const isHighlighted = highlightId === messageId;
  const [showOptions, setShowOptions] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const replyOpacity = useTransform(x, [-60, -30, 0], [1, 0.5, 0]);
  const constraintRef = useRef(null);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -50 && onReply) {
      onReply();
    }
    // Always snap back to original position
    await controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
  };

  // Determine message status
  const getMessageStatus = (): MessageStatus => {
    if (isRead === true) return 'read';
    if (isRead === false) return 'delivered';
    return 'sent';
  };

  const status = getMessageStatus();

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

  // Status icon and color
  const renderStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 border-2 border-muted-foreground/50 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground/70" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground/70" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary" />;
    }
  };

  return (
    <motion.div 
      ref={constraintRef}
      id={`message-${messageId}`}
      initial={false}
      animate={{
        backgroundColor: isHighlighted ? 'hsl(var(--accent) / 0.2)' : 'transparent',
      }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex gap-2 group relative rounded-lg -mx-1 px-1",
        isSender ? "flex-row-reverse" : "flex-row",
        isLastInGroup ? "mb-3" : "mb-0.5"
      )}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Reply indicator */}
      <motion.div 
        style={{ opacity: replyOpacity }}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center justify-center",
          isSender ? "left-0" : "right-0"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <Reply className="w-4 h-4 text-accent" />
        </div>
      </motion.div>

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
      
      <motion.div 
        drag="x"
        dragConstraints={{ left: -60, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className={cn(
          "max-w-[75%] flex flex-col relative touch-pan-y",
          isSender ? "items-end" : "items-start"
        )}
      >
        {/* Sender name - only show on first message in group for non-senders */}
        {!isSender && isFirstInGroup && (
          <span className="text-[11px] text-muted-foreground mb-1 ml-3 font-medium">
            {sender.name}
          </span>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className={cn(
            "px-3 py-1.5 rounded-t-lg mb-0.5 text-xs border-l-2",
            isSender 
              ? "bg-[hsl(var(--accent))]/50 border-accent-foreground/50" 
              : "bg-muted/70 border-primary"
          )}>
            <p className="font-medium text-[10px] opacity-70">{replyTo.senderName}</p>
            <p className="truncate opacity-80">{replyTo.content}</p>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          {/* Delete option for sender messages */}
          {isSender && showOptions && (onDelete || onPin || onUnpin) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button"
                  className="h-6 w-6 opacity-60 hover:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-accent"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-popover border border-border shadow-lg">
                {onReply && (
                  <DropdownMenuItem onClick={onReply} className="cursor-pointer">
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                {isPinned ? (
                  onUnpin && (
                    <DropdownMenuItem onClick={onUnpin} className="cursor-pointer">
                      <Pin className="w-4 h-4 mr-2" />
                      Unpin
                    </DropdownMenuItem>
                  )
                ) : (
                  onPin && (
                    <DropdownMenuItem onClick={onPin} className="cursor-pointer">
                      <Pin className="w-4 h-4 mr-2" />
                      Pin message
                    </DropdownMenuItem>
                  )
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete()}
                      className="text-destructive cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete message
                    </DropdownMenuItem>
                  </>
                )}
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
                {renderStatusIcon()}
              </span>
            )}
          </div>

          {/* Delete option for received messages */}
          {!isSender && showOptions && (onDelete || onReply || onPin || onUnpin) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button"
                  className="h-6 w-6 opacity-60 hover:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-accent"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="z-50 bg-popover border border-border shadow-lg">
                {onReply && (
                  <DropdownMenuItem onClick={onReply} className="cursor-pointer">
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                {isPinned ? (
                  onUnpin && (
                    <DropdownMenuItem onClick={onUnpin} className="cursor-pointer">
                      <Pin className="w-4 h-4 mr-2" />
                      Unpin
                    </DropdownMenuItem>
                  )
                ) : (
                  onPin && (
                    <DropdownMenuItem onClick={onPin} className="cursor-pointer">
                      <Pin className="w-4 h-4 mr-2" />
                      Pin message
                    </DropdownMenuItem>
                  )
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete()}
                      className="text-destructive cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete for me
                    </DropdownMenuItem>
                  </>
                )}
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
      </motion.div>
      
      {/* Spacer for sender messages */}
      {isSender && <div className="w-1" />}
    </motion.div>
  );
};

export default SwipeableChatBubble;
