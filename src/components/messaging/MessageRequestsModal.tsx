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
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, Inbox, MessageSquare, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UnifiedRequest {
  id: string;
  sender_id: string;
  created_at: string;
  type: 'message' | 'friend';
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
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchRequests();
  }, [open]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!myProfile) return;

      // Get existing DM partner IDs (people we're already chatting with)
      const { data: existingDMs } = await supabase
        .from('direct_messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .limit(200);

      const existingPartnerUserIds = new Set<string>();
      (existingDMs || []).forEach(dm => {
        if (dm.sender_id === user.id) existingPartnerUserIds.add(dm.receiver_id);
        else existingPartnerUserIds.add(dm.sender_id);
      });

      // Also get existing friend user IDs (accepted friendships)
      const { data: acceptedFriends } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendUserIds = new Set<string>();
      (acceptedFriends || []).forEach(f => {
        if (f.requester_id === user.id) friendUserIds.add(f.addressee_id);
        else friendUserIds.add(f.requester_id);
      });

      // Fetch message requests
      const { data: msgRequests } = await supabase
        .from('message_requests')
        .select('id, sender_id, created_at')
        .eq('receiver_id', myProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch friend requests (where I'm addressee)
      const { data: friendRequests } = await supabase
        .from('friendships')
        .select('id, requester_id, created_at')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Collect all sender IDs (message requests use profile.id, friend requests use user_id)
      const msgSenderIds = msgRequests?.map(r => r.sender_id) || [];
      const friendSenderIds = friendRequests?.map(r => r.requester_id) || [];

      let profiles: any[] = [];
      if (msgSenderIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, username, avatar_url')
          .in('id', msgSenderIds);
        profiles = data || [];
      }

      // For friend requests, look up by user_id 
      let friendProfiles: any[] = [];
      if (friendSenderIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, username, avatar_url')
          .in('user_id', friendSenderIds);
        friendProfiles = data || [];
      }

      // Filter out requests from people we already have conversations with or are friends with
      const filteredMsgRequests = (msgRequests || []).filter(r => {
        // Look up the user_id for this profile sender
        const senderProfile = profiles.find(p => p.id === r.sender_id);
        if (!senderProfile) return true; // keep if we can't determine
        return !existingPartnerUserIds.has(senderProfile.user_id) && !friendUserIds.has(senderProfile.user_id);
      });

      const filteredFriendRequests = (friendRequests || []).filter(r => {
        return !existingPartnerUserIds.has(r.requester_id) && !friendUserIds.has(r.requester_id);
      });

      const unified: UnifiedRequest[] = [
        ...filteredMsgRequests.map(r => ({
          id: r.id,
          sender_id: r.sender_id,
          created_at: r.created_at,
          type: 'message' as const,
          sender: profiles.find(p => p.id === r.sender_id),
        })),
        ...filteredFriendRequests.map(r => ({
          id: r.id,
          sender_id: r.requester_id,
          created_at: r.created_at,
          type: 'friend' as const,
          sender: friendProfiles.find(p => p.user_id === r.requester_id),
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRequests(unified);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: UnifiedRequest) => {
    try {
      setProcessingId(request.id);

      if (request.type === 'message') {
        await supabase
          .from('message_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', request.id);
        toast.success('Message request accepted!');
      } else {
        await supabase
          .from('friendships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', request.id);
        toast.success('Friend request accepted!');
      }

      setRequests(prev => prev.filter(r => r.id !== request.id));
      onAccept?.(request.sender_id);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (request: UnifiedRequest) => {
    try {
      setProcessingId(request.id);

      if (request.type === 'message') {
        await supabase
          .from('message_requests')
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', request.id);
      } else {
        // Delete the friendship record rather than setting invalid status
        await supabase
          .from('friendships')
          .delete()
          .eq('id', request.id);
      }

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
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-accent" />
            Requests
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
              <p className="text-sm">No requests</p>
              <p className="text-xs">Message and friend requests will appear here</p>
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
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">
                          {request.sender?.full_name || 'Unknown'}
                        </p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                          {request.type === 'friend' ? (
                            <><UserPlus className="w-2.5 h-2.5 mr-0.5" />Friend</>
                          ) : (
                            <><MessageSquare className="w-2.5 h-2.5 mr-0.5" />Message</>
                          )}
                        </Badge>
                      </div>
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
