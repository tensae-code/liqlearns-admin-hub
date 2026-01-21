import { useState, useEffect, useCallback } from 'react';

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

export interface MediaDeviceSettings {
  selectedCamera: string;
  selectedMicrophone: string;
  selectedSpeaker: string;
}

const STORAGE_KEY = 'mediaDeviceSettings';

export const useMediaDevices = () => {
  const [cameras, setCameras] = useState<MediaDevice[]>([]);
  const [microphones, setMicrophones] = useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = useState<MediaDevice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load saved settings from localStorage
  const [settings, setSettings] = useState<MediaDeviceSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      selectedCamera: '',
      selectedMicrophone: '',
      selectedSpeaker: '',
    };
  });

  // Request permission and enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      // Request permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          // Stop tracks immediately - we just needed permission
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {
          // User denied permission, we can still enumerate but labels will be empty
        });

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 4)}`,
          kind: 'videoinput' as const,
        }));
      
      const audioInputs = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 4)}`,
          kind: 'audioinput' as const,
        }));
      
      const audioOutputs = devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 4)}`,
          kind: 'audiooutput' as const,
        }));

      setCameras(videoInputs);
      setMicrophones(audioInputs);
      setSpeakers(audioOutputs);

      // Set defaults if not already set
      setSettings(prev => {
        const updated = { ...prev };
        if (!prev.selectedCamera && videoInputs.length > 0) {
          updated.selectedCamera = videoInputs[0].deviceId;
        }
        if (!prev.selectedMicrophone && audioInputs.length > 0) {
          updated.selectedMicrophone = audioInputs[0].deviceId;
        }
        if (!prev.selectedSpeaker && audioOutputs.length > 0) {
          updated.selectedSpeaker = audioOutputs[0].deviceId;
        }
        return updated;
      });
    } catch (error) {
      console.error('Error enumerating devices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for device changes (plugging in/out devices)
  useEffect(() => {
    enumerateDevices();

    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateDevices]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSelectedCamera = useCallback((deviceId: string) => {
    setSettings(prev => ({ ...prev, selectedCamera: deviceId }));
  }, []);

  const setSelectedMicrophone = useCallback((deviceId: string) => {
    setSettings(prev => ({ ...prev, selectedMicrophone: deviceId }));
  }, []);

  const setSelectedSpeaker = useCallback((deviceId: string) => {
    setSettings(prev => ({ ...prev, selectedSpeaker: deviceId }));
  }, []);

  // Get constraints for getUserMedia with selected devices
  const getMediaConstraints = useCallback((video: boolean = true, audio: boolean = true) => {
    const constraints: MediaStreamConstraints = {};
    
    if (video) {
      constraints.video = settings.selectedCamera 
        ? { deviceId: { exact: settings.selectedCamera }, width: 640, height: 480 }
        : { width: 640, height: 480, facingMode: 'user' };
    }
    
    if (audio) {
      constraints.audio = settings.selectedMicrophone
        ? { deviceId: { exact: settings.selectedMicrophone } }
        : true;
    }
    
    return constraints;
  }, [settings.selectedCamera, settings.selectedMicrophone]);

  return {
    cameras,
    microphones,
    speakers,
    loading,
    selectedCamera: settings.selectedCamera,
    selectedMicrophone: settings.selectedMicrophone,
    selectedSpeaker: settings.selectedSpeaker,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
    getMediaConstraints,
    refreshDevices: enumerateDevices,
  };
};
