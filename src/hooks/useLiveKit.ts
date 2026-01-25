import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  Track,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  RemoteTrackPublication,
  LocalTrackPublication,
  TrackPublication,
  VideoPresets,
  createLocalTracks,
  LocalVideoTrack,
  LocalAudioTrack,
} from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { RoomContext, ParticipantRole } from '@/lib/livekit';
import { getDefaultRole } from '@/lib/livekit';

export interface LiveKitParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  role: ParticipantRole;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  audioTrack?: Track;
  videoTrack?: Track;
  screenTrack?: Track;
}

export interface UseLiveKitReturn {
  // Connection state
  isConnecting: boolean;
  isConnected: boolean;
  connectionState: ConnectionState;
  error: string | null;
  
  // Room info
  roomName: string | null;
  
  // Participants
  localParticipant: LiveKitParticipant | null;
  remoteParticipants: LiveKitParticipant[];
  activeSpeaker: LiveKitParticipant | null;
  
  // Local media state
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  
  // Actions
  connect: (roomName: string, contextType: RoomContext, contextId: string, role?: ParticipantRole) => Promise<boolean>;
  disconnect: () => void;
  toggleMute: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  setRole: (role: ParticipantRole) => void;
  
  // Room reference for advanced usage
  room: Room | null;
  
  // Video element refs
  attachVideoToElement: (participantId: string, element: HTMLVideoElement | null, trackType?: 'camera' | 'screen') => void;
  attachLocalVideoToElement: (element: HTMLVideoElement | null) => void;
}

