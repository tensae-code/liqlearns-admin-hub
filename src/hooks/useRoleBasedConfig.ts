import { useAuth } from '@/contexts/AuthContext';
import { 
  Brain, 
  Bot, 
  MessageCircle, 
  Users, 
  Video, 
  Hash, 
  Gift,
  UserPlus,
  Phone,
  Megaphone,
  BarChart3,
  BookOpen,
  FileText,
  Settings,
  Shield,
  AlertCircle,
  HelpCircle,
  Award,
  GraduationCap
} from 'lucide-react';
import { STAT_GRADIENTS } from '@/lib/theme';

export interface QuickAccessConfig {
  id: string;
  icon: typeof Brain;
  label: string;
  description: string;
  color: string;
  enabled: boolean;
}

export interface NotificationConfig {
  types: string[];
  filters: string[];
}

// Role-based quick access configurations
const roleQuickAccessConfig: Record<string, QuickAccessConfig[]> = {
  student: [
    { id: 'daily-bonus', icon: Gift, label: 'Daily Bonus', description: 'Spin for rewards', color: STAT_GRADIENTS[3], enabled: true },
    { id: 'brain-bank', icon: Brain, label: 'Brain Bank', description: 'Store & review vocabulary', color: STAT_GRADIENTS[1], enabled: true },
    { id: 'ai-chat', icon: Bot, label: 'AI Assistant', description: 'Get help with learning', color: STAT_GRADIENTS[0], enabled: true },
    { id: 'dm', icon: Users, label: 'Direct Message', description: 'Chat with friends', color: STAT_GRADIENTS[3], enabled: true },
    { id: 'group-chat', icon: Hash, label: 'Group Chat', description: 'Study groups & channels', color: STAT_GRADIENTS[1], enabled: true },
    { id: 'video-call', icon: Video, label: 'Video Call', description: 'Start or join a call', color: STAT_GRADIENTS[0], enabled: true },
    { id: 'add-friend', icon: UserPlus, label: 'Add Friend', description: 'Find and add friends', color: STAT_GRADIENTS[2], enabled: true },
  ],
  teacher: [
    { id: 'ai-chat', icon: Bot, label: 'AI Assistant', description: 'Get help with teaching', color: STAT_GRADIENTS[0], enabled: true },
    { id: 'dm', icon: Users, label: 'Direct Message', description: 'Message students', color: STAT_GRADIENTS[3], enabled: true },
    { id: 'group-chat', icon: Hash, label: 'Group Chat', description: 'Class discussions', color: STAT_GRADIENTS[1], enabled: true },
    { id: 'video-call', icon: Video, label: 'Video Call', description: 'Host class sessions', color: STAT_GRADIENTS[0], enabled: true },
    { id: 'announcements', icon: Megaphone, label: 'Announcements', description: 'Notify students', color: STAT_GRADIENTS[3], enabled: true },
  ],
  parent: [
    { id: 'talk-agent', icon: MessageCircle, label: 'Contact Teacher', description: 'Reach out to teachers', color: STAT_GRADIENTS[2], enabled: true },
    { id: 'dm', icon: Users, label: 'Direct Message', description: 'Chat with teachers', color: STAT_GRADIENTS[3], enabled: true },
    { id: 'announcements', icon: Megaphone, label: 'Announcements', description: 'School updates', color: STAT_GRADIENTS[3], enabled: true },
  ],
  admin: [
    { id: 'ai-chat', icon: Bot, label: 'AI Assistant', description: 'Admin assistance', color: STAT_GRADIENTS[0], enabled: true },
    { id: 'dm', icon: Users, label: 'Direct Message', description: 'Message users', color: STAT_GRADIENTS[3], enabled: true },
    { id: 'announcements', icon: Megaphone, label: 'Announcements', description: 'Platform announcements', color: STAT_GRADIENTS[3], enabled: true },
  ],
  support: [
    { id: 'ai-chat', icon: Bot, label: 'AI Assistant', description: 'Support assistance', color: STAT_GRADIENTS[0], enabled: true },
    { id: 'dm', icon: Users, label: 'Direct Message', description: 'Help users', color: STAT_GRADIENTS[3], enabled: true },
    { id: 'talk-agent', icon: MessageCircle, label: 'Live Chat', description: 'Active support chats', color: STAT_GRADIENTS[2], enabled: true },
  ],
  ceo: [
    { id: 'ai-chat', icon: Bot, label: 'AI Assistant', description: 'Executive insights', color: STAT_GRADIENTS[0], enabled: true },
    { id: 'dm', icon: Users, label: 'Direct Message', description: 'Team communication', color: STAT_GRADIENTS[3], enabled: true },
    { id: 'announcements', icon: Megaphone, label: 'Announcements', description: 'Company-wide updates', color: STAT_GRADIENTS[3], enabled: true },
  ],
  enterprise: [
    { id: 'ai-chat', icon: Bot, label: 'AI Assistant', description: 'Enterprise support', color: STAT_GRADIENTS[0], enabled: true },
    { id: 'dm', icon: Users, label: 'Direct Message', description: 'Team communication', color: STAT_GRADIENTS[3], enabled: true },
    { id: 'group-chat', icon: Hash, label: 'Team Channels', description: 'Department channels', color: STAT_GRADIENTS[1], enabled: true },
    { id: 'video-call', icon: Video, label: 'Video Call', description: 'Team meetings', color: STAT_GRADIENTS[0], enabled: true },
  ],
};

