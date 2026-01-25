import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage call notification sounds (ringtone for incoming, ringback for outgoing)
 */
export const useCallNotification = () => {
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringbackRef = useRef<HTMLAudioElement | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio elements
  useEffect(() => {
    // Create ringtone audio (for incoming calls)
    ringtoneRef.current = new Audio();
    ringtoneRef.current.loop = true;
    ringtoneRef.current.volume = 0.7;
    
    // Use a data URI for a simple ringtone (sine wave beeps)
    // This creates a "phone ringing" pattern using Web Audio API
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    const createRingtone = () => {
      const sampleRate = audioContext.sampleRate;
      const duration = 4; // 4 seconds loop
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Create a "ring ring... ring ring" pattern
      const ringFreq = 440; // A4 note
      const ringDuration = 0.4;
      const ringGap = 0.2;
      const pauseDuration = 1.5;
      
      let t = 0;
      const pattern = [ringDuration, ringGap, ringDuration, pauseDuration];
      let patternIndex = 0;
      
      for (let i = 0; i < data.length; i++) {
        const time = i / sampleRate;
        
        // Check pattern timing
        if (time >= t + pattern[patternIndex]) {
          t += pattern[patternIndex];
          patternIndex = (patternIndex + 1) % pattern.length;
        }
        
        // Generate sound during ring portions
        if (patternIndex === 0 || patternIndex === 2) {
          // Dual tone (like a phone)
          const tone1 = Math.sin(2 * Math.PI * ringFreq * time);
          const tone2 = Math.sin(2 * Math.PI * (ringFreq * 1.2) * time);
          data[i] = (tone1 + tone2) * 0.3;
        } else {
          data[i] = 0;
        }
      }
      
      return buffer;
    };

    // For simplicity and browser compatibility, we'll use the Web Audio API inline
    // when playing instead of pre-loading
    
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
      if (ringbackRef.current) {
        ringbackRef.current.pause();
        ringbackRef.current = null;
      }
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
      }
    };
  }, []);

  // Play ringtone using Web Audio API
  const playRingtone = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const playRingPattern = () => {
        if (!ringtoneRef.current) return;
        
        const now = audioContext.currentTime;
        const ringFreq1 = 440;
        const ringFreq2 = 480;
        
        // Create oscillators for dual-tone
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc1.frequency.value = ringFreq1;
        osc2.frequency.value = ringFreq2;
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        gainNode.gain.value = 0.2;
        
        // Ring pattern: 0.4s on, 0.2s off, 0.4s on, 2s off
        const envelope = [
          { time: 0, gain: 0.2 },
          { time: 0.4, gain: 0 },
          { time: 0.6, gain: 0.2 },
          { time: 1.0, gain: 0 },
        ];
        
        envelope.forEach(({ time, gain }) => {
          gainNode.gain.setValueAtTime(gain, now + time);
        });
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.0);
        osc2.stop(now + 1.0);
      };
      
      // Store the interval so we can stop it
      vibrationIntervalRef.current = setInterval(playRingPattern, 3000);
      playRingPattern(); // Play immediately
      
      // Vibrate on supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200, 2000]);
      }
    } catch (error) {
      console.warn('[CallNotification] Failed to play ringtone:', error);
    }
  }, []);

  // Stop ringtone
  const stopRingtone = useCallback(() => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  // Play ringback tone (for outgoing calls - what caller hears)
  const playRingback = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const playRingbackPattern = () => {
        const now = audioContext.currentTime;
        
        // US ringback tone: 440 + 480 Hz
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        // 2 seconds on, 4 seconds off
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.setValueAtTime(0, now + 2.0);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      };
      
      vibrationIntervalRef.current = setInterval(playRingbackPattern, 6000);
      playRingbackPattern();
    } catch (error) {
      console.warn('[CallNotification] Failed to play ringback:', error);
    }
  }, []);

  // Stop ringback
  const stopRingback = useCallback(() => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  }, []);

  // Play call end sound
  const playCallEnd = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      osc.frequency.value = 480;
      osc.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (error) {
      console.warn('[CallNotification] Failed to play call end:', error);
    }
  }, []);

  return {
    playRingtone,
    stopRingtone,
    playRingback,
    stopRingback,
    playCallEnd,
  };
};
