import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getIceServers } from '@/lib/webrtcConfig';

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
  iceServers: getIceServers(),
};

export const useWebRTC = (roomId: string, localStream: MediaStream | null) => {
  const { user } = useAuth();
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep local stream ref up to date
  useEffect(() => {
    localStreamRef.current = localStream;
    
    // Update existing peer connections with new local stream
    if (localStream) {
      peerConnectionsRef.current.forEach((pc, peerId) => {
        const senders = pc.getSenders();
        
        localStream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch(console.error);
          } else if (pc.connectionState !== 'closed') {
            pc.addTrack(track, localStream);
          }
        });
      });
    }
  }, [localStream]);

  // Create a new peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    console.log(`[WebRTC] Creating peer connection for ${peerId}`);
    
    // Close existing connection if any
    const existingPc = peerConnectionsRef.current.get(peerId);
    if (existingPc) {
      existingPc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to connection immediately if available
    if (localStreamRef.current) {
      console.log(`[WebRTC] Adding ${localStreamRef.current.getTracks().length} local tracks to peer ${peerId}`);
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${peerId}:`, event.track.kind);
      const [remoteStream] = event.streams;
      
      if (remoteStream) {
        setRemoteStreams((prev) => {
          const updated = new Map(prev);
          updated.set(peerId, remoteStream);
          return updated;
        });
      }
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
        // Attempt to reconnect after a short delay
        setTimeout(() => {
          if (peerConnectionsRef.current.has(peerId)) {
            console.log(`[WebRTC] Attempting to reconnect to ${peerId}`);
            cleanupPeerConnection(peerId);
          }
        }, 2000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${peerId}: ${pc.iceConnectionState}`);
    };

    // Store connection
    peerConnectionsRef.current.set(peerId, pc);

    return pc;
  }, [user]);

  // Cleanup a peer connection
  const cleanupPeerConnection = useCallback((peerId: string) => {
    console.log(`[WebRTC] Cleaning up connection for ${peerId}`);
    
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }

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
    
    // Check if we have a working connection
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing && (existing.connectionState === 'connected' || existing.connectionState === 'connecting')) {
      console.log(`[WebRTC] Already connected/connecting to ${peerId}`);
      return;
    }

    const pc = createPeerConnection(peerId);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      if (channelRef.current) {
        console.log(`[WebRTC] Sending offer to ${peerId}`);
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
      cleanupPeerConnection(peerId);
    }
  }, [user, createPeerConnection, cleanupPeerConnection]);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!user || message.to !== user.id) return;

    console.log(`[WebRTC] Received ${message.type} from ${message.from}`);

    let pc = peerConnectionsRef.current.get(message.from);

    if (message.type === 'offer') {
      // Create new connection if receiving an offer
      pc = createPeerConnection(message.from);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        
        // Apply any pending ICE candidates
        const pending = pendingCandidatesRef.current.get(message.from);
        if (pending) {
          console.log(`[WebRTC] Applying ${pending.length} pending candidates for ${message.from}`);
          for (const candidate of pending) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('[WebRTC] Error adding pending candidate:', e);
            }
          }
          pendingCandidatesRef.current.delete(message.from);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (channelRef.current) {
          console.log(`[WebRTC] Sending answer to ${message.from}`);
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
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          
          // Apply any pending ICE candidates
          const pending = pendingCandidatesRef.current.get(message.from);
          if (pending) {
            console.log(`[WebRTC] Applying ${pending.length} pending candidates for ${message.from}`);
            for (const candidate of pending) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn('[WebRTC] Error adding pending candidate:', e);
              }
            }
            pendingCandidatesRef.current.delete(message.from);
          }
        } else {
          console.warn(`[WebRTC] Unexpected signaling state for answer: ${pc.signalingState}`);
        }
      } catch (error) {
        console.error(`[WebRTC] Error handling answer from ${message.from}:`, error);
      }
    } else if (message.type === 'ice-candidate') {
      if (!pc || !pc.remoteDescription) {
        // Queue candidate if connection isn't ready
        console.log(`[WebRTC] Queueing ICE candidate from ${message.from}`);
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
  }, [user, createPeerConnection]);

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
        console.log(`[WebRTC] Peer joined: ${payload.peerId}, hasStream: ${payload.hasStream}`);
        // When a peer with a stream joins, connect to them
        if (payload.peerId !== user.id && payload.hasStream) {
          // Small delay to let them set up
          setTimeout(() => connectToPeer(payload.peerId), 500);
        }
      })
      .on('broadcast', { event: 'peer-left' }, ({ payload }) => {
        console.log(`[WebRTC] Peer left: ${payload.peerId}`);
        cleanupPeerConnection(payload.peerId);
      })
      .on('broadcast', { event: 'request-connection' }, ({ payload }) => {
        console.log(`[WebRTC] Connection requested from: ${payload.peerId}`);
        if (payload.peerId !== user.id && localStreamRef.current) {
          connectToPeer(payload.peerId);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[WebRTC] Signaling channel subscribed`);
          channelRef.current = channel;
          
          // Announce our presence with stream status
          channel.send({
            type: 'broadcast',
            event: 'peer-joined',
            payload: { 
              peerId: user.id,
              hasStream: !!localStreamRef.current 
            },
          });
        }
      });

    return () => {
      console.log(`[WebRTC] Leaving signaling channel`);
      // Announce departure
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'peer-left',
          payload: { peerId: user.id },
        });
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
      
      // Cleanup all connections
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, user, handleSignalingMessage, connectToPeer, cleanupPeerConnection]);

  // When local stream becomes available, announce and request connections
  useEffect(() => {
    if (!localStream || !channelRef.current || !user) return;
    
    console.log(`[WebRTC] Local stream available, announcing presence`);
    
    // Re-announce ourselves with stream
    channelRef.current.send({
      type: 'broadcast',
      event: 'peer-joined',
      payload: { 
        peerId: user.id,
        hasStream: true 
      },
    });
    
    // Request others to connect to us
    channelRef.current.send({
      type: 'broadcast',
      event: 'request-connection',
      payload: { peerId: user.id },
    });
  }, [localStream, user]);

  // Cleanup all connections on unmount
  useEffect(() => {
    return () => {
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  return {
    remoteStreams,
    peerConnections: peerConnectionsRef.current,
    connectToPeer,
    cleanupPeerConnection,
  };
};
