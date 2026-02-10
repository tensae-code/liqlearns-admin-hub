import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Mic, Square, Send, RotateCcw, Play, Pause, Video } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface RecordingPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const RecordingPlayer = ({ config, onComplete }: RecordingPlayerProps) => {
  const prompt = config.prompt || 'Record your response';
  const recordingType = config.recordingType || 'audio';
  const maxDuration = config.maxDuration || 60;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const startRecording = async () => {
    try {
      const constraints = recordingType === 'video'
        ? { audio: true, video: true }
        : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recordingType === 'video' ? 'video/webm' : 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete?.(1, 1);
  };

  const reset = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setSubmitted(false);
    setElapsed(0);
    setIsRecording(false);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="p-4 bg-card border border-border rounded-xl">
        <p className="text-sm text-foreground">{prompt}</p>
        <p className="text-xs text-muted-foreground mt-1">Max duration: {formatTime(maxDuration)}</p>
      </div>

      {/* Recording UI */}
      <div className="text-center space-y-3">
        {!recordedUrl && !submitted && (
          <>
            <motion.div
              className={cn(
                'w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all',
                isRecording
                  ? 'bg-destructive/20 border-2 border-destructive'
                  : 'bg-primary/10 border-2 border-primary'
              )}
              animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {recordingType === 'video' ? (
                <Video className={cn('w-8 h-8', isRecording ? 'text-destructive' : 'text-primary')} />
              ) : (
                <Mic className={cn('w-8 h-8', isRecording ? 'text-destructive' : 'text-primary')} />
              )}
            </motion.div>

            <p className="text-lg font-bold text-foreground">{formatTime(elapsed)}</p>

            <div className="flex gap-2 justify-center">
              {!isRecording ? (
                <Button onClick={startRecording}>
                  <Mic className="w-4 h-4 mr-1" /> Start Recording
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopRecording}>
                  <Square className="w-4 h-4 mr-1" /> Stop
                </Button>
              )}
            </div>
          </>
        )}

        {recordedUrl && !submitted && (
          <div className="space-y-3">
            {recordingType === 'video' ? (
              <video src={recordedUrl} controls className="w-full max-w-sm mx-auto rounded-xl border border-border" />
            ) : (
              <audio src={recordedUrl} controls className="w-full max-w-sm mx-auto" />
            )}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-1" /> Re-record
              </Button>
              <Button onClick={handleSubmit}>
                <Send className="w-4 h-4 mr-1" /> Submit
              </Button>
            </div>
          </div>
        )}

        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-success/10 border border-success/30 rounded-xl"
          >
            <p className="font-bold text-foreground">Recording submitted! ✅</p>
            <p className="text-sm text-muted-foreground mt-1">Your teacher will review it</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RecordingPlayer;
