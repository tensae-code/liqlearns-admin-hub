import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  room_type: 'public' | 'private' | 'kids';
  host_id: string;
  study_topic: string | null;
  education_level: string | null;
  country: string | null;
  max_participants: number;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  is_system_room?: boolean;
  is_always_muted?: boolean;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  study_title: string | null;
  is_mic_on: boolean;
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
    education_level?: string;
    country?: string;
    xp_points?: number;
    current_streak?: number;
  };
  pin_count?: number;
  is_pinned_by_me?: boolean;
}

interface DisplaySettings {
  showXP: boolean;
  showStreak: boolean;
  showEducation: boolean;
  showCountry: boolean;
  showStudyTitle: boolean;
  showPinCount: boolean;
  blurBackground: boolean;
}

interface StudyRoomContextType {
  // Active room state (persists across navigation)
  activeRoom: StudyRoom | null;
  setActiveRoom: (room: StudyRoom | null) => void;
  activeParticipants: RoomParticipant[];
  setActiveParticipants: (participants: RoomParticipant[]) => void;
  
  // Popout/minimized state
  isPopout: boolean;
  setIsPopout: (value: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
  
  // Display settings
  displaySettings: DisplaySettings;
  updateDisplaySetting: (key: keyof DisplaySettings, value: boolean) => void;
  
  // Mic and study title
  isMicOn: boolean;
  setIsMicOn: (value: boolean) => void;
  myStudyTitle: string;
  setMyStudyTitle: (value: string) => void;
  myStudyField: string;
  setMyStudyField: (value: string) => void;
  
  // Pinned users (persist across views)
  pinnedUsers: string[];
  setPinnedUsers: (users: string[]) => void;
  addPinnedUser: (userId: string) => void;
  removePinnedUser: (userId: string) => void;
  
  // Leave room handler
  leaveActiveRoom: () => Promise<void>;
  
  // Study timer
  sessionStartTime: Date | null;
  setSessionStartTime: (time: Date | null) => void;
}

const defaultDisplaySettings: DisplaySettings = {
  showXP: true,
  showStreak: true,
  showEducation: true,
  showCountry: true,
  showStudyTitle: true,
  showPinCount: true,
  blurBackground: false,
};

const StudyRoomContext = createContext<StudyRoomContextType | null>(null);

export const useStudyRoomContext = () => {
  const context = useContext(StudyRoomContext);
  if (!context) {
    throw new Error('useStudyRoomContext must be used within StudyRoomProvider');
  }
  return context;
};

// Optional hook that returns null if not in provider (for global floating room)
export const useOptionalStudyRoomContext = () => {
  return useContext(StudyRoomContext);
};

export const StudyRoomProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useProfile();
  
  // Core room state
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<RoomParticipant[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // View state
  const [isPopout, setIsPopout] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // User state
  const [isMicOn, setIsMicOn] = useState(false);
  const [myStudyTitle, setMyStudyTitle] = useState('');
  const [myStudyField, setMyStudyField] = useState('');
  
  // Pinned users
  const [pinnedUsers, setPinnedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('studyRoomPinnedUsers');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Display settings
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem('studyRoomDisplaySettings');
    return saved ? { ...defaultDisplaySettings, ...JSON.parse(saved) } : defaultDisplaySettings;
  });

  // Persist pinned users
  useEffect(() => {
    localStorage.setItem('studyRoomPinnedUsers', JSON.stringify(pinnedUsers));
  }, [pinnedUsers]);

  // Start session timer when joining room
  useEffect(() => {
    if (activeRoom && !sessionStartTime) {
      setSessionStartTime(new Date());
    } else if (!activeRoom) {
      setSessionStartTime(null);
    }
  }, [activeRoom, sessionStartTime]);

  const updateDisplaySetting = (key: keyof DisplaySettings, value: boolean) => {
    setDisplaySettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('studyRoomDisplaySettings', JSON.stringify(updated));
      return updated;
    });
  };

  const addPinnedUser = (userId: string) => {
    setPinnedUsers(prev => {
      if (!prev.includes(userId)) {
        return [...prev, userId];
      }
      return prev;
    });
  };

  const removePinnedUser = (userId: string) => {
    setPinnedUsers(prev => prev.filter(id => id !== userId));
  };

  const leaveActiveRoom = useCallback(async () => {
    if (!activeRoom || !profile?.id) return;

    try {
      // End any active study sessions for this room
      const { data: activeSessions } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('user_id', profile.id)
        .eq('room_id', activeRoom.id)
        .is('ended_at', null);

      if (activeSessions && activeSessions.length > 0) {
        await supabase
          .from('study_sessions')
          .update({ ended_at: new Date().toISOString() })
          .in('id', activeSessions.map(s => s.id));
      }

      // Remove from participants
      await supabase
        .from('study_room_participants')
        .delete()
        .eq('room_id', activeRoom.id)
        .eq('user_id', profile.id);

      // Reset state
      setActiveRoom(null);
      setActiveParticipants([]);
      setIsPopout(false);
      setIsMinimized(false);
      setIsMicOn(false);
      setMyStudyTitle('');
      setSessionStartTime(null);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }, [activeRoom, profile?.id]);

  return (
    <StudyRoomContext.Provider
      value={{
        activeRoom,
        setActiveRoom,
        activeParticipants,
        setActiveParticipants,
        isPopout,
        setIsPopout,
        isMinimized,
        setIsMinimized,
        displaySettings,
        updateDisplaySetting,
        isMicOn,
        setIsMicOn,
        myStudyTitle,
        setMyStudyTitle,
        myStudyField,
        setMyStudyField,
        pinnedUsers,
        setPinnedUsers,
        addPinnedUser,
        removePinnedUser,
        leaveActiveRoom,
        sessionStartTime,
        setSessionStartTime,
      }}
    >
      {children}
    </StudyRoomContext.Provider>
  );
};
