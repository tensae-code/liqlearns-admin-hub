import { createContext, useContext, useState, ReactNode } from 'react';
import type { StudyRoom, RoomParticipant } from '@/hooks/useStudyRooms';

interface DisplaySettings {
  showXP: boolean;
  showStreak: boolean;
  showEducation: boolean;
  showCountry: boolean;
  showStudyTitle: boolean;
  showPinCount: boolean;
}

interface StudyRoomContextType {
  isPopout: boolean;
  setIsPopout: (value: boolean) => void;
  popoutRoom: StudyRoom | null;
  setPopoutRoom: (room: StudyRoom | null) => void;
  popoutParticipants: RoomParticipant[];
  setPopoutParticipants: (participants: RoomParticipant[]) => void;
  displaySettings: DisplaySettings;
  updateDisplaySetting: (key: keyof DisplaySettings, value: boolean) => void;
  isMicOn: boolean;
  setIsMicOn: (value: boolean) => void;
  myStudyTitle: string;
  setMyStudyTitle: (value: string) => void;
}

const defaultDisplaySettings: DisplaySettings = {
  showXP: true,
  showStreak: true,
  showEducation: true,
  showCountry: true,
  showStudyTitle: true,
  showPinCount: true,
};

const StudyRoomContext = createContext<StudyRoomContextType | null>(null);

export const useStudyRoomContext = () => {
  const context = useContext(StudyRoomContext);
  if (!context) {
    throw new Error('useStudyRoomContext must be used within StudyRoomProvider');
  }
  return context;
};

export const StudyRoomProvider = ({ children }: { children: ReactNode }) => {
  const [isPopout, setIsPopout] = useState(false);
  const [popoutRoom, setPopoutRoom] = useState<StudyRoom | null>(null);
  const [popoutParticipants, setPopoutParticipants] = useState<RoomParticipant[]>([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [myStudyTitle, setMyStudyTitle] = useState('');
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem('studyRoomDisplaySettings');
    return saved ? JSON.parse(saved) : defaultDisplaySettings;
  });

  const updateDisplaySetting = (key: keyof DisplaySettings, value: boolean) => {
    setDisplaySettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('studyRoomDisplaySettings', JSON.stringify(updated));
      return updated;
    });
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
      }}
    >
      {children}
    </StudyRoomContext.Provider>
  );
};
