import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const hasEnumeratedRef = useRef(false);
  
  // Load saved settings from localStorage
  const [settings, setSettings] = useState<MediaDeviceSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      selectedCamera: '',
      selectedMicrophone: '',
      selectedSpeaker: '',
    };
  });

  // Enumerate devices WITHOUT requesting permission (labels may be empty)
  const enumerateDevicesOnly = useCallback(async () => {
    try {
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

      // Check if we have labels (indicates permission was already granted)
      const hasLabels = devices.some(d => d.label && d.label.length > 0);
      setHasPermission(hasLabels);

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
    }
  }, []);

  // Request permission and enumerate devices - ONLY call this when user initiates a call or opens settings
  const requestPermissionAndEnumerate = useCallback(async () => {
    if (hasPermission) {
      // Already have permission, just refresh the list
      await enumerateDevicesOnly();
      return true;
    }

    setLoading(true);
    try {
      // Request permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Stop tracks immediately - we just needed permission for labels
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      
      // Now enumerate to get full labels
      await enumerateDevicesOnly();
      return true;
    } catch (error) {
      console.error('Error requesting media permission:', error);
      // Still enumerate even without permission (labels will be generic)
      await enumerateDevicesOnly();
      return false;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, enumerateDevicesOnly]);

  // Listen for device changes (plugging in/out devices) - no permission request
  useEffect(() => {
    // Initial enumeration without permission request
    if (!hasEnumeratedRef.current) {
      hasEnumeratedRef.current = true;
      enumerateDevicesOnly();
    }

    const handleDeviceChange = () => {
      enumerateDevicesOnly();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateDevicesOnly]);

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
        : { width: 640, height: 480 };
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
    hasPermission,
    selectedCamera: settings.selectedCamera,
    selectedMicrophone: settings.selectedMicrophone,
    selectedSpeaker: settings.selectedSpeaker,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
    getMediaConstraints,
    refreshDevices: enumerateDevicesOnly,
    requestPermissionAndEnumerate,
  };
};
