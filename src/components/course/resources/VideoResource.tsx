import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
  X
} from 'lucide-react';

interface VideoResourceProps {
  title: string;
  videoUrl?: string;
  onComplete: () => void;
  onClose: () => void;
}

// Helper to extract YouTube video ID
const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const VideoResource = ({ title, videoUrl, onComplete, onClose }: VideoResourceProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasWatched80Percent, setHasWatched80Percent] = useState(false);

  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Check if watched 80%
      if (!hasWatched80Percent && videoRef.current.currentTime / videoRef.current.duration >= 0.8) {
        setHasWatched80Percent(true);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onComplete();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border shadow-xl max-w-3xl w-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Video Area */}
      <div className="relative aspect-video bg-black">
        {videoUrl && isYouTubeUrl(videoUrl) ? (
          // YouTube embed
          <iframe
            src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=0&rel=0`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        ) : videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnd}
            onClick={togglePlay}
          />
        ) : (
          // Demo video placeholder
          <div 
            className="w-full h-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-accent/20 to-primary/20"
            onClick={togglePlay}
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: isPlaying ? Infinity : 0, duration: 1 }}
                className="w-24 h-24 mx-auto bg-accent/20 rounded-full flex items-center justify-center mb-4"
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-accent" />
                ) : (
                  <Play className="w-12 h-12 text-accent ml-2" />
                )}
              </motion.div>
              <p className="text-foreground font-medium">Demo Video Content</p>
              <p className="text-sm text-muted-foreground mt-1">Click to {isPlaying ? 'pause' : 'play'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground min-w-[40px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => skip(-10)}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-12 h-12"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(10)}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
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
              className="w-24"
            />
          </div>
        </div>

        {/* Completion Status */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            {isYouTube ? (
              <span className="text-sm text-muted-foreground">
                YouTube video - click complete when done
              </span>
            ) : (
              <>
                <Progress value={progress} className="w-32 h-2" />
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% watched
                </span>
              </>
            )}
          </div>
          <Button 
            onClick={onComplete}
            disabled={!isYouTube && !hasWatched80Percent && videoUrl !== undefined}
            className="bg-gradient-accent"
          >
            {isYouTube || hasWatched80Percent || !videoUrl ? 'Mark Complete' : 'Watch 80% to complete'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoResource;
