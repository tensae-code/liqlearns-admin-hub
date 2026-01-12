import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface VideoState {
  isVideoOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
}

export const useVideoChat = () => {
  const { toast } = useToast();
  const [videoState, setVideoState] = useState<VideoState>({
    isVideoOn: false,
    isMicOn: false,
    isScreenSharing: false,
    localStream: null,
    screenStream: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });

      setVideoState(prev => ({
        ...prev,
        isVideoOn: true,
        isMicOn: true,
        localStream: stream,
      }));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      toast({ title: 'Camera Started', description: 'Your camera is now active' });
      return stream;
    } catch (error: any) {
      console.error('Error starting camera:', error);
      toast({ 
        title: 'Camera Error', 
        description: error.message || 'Could not access camera', 
        variant: 'destructive' 
      });
      return null;
    }
  }, [toast]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoState.localStream) {
      videoState.localStream.getTracks().forEach(track => track.stop());
    }
    setVideoState(prev => ({
      ...prev,
      isVideoOn: false,
      localStream: null,
    }));
    toast({ title: 'Camera Stopped' });
  }, [videoState.localStream, toast]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (videoState.isVideoOn) {
      stopCamera();
    } else {
      await startCamera();
    }
  }, [videoState.isVideoOn, startCamera, stopCamera]);

  // Toggle mic
  const toggleMic = useCallback(() => {
    if (videoState.localStream) {
      const audioTrack = videoState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setVideoState(prev => ({
          ...prev,
          isMicOn: audioTrack.enabled,
        }));
      }
    } else {
      setVideoState(prev => ({
        ...prev,
        isMicOn: !prev.isMicOn,
      }));
    }
  }, [videoState.localStream]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: false,
      });

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setVideoState(prev => ({
        ...prev,
        isScreenSharing: true,
        screenStream: stream,
      }));

      if (screenRef.current) {
        screenRef.current.srcObject = stream;
      }

      toast({ title: 'Screen Sharing Started' });
      return stream;
    } catch (error: any) {
      console.error('Error starting screen share:', error);
      if (error.name !== 'NotAllowedError') {
        toast({ 
          title: 'Screen Share Error', 
          description: error.message || 'Could not share screen', 
          variant: 'destructive' 
        });
      }
      return null;
    }
  }, [toast]);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    if (videoState.screenStream) {
      videoState.screenStream.getTracks().forEach(track => track.stop());
    }
    setVideoState(prev => ({
      ...prev,
      isScreenSharing: false,
      screenStream: null,
    }));
    toast({ title: 'Screen Sharing Stopped' });
  }, [videoState.screenStream, toast]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (videoState.isScreenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [videoState.isScreenSharing, startScreenShare, stopScreenShare]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoState.localStream) {
        videoState.localStream.getTracks().forEach(track => track.stop());
      }
      if (videoState.screenStream) {
        videoState.screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    ...videoState,
    videoRef,
    screenRef,
    startCamera,
    stopCamera,
    toggleVideo,
    toggleMic,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
  };
};
