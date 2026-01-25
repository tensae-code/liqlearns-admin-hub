/**
 * LiveKit Configuration and Room Name Utilities
 * 
 * This module provides deterministic room naming for all call contexts
 * and centralized LiveKit configuration.
 */

export type RoomContext = 'dm' | 'group' | 'study_room';

export type ParticipantRole = 'host' | 'moderator' | 'speaker' | 'listener';

export interface RoomConfig {
  roomName: string;
  contextType: RoomContext;
  contextId: string;
}

/**
 * Generate a deterministic room name for Direct Messages
 * Format: dm:<sortedUserId1>:<sortedUserId2>
 */
export const getDMRoomName = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort();
  return `dm:${sortedIds[0]}:${sortedIds[1]}`;
};

/**
 * Generate a room name for Group Chats
 * Format: gc:<groupId>
 */
export const getGroupRoomName = (groupId: string): string => {
  return `gc:${groupId}`;
};

/**
 * Generate a room name for Study Rooms
 * Format: sr:<studyRoomId>
 */
export const getStudyRoomName = (studyRoomId: string): string => {
  return `sr:${studyRoomId}`;
};

/**
 * Parse a room name to extract context information
 */
export const parseRoomName = (roomName: string): RoomConfig | null => {
  const parts = roomName.split(':');
  
  if (parts[0] === 'dm' && parts.length === 3) {
    return {
      roomName,
      contextType: 'dm',
      contextId: `${parts[1]}:${parts[2]}`, // Both user IDs
    };
  }
  
  if (parts[0] === 'gc' && parts.length === 2) {
    return {
      roomName,
      contextType: 'group',
      contextId: parts[1],
    };
  }
  
  if (parts[0] === 'sr' && parts.length === 2) {
    return {
      roomName,
      contextType: 'study_room',
      contextId: parts[1],
    };
  }
  
  return null;
};

/**
 * Default role based on context type
 */
export const getDefaultRole = (contextType: RoomContext): ParticipantRole => {
  switch (contextType) {
    case 'dm':
      return 'speaker'; // 1:1 calls - both can speak
    case 'group':
      return 'speaker'; // Group calls - all can speak by default
    case 'study_room':
      return 'listener'; // Study rooms - join as listener by default
    default:
      return 'listener';
  }
};

/**
 * Check if a role can publish media
 */
export const canPublish = (role: ParticipantRole): boolean => {
  return role === 'host' || role === 'moderator' || role === 'speaker';
};

/**
 * Check if a role can moderate (promote/demote/kick)
 */
export const canModerate = (role: ParticipantRole): boolean => {
  return role === 'host' || role === 'moderator';
};

/**
 * Maximum speakers allowed based on context
 */
export const getMaxSpeakers = (contextType: RoomContext): number => {
  switch (contextType) {
    case 'dm':
      return 2;
    case 'group':
      return 16;
    case 'study_room':
      return 8; // Large rooms limit active speakers
    default:
      return 8;
  }
};