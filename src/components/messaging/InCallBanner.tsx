import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, UserPlus, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptionalLiveKitContext } from '@/contexts/LiveKitContext';

const InCallBanner = () => {
  const liveKitContext = useOptionalLiveKitContext();
  const [elapsed, setElapsed] = useState(0);

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

  if (!isInCall || !liveKitContext) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const participantCount = (liveKitContext.remoteParticipants?.length ?? 0) + 1;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-success/15 border-b border-success/30 px-3 py-1.5 flex items-center justify-between gap-2"
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
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => liveKitContext.endCall?.()}
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default InCallBanner;