// Role-based notification type configurations
const roleNotificationConfig: Record<string, NotificationConfig> = {
  student: {
    types: ['lesson', 'quiz', 'achievement', 'badge', 'streak', 'xp', 'course', 'friend', 'message'],
    filters: ['All', 'Learning', 'Social', 'Achievements'],
  },
  teacher: {
    types: ['submission', 'enrollment', 'review', 'assignment', 'course', 'message', 'payment'],
    filters: ['All', 'Students', 'Courses', 'Earnings'],
  },
  parent: {
    types: ['child_progress', 'child_achievement', 'report', 'message', 'alert'],
    filters: ['All', 'Progress', 'Achievements', 'Alerts'],
  },
  admin: {
    types: ['skill_suggestion', 'report', 'user_report', 'system', 'approval'],
    filters: ['All', 'Approvals', 'Reports', 'System'],
  },
  support: {
    types: ['ticket', 'escalation', 'resolution', 'message', 'report'],
    filters: ['All', 'Tickets', 'Urgent', 'Resolved'],
  },
  ceo: {
    types: ['skill_approval', 'platform_alert', 'report', 'analytics', 'team'],
    filters: ['All', 'Approvals', 'Analytics', 'Team'],
  },
  enterprise: {
    types: ['member_progress', 'completion', 'enrollment', 'analytics', 'team'],
    filters: ['All', 'Progress', 'Completions', 'Team'],
  },
};

export const useRoleBasedConfig = () => {
  const { userRole } = useAuth();
  const role = userRole || 'student';

  const getQuickAccessItems = (): QuickAccessConfig[] => {
    return roleQuickAccessConfig[role] || roleQuickAccessConfig.student;
  };

  const getNotificationConfig = (): NotificationConfig => {
    return roleNotificationConfig[role] || roleNotificationConfig.student;
  };

  const getNotificationTypes = (): string[] => {
    const config = getNotificationConfig();
    return config.types;
  };

  const getNotificationFilters = (): string[] => {
    const config = getNotificationConfig();
    return config.filters;
  };

  return {
    role,
    quickAccessItems: getQuickAccessItems(),
    notificationConfig: getNotificationConfig(),
    notificationTypes: getNotificationTypes(),
    notificationFilters: getNotificationFilters(),
  };
};
