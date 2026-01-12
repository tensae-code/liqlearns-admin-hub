import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { StudyRoom, RoomParticipant } from '@/hooks/useStudyRooms';

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
  // Popout state
  isPopout: boolean;
  setIsPopout: (value: boolean) => void;
  popoutRoom: StudyRoom | null;
  setPopoutRoom: (room: StudyRoom | null) => void;
  popoutParticipants: RoomParticipant[];
  setPopoutParticipants: (participants: RoomParticipant[]) => void;
  
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
  const [isPopout, setIsPopout] = useState(false);
  const [popoutRoom, setPopoutRoom] = useState<StudyRoom | null>(null);
  const [popoutParticipants, setPopoutParticipants] = useState<RoomParticipant[]>([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [myStudyTitle, setMyStudyTitle] = useState('');
  const [myStudyField, setMyStudyField] = useState('');
  const [pinnedUsers, setPinnedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('studyRoomPinnedUsers');
    return saved ? JSON.parse(saved) : [];
  });
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem('studyRoomDisplaySettings');
    return saved ? { ...defaultDisplaySettings, ...JSON.parse(saved) } : defaultDisplaySettings;
  });

  // Persist pinned users
  useEffect(() => {
    localStorage.setItem('studyRoomPinnedUsers', JSON.stringify(pinnedUsers));
  }, [pinnedUsers]);

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

  return (
    <StudyRoomContext.Provider
      value={{
        isPopout,
        setIsPopout,
        popoutRoom,
        setPopoutRoom,
        popoutParticipants,
        setPopoutParticipants,
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
      }}
    >
      {children}
    </StudyRoomContext.Provider>
  );
};
