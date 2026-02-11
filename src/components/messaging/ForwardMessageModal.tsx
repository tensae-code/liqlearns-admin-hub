import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Forward, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Conversation } from './ConversationList';
import { toast } from 'sonner';

interface ForwardMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageContent: string;
  conversations: Conversation[];
  onForward: (conversationId: string, content: string) => Promise<void>;
}

const ForwardMessageModal = ({
  open,
  onOpenChange,
  messageContent,
  conversations,
  onForward,
}: ForwardMessageModalProps) => {
  const [search, setSearch] = useState('');
  const [forwarding, setForwarding] = useState<string | null>(null);

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleForward = async (conv: Conversation) => {
    setForwarding(conv.id);
    try {
      await onForward(conv.id, `↪ Forwarded:\n${messageContent}`);
      toast.success(`Forwarded to ${conv.name}`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to forward message');
    } finally {
      setForwarding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="w-5 h-5 text-accent" />
            Forward Message
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-muted/30 rounded-lg p-2 mb-2 text-xs text-muted-foreground truncate">
          "{messageContent.substring(0, 100)}{messageContent.length > 100 ? '...' : ''}"
        </div>

        <ScrollArea className="h-[250px]">
          <div className="space-y-1">
            {filtered.map((conv, i) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 w-full text-left transition-colors"
                onClick={() => handleForward(conv)}
                disabled={forwarding === conv.id}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={conv.avatar} />
                  <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
                    {conv.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium truncate">{conv.name}</span>
                {forwarding === conv.id && <Loader2 className="w-4 h-4 animate-spin" />}
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageModal;
