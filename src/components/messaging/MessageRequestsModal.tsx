import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Loader2, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MessageRequest {
  id: string;
  sender_id: string;
  created_at: string;
  sender?: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface MessageRequestsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: (senderId: string) => void;
}

const MessageRequestsModal = ({
  open,
  onOpenChange,
  onAccept,
}: MessageRequestsModalProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get my profile ID
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) return;

      // Fetch pending message requests
      const { data: requestData, error } = await supabase
        .from('message_requests')
        .select('id, sender_id, created_at')
        .eq('receiver_id', myProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (requestData && requestData.length > 0) {
        // Fetch sender profiles
        const senderIds = requestData.map(r => r.sender_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', senderIds);

        const enrichedRequests = requestData.map(req => ({
          ...req,
          sender: profiles?.find(p => p.id === req.sender_id),
        }));

        setRequests(enrichedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: MessageRequest) => {
    try {
      setProcessingId(request.id);

      await supabase
        .from('message_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', request.id);

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Request accepted!', {
        description: `You can now chat with ${request.sender?.full_name}`,
      });

      onAccept?.(request.sender_id);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (request: MessageRequest) => {
    try {
      setProcessingId(request.id);

      await supabase
        .from('message_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', request.id);

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Request declined');
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-accent" />
            Message Requests
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Inbox className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No message requests</p>
              <p className="text-xs">When someone sends you a request, it'll appear here</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {requests.map((request, i) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.sender?.avatar_url} />
                      <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                        {request.sender?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {request.sender?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{request.sender?.username} · {formatTime(request.created_at)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDecline(request)}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        onClick={() => handleAccept(request)}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MessageRequestsModal;
