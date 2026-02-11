import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, UserPlus, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptionalLiveKitContext } from '@/contexts/LiveKitContext';
import NewDMModal, { UserSearchResult } from '@/components/messaging/NewDMModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useIncomingCallSubscription } from '@/hooks/useIncomingCallSubscription';
import { toast } from 'sonner';

const InCallBanner = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const liveKitContext = useOptionalLiveKitContext();
  const [elapsed, setElapsed] = useState(0);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [searchUsers, setSearchUsers] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { sendCallInvite } = useIncomingCallSubscription({
    onIncomingCall: () => {},
    onCallCancelled: () => {},
  });

  const isInCall = liveKitContext?.callState?.status === 'connected';
  const startTime = liveKitContext?.callState?.startTime;

  useEffect(() => {
    if (!isInCall || !startTime) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isInCall, startTime]);

  const handleSearchUsers = async (query: string) => {
    if (!query.trim() || !user) { setSearchUsers([]); return; }
    setSearchLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('user_id', user.id)
        .limit(20);
      setSearchUsers((profiles || []).map(p => ({
        id: p.user_id,
        name: p.full_name,
        username: p.username,
        avatar: p.avatar_url,
        isFriend: false,
      })));
    } catch { /* ignore */ } finally { setSearchLoading(false); }
  };

  const handleAddPerson = async (selectedUser: UserSearchResult) => {
    if (!profile || !liveKitContext?.callState) return;
    const contextId = liveKitContext.callState.contextId || `call-${Date.now()}`;
    // Look up the invitee's profile.id from their user_id
    const { data: inviteeProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', selectedUser.id)
      .maybeSingle();
    if (!inviteeProfile) {
      toast.error('User not found');
      return;
    }
    await sendCallInvite(
      inviteeProfile.id, // invitee's profile.id
      null,
      contextId,
      liveKitContext.callState.callType === 'video' ? 'video' : 'voice',
      profile.full_name,
      profile.avatar_url || null,
      'call',
      contextId
    );
    toast.success(`Calling ${selectedUser.name}...`);
    setShowAddPerson(false);
    setSearchUsers([]);
  };

  if (!isInCall || !liveKitContext) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const participantCount = (liveKitContext.remoteParticipants?.length ?? 0) + 1;

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-success/15 backdrop-blur-sm border-b border-success/30 px-3 py-1.5 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 text-success">
          <Phone className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-xs font-medium">{timeStr}</span>
          <span className="text-[10px] text-success/70">· {participantCount} in call</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-foreground hover:text-foreground"
            onClick={() => liveKitContext.toggleMute?.()}
          >
            {liveKitContext.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-foreground hover:text-foreground"
            onClick={() => liveKitContext.toggleVideo?.()}
          >
            {liveKitContext.isVideoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-accent hover:text-accent"
            title="Add person to call"
            onClick={() => setShowAddPerson(true)}
          >
            <UserPlus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => liveKitContext.endCall?.()}
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>

      <NewDMModal
        open={showAddPerson}
        onOpenChange={setShowAddPerson}
        users={searchUsers}
        onSelectUser={handleAddPerson}
        onSearch={handleSearchUsers}
        isLoading={searchLoading}
      />
    </>
  );
};

export default InCallBanner;
