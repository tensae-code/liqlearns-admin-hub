import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  X,
  Music
} from 'lucide-react';

interface AudioResourceProps {
  title: string;
  audioUrl?: string;
  onComplete: () => void;
  onClose: () => void;
}

const AudioResource = ({ title, audioUrl, onComplete, onClose }: AudioResourceProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // Demo: 2 minutes
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Demo: Simulate audio progress
  useEffect(() => {
    if (isPlaying && !audioUrl) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, audioUrl, duration]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
    }
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.volume = value[0];
    }
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Audio waveform bars for visualization
  const bars = 40;
  const generateBars = () => {
    return Array.from({ length: bars }, (_, i) => {
      const height = isPlaying 
        ? Math.random() * 80 + 20 
        : 30 + Math.sin(i * 0.3) * 20;
      return height;
    });
  };

  const [barHeights, setBarHeights] = useState(generateBars());

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setBarHeights(generateBars());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full overflow-hidden"
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => {
            setIsPlaying(false);
            onComplete();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎧</span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Visualizer */}
      <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-8">
        <div className="flex items-end justify-center gap-1 h-24">
          {barHeights.map((height, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-gradient-to-t from-accent to-primary rounded-full"
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-center mt-4">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
            <Music className="w-10 h-10 text-accent" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground min-w-[40px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => skip(-10)}>
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="w-14 h-14 rounded-full bg-gradient-accent"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => skip(10)}>
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleMute}>
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-32"
          />
        </div>

        {/* Complete Button */}
        <div className="pt-2 border-t border-border">
          <Button 
            onClick={onComplete}
            className="w-full bg-gradient-accent"
            disabled={currentTime < duration * 0.5}
          >
            {currentTime >= duration * 0.5 ? 'Mark Complete' : `Listen to ${Math.round(50 - progress)}% more`}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AudioResource;