export const useLiveKit = (): UseLiveKitReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  
  const [localParticipant, setLocalParticipant] = useState<LiveKitParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<LiveKitParticipant[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<LiveKitParticipant | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const [currentRole, setCurrentRole] = useState<ParticipantRole>('listener');
  
  const roomRef = useRef<Room | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);

  // Convert LiveKit participant to our format
  const participantToState = useCallback((participant: Participant, role: ParticipantRole = 'listener'): LiveKitParticipant => {
    const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
    
    let videoTrack: Track | undefined;
    let audioTrack: Track | undefined;
    let screenTrack: Track | undefined;
    
    participant.trackPublications.forEach((pub: TrackPublication) => {
      if (pub.track) {
        if (pub.source === Track.Source.Camera) {
          videoTrack = pub.track;
        } else if (pub.source === Track.Source.Microphone) {
          audioTrack = pub.track;
        } else if (pub.source === Track.Source.ScreenShare) {
          screenTrack = pub.track;
        }
      }
    });
    
    return {
      id: participant.identity,
      name: participant.name || 'Anonymous',
      avatarUrl: metadata.avatarUrl,
      role: metadata.role || role,
      isMuted: !audioTrack || audioTrack.isMuted,
      isVideoOn: !!videoTrack && !videoTrack.isMuted,
      isScreenSharing: !!screenTrack,
      isHandRaised: metadata.isHandRaised || false,
      isSpeaking: participant.isSpeaking,
      audioTrack,
      videoTrack,
      screenTrack,
    };
  }, []);

  // Update participants state
  const updateParticipants = useCallback(() => {
    const currentRoom = roomRef.current;
    if (!currentRoom) return;
    
    // Update local participant
    if (currentRoom.localParticipant) {
      setLocalParticipant(participantToState(currentRoom.localParticipant, currentRole));
    }
    
    // Update remote participants
    const remotes: LiveKitParticipant[] = [];
    currentRoom.remoteParticipants.forEach((participant: RemoteParticipant) => {
      remotes.push(participantToState(participant));
    });
    setRemoteParticipants(remotes);
  }, [participantToState, currentRole]);

  // Connect to room
  const connect = useCallback(async (
    roomNameToJoin: string,
    contextType: RoomContext,
    contextId: string,
    role?: ParticipantRole
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsConnecting(true);
    setError(null);
    
    const effectiveRole = role || getDefaultRole(contextType);
    setCurrentRole(effectiveRole);

    try {
      // Get token from edge function
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('No auth session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            roomName: roomNameToJoin,
            contextType,
            contextId,
            role: effectiveRole,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get token');
      }

      const { token, url } = await response.json();

      // Create and connect room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });

      roomRef.current = newRoom;
      setRoom(newRoom);
      setRoomName(roomNameToJoin);

      // Set up event listeners
      newRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setConnectionState(state);
        if (state === ConnectionState.Disconnected) {
          setRoom(null);
          setRoomName(null);
        }
      });

      newRoom.on(RoomEvent.ParticipantConnected, () => {
        updateParticipants();
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        updateParticipants();
      });

      newRoom.on(RoomEvent.TrackSubscribed, () => {
        updateParticipants();
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, () => {
        updateParticipants();
      });

      newRoom.on(RoomEvent.TrackMuted, () => {
        updateParticipants();
      });

      newRoom.on(RoomEvent.TrackUnmuted, () => {
        updateParticipants();
      });

      newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        if (speakers.length > 0) {
          setActiveSpeaker(participantToState(speakers[0]));
        } else {
          setActiveSpeaker(null);
        }
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setRoom(null);
        setRoomName(null);
        roomRef.current = null;
        setLocalParticipant(null);
        setRemoteParticipants([]);
      });

      // Connect to room
      await newRoom.connect(url, token);
      
      // Enable microphone by default for calls (speaker role)
      if (effectiveRole === 'speaker' || effectiveRole === 'host' || effectiveRole === 'moderator') {
        try {
          await newRoom.localParticipant.setMicrophoneEnabled(true);
          setIsMuted(false);
          console.log('[LiveKit] Microphone enabled');
        } catch (micError) {
          console.error('[LiveKit] Failed to enable microphone:', micError);
        }
      }
      
      updateParticipants();
      setIsConnecting(false);
      
      toast({ 
        title: 'Connected', 
        description: 'You have joined the call' 
      });
      
      return true;
    } catch (err) {
      console.error('[LiveKit] Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
      
      toast({
        title: 'Connection Failed',
        description: err instanceof Error ? err.message : 'Could not join the call',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [user, updateParticipants, participantToState, toast]);

  // Disconnect from room
  const disconnect = useCallback(() => {
    const currentRoom = roomRef.current;
    if (currentRoom) {
      currentRoom.disconnect();
    }
    
    // Stop local tracks
    localVideoTrackRef.current?.stop();
    localAudioTrackRef.current?.stop();
    localVideoTrackRef.current = null;
    localAudioTrackRef.current = null;
    
    setRoom(null);
    setRoomName(null);
    roomRef.current = null;
    setLocalParticipant(null);
    setRemoteParticipants([]);
    setIsMuted(false);
    setIsVideoOn(false);
    setIsScreenSharing(false);
    setConnectionState(ConnectionState.Disconnected);
    
    toast({ title: 'Disconnected', description: 'You have left the call' });
  }, [toast]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom?.localParticipant) return;

    const enabled = currentRoom.localParticipant.isMicrophoneEnabled;
    
    await currentRoom.localParticipant.setMicrophoneEnabled(!enabled);
    setIsMuted(enabled);
    updateParticipants();
  }, [updateParticipants]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom?.localParticipant) return;

    const enabled = currentRoom.localParticipant.isCameraEnabled;
    
    await currentRoom.localParticipant.setCameraEnabled(!enabled);
    setIsVideoOn(!enabled);
    updateParticipants();
  }, [updateParticipants]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom?.localParticipant) return;

    const enabled = currentRoom.localParticipant.isScreenShareEnabled;
    
    await currentRoom.localParticipant.setScreenShareEnabled(!enabled);
    setIsScreenSharing(!enabled);
    updateParticipants();
  }, [updateParticipants]);

  // Set role (for host to change participant roles)
  const setRole = useCallback((role: ParticipantRole) => {
    setCurrentRole(role);
    // In a full implementation, this would update server-side role
    // and request new token with different permissions
  }, []);

  // Attach video track to element
  const attachVideoToElement = useCallback((
    participantId: string,
    element: HTMLVideoElement | null,
    trackType: 'camera' | 'screen' = 'camera'
  ) => {
    const currentRoom = roomRef.current;
    if (!currentRoom || !element) return;

    const participant = currentRoom.remoteParticipants.get(participantId);
    if (!participant) return;

    const source = trackType === 'screen' ? Track.Source.ScreenShare : Track.Source.Camera;
    const publication = participant.getTrackPublication(source);
    
    if (publication?.track) {
      publication.track.attach(element);
    }
  }, []);

  // Attach local video to element
  const attachLocalVideoToElement = useCallback((element: HTMLVideoElement | null) => {
    const currentRoom = roomRef.current;
    if (!currentRoom?.localParticipant || !element) return;

    const publication = currentRoom.localParticipant.getTrackPublication(Track.Source.Camera);
    if (publication?.track) {
      publication.track.attach(element);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      localVideoTrackRef.current?.stop();
      localAudioTrackRef.current?.stop();
    };
  }, []);

  return {
    isConnecting,
    isConnected: connectionState === ConnectionState.Connected,
    connectionState,
    error,
    roomName,
    localParticipant,
    remoteParticipants,
    activeSpeaker,
    isMuted,
    isVideoOn,
    isScreenSharing,
    connect,
    disconnect,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    setRole,
    room,
    attachVideoToElement,
    attachLocalVideoToElement,
  };
};