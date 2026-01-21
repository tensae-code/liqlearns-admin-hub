import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream | null;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  payload: any;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId: string, localStream: MediaStream | null) => {
  const { user } = useAuth();
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // Create a new peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    console.log(`[WebRTC] Creating peer connection for ${peerId}`);
    
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${peerId}`);
      const [remoteStream] = event.streams;
      
      setRemoteStreams((prev) => {
        const updated = new Map(prev);
        updated.set(peerId, remoteStream);
        return updated;
      });

      setPeerConnections((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(peerId);
        if (existing) {
          existing.remoteStream = remoteStream;
        }
        return updated;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current && user) {
        console.log(`[WebRTC] Sending ICE candidate to ${peerId}`);
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            type: 'ice-candidate',
            from: user.id,
            to: peerId,
            payload: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Cleanup failed connection
        cleanupPeerConnection(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${peerId}: ${pc.iceConnectionState}`);
    };

    // Store connection
    setPeerConnections((prev) => {
      const updated = new Map(prev);
      updated.set(peerId, { peerId, connection: pc, remoteStream: null });
      return updated;
    });

    return pc;
  }, [localStream, user]);

  // Cleanup a peer connection
  const cleanupPeerConnection = useCallback((peerId: string) => {
    console.log(`[WebRTC] Cleaning up connection for ${peerId}`);
    
    setPeerConnections((prev) => {
      const updated = new Map(prev);
      const peer = updated.get(peerId);
      if (peer) {
        peer.connection.close();
        updated.delete(peerId);
      }
      return updated;
    });

    setRemoteStreams((prev) => {
      const updated = new Map(prev);
      updated.delete(peerId);
      return updated;
    });

    pendingCandidatesRef.current.delete(peerId);
  }, []);

  // Connect to a specific peer (initiator)
  const connectToPeer = useCallback(async (peerId: string) => {
    if (!user || peerId === user.id) return;
    
    console.log(`[WebRTC] Initiating connection to ${peerId}`);
    
    // Don't recreate if already connected
    const existing = peerConnections.get(peerId);
    if (existing && existing.connection.connectionState === 'connected') {
      console.log(`[WebRTC] Already connected to ${peerId}`);
      return;
    }

    const pc = createPeerConnection(peerId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            type: 'offer',
            from: user.id,
            to: peerId,
            payload: offer,
          },
        });
      }
    } catch (error) {
      console.error(`[WebRTC] Error creating offer for ${peerId}:`, error);
    }
  }, [user, peerConnections, createPeerConnection]);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!user || message.to !== user.id) return;

    console.log(`[WebRTC] Received ${message.type} from ${message.from}`);

    let pc = peerConnections.get(message.from)?.connection;

    if (message.type === 'offer') {
      // Create new connection if receiving an offer
      if (!pc || pc.connectionState === 'closed') {
        pc = createPeerConnection(message.from);
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        
        // Apply any pending ICE candidates
        const pending = pendingCandidatesRef.current.get(message.from);
        if (pending) {
          for (const candidate of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current.delete(message.from);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: {
              type: 'answer',
              from: user.id,
              to: message.from,
              payload: answer,
            },
          });
        }
      } catch (error) {
        console.error(`[WebRTC] Error handling offer from ${message.from}:`, error);
      }
    } else if (message.type === 'answer') {
      if (!pc) {
        console.warn(`[WebRTC] No connection for answer from ${message.from}`);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        
        // Apply any pending ICE candidates
        const pending = pendingCandidatesRef.current.get(message.from);
        if (pending) {
          for (const candidate of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current.delete(message.from);
        }
      } catch (error) {
        console.error(`[WebRTC] Error handling answer from ${message.from}:`, error);
      }
    } else if (message.type === 'ice-candidate') {
      if (!pc || !pc.remoteDescription) {
        // Queue candidate if connection isn't ready
        const pending = pendingCandidatesRef.current.get(message.from) || [];
        pending.push(message.payload);
        pendingCandidatesRef.current.set(message.from, pending);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(message.payload));
      } catch (error) {
        console.error(`[WebRTC] Error adding ICE candidate from ${message.from}:`, error);
      }
    }
  }, [user, peerConnections, createPeerConnection]);

  // Initialize signaling channel
  useEffect(() => {
    if (!roomId || !user) return;

    const channelName = `webrtc-signaling:${roomId}`;
    console.log(`[WebRTC] Joining signaling channel: ${channelName}`);
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'webrtc-signal' }, ({ payload }) => {
        handleSignalingMessage(payload as SignalingMessage);
      })
      .on('broadcast', { event: 'peer-joined' }, ({ payload }) => {
        console.log(`[WebRTC] Peer joined: ${payload.peerId}`);
        // When a new peer joins, initiate connection to them
        if (payload.peerId !== user.id && localStream) {
          connectToPeer(payload.peerId);
        }
      })
      .on('broadcast', { event: 'peer-left' }, ({ payload }) => {
        console.log(`[WebRTC] Peer left: ${payload.peerId}`);
        cleanupPeerConnection(payload.peerId);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[WebRTC] Signaling channel subscribed`);
          // Announce our presence
          channel.send({
            type: 'broadcast',
            event: 'peer-joined',
            payload: { peerId: user.id },
          });
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`[WebRTC] Leaving signaling channel`);
      // Announce departure
      channel.send({
        type: 'broadcast',
        event: 'peer-left',
        payload: { peerId: user.id },
      });
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, user, localStream, handleSignalingMessage, connectToPeer, cleanupPeerConnection]);

  // Connect to all existing peers when local stream becomes available
  useEffect(() => {
    if (!localStream || !channelRef.current) return;
    
    // Re-announce ourselves to trigger connections
    if (user && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'peer-joined',
        payload: { peerId: user.id },
      });
    }
  }, [localStream, user]);

  // Update local stream in existing connections
  useEffect(() => {
    if (!localStream) return;

    peerConnections.forEach(({ connection }) => {
      const senders = connection.getSenders();
      
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          connection.addTrack(track, localStream);
        }
      });
    });
  }, [localStream, peerConnections]);

  // Cleanup all connections on unmount
  useEffect(() => {
    return () => {
      peerConnections.forEach(({ connection }) => {
        connection.close();
      });
    };
  }, []);

  return {
    remoteStreams,
    peerConnections,
    connectToPeer,
    cleanupPeerConnection,
  };
};
