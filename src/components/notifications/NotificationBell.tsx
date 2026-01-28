import { useState, useEffect } from 'react';
import { Bell, Trophy, BookOpen, Flame, Gift, Check, Gamepad2, Video, CheckCircle2, Star, FileText, Users, AlertCircle, HelpCircle, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleBasedConfig } from '@/hooks/useRoleBasedConfig';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
  // Activity-specific fields
  xp?: number;
  aura?: number;
}

// Role-based mock activity data generators
const getRecentActivities = (role: string): Notification[] => {
  const baseTime = Date.now();
  
  const roleActivities: Record<string, Notification[]> = {
    student: [
      { id: 'act-1', type: 'lesson', title: 'Completed Amharic Lesson 5', message: 'Basic Greetings', xp: 50, aura: 10, read: false, created_at: new Date(baseTime - 10 * 60000).toISOString(), data: null },
      { id: 'act-2', type: 'game', title: 'Won Memory Match', message: 'Vocabulary Challenge', xp: 30, read: false, created_at: new Date(baseTime - 25 * 60000).toISOString(), data: null },
      { id: 'act-3', type: 'achievement', title: 'Earned Badge', message: 'First Week Champion', xp: 100, aura: 25, read: true, created_at: new Date(baseTime - 60 * 60000).toISOString(), data: null },
      { id: 'act-4', type: 'streak', title: 'Streak Extended!', message: '7 days in a row', xp: 75, aura: 15, read: true, created_at: new Date(baseTime - 3 * 60 * 60000).toISOString(), data: null },
    ],
    teacher: [
      { id: 'act-t1', type: 'submission', title: 'New Assignment Submission', message: 'Alemayehu submitted Week 1 Essay', read: false, created_at: new Date(baseTime - 15 * 60000).toISOString(), data: null },
      { id: 'act-t2', type: 'enrollment', title: 'New Student Enrolled', message: 'Sara T. joined Amharic for Beginners', read: false, created_at: new Date(baseTime - 45 * 60000).toISOString(), data: null },
      { id: 'act-t3', type: 'review', title: 'New Course Review', message: '5 stars from Dawit B.', read: true, created_at: new Date(baseTime - 2 * 60 * 60000).toISOString(), data: null },
      { id: 'act-t4', type: 'payment', title: 'Payment Received', message: '450 ETB from course sales', read: true, created_at: new Date(baseTime - 5 * 60 * 60000).toISOString(), data: null },
    ],
    parent: [
      { id: 'act-p1', type: 'child_progress', title: "Child's Progress Update", message: 'Completed 3 lessons today', read: false, created_at: new Date(baseTime - 20 * 60000).toISOString(), data: null },
      { id: 'act-p2', type: 'child_achievement', title: 'New Badge Earned', message: 'Quick Learner achievement', read: false, created_at: new Date(baseTime - 60 * 60000).toISOString(), data: null },
      { id: 'act-p3', type: 'report', title: 'Weekly Report Ready', message: 'View learning summary', read: true, created_at: new Date(baseTime - 24 * 60 * 60000).toISOString(), data: null },
    ],
    admin: [
      { id: 'act-a1', type: 'skill_suggestion', title: 'New Skill Suggestion', message: 'Advanced Grammar proposed', read: false, created_at: new Date(baseTime - 30 * 60000).toISOString(), data: null },
      { id: 'act-a2', type: 'report', title: 'User Report Received', message: 'Review spam content', read: false, created_at: new Date(baseTime - 2 * 60 * 60000).toISOString(), data: null },
      { id: 'act-a3', type: 'approval', title: 'Pending Approval', message: '3 skills waiting for vote', read: true, created_at: new Date(baseTime - 4 * 60 * 60000).toISOString(), data: null },
    ],
    support: [
      { id: 'act-s1', type: 'ticket', title: 'New Support Ticket', message: 'Login issue reported', read: false, created_at: new Date(baseTime - 10 * 60000).toISOString(), data: null },
      { id: 'act-s2', type: 'escalation', title: 'Escalated Ticket', message: 'Payment dispute needs review', read: false, created_at: new Date(baseTime - 45 * 60000).toISOString(), data: null },
      { id: 'act-s3', type: 'resolution', title: 'Ticket Resolved', message: 'User thanked support team', read: true, created_at: new Date(baseTime - 3 * 60 * 60000).toISOString(), data: null },
    ],
    ceo: [
      { id: 'act-c1', type: 'skill_approval', title: 'Skill Approval Required', message: '2 skills passed voting phase', read: false, created_at: new Date(baseTime - 20 * 60000).toISOString(), data: null },
      { id: 'act-c2', type: 'analytics', title: 'Weekly Analytics Ready', message: 'Platform grew 15% this week', read: false, created_at: new Date(baseTime - 60 * 60000).toISOString(), data: null },
      { id: 'act-c3', type: 'team', title: 'New Team Member', message: 'Demo Admin joined the team', read: true, created_at: new Date(baseTime - 24 * 60 * 60000).toISOString(), data: null },
    ],
    enterprise: [
      { id: 'act-e1', type: 'member_progress', title: 'Team Progress Update', message: '5 members completed training', read: false, created_at: new Date(baseTime - 30 * 60000).toISOString(), data: null },
      { id: 'act-e2', type: 'completion', title: 'Learning Path Completed', message: 'Marketing team finished onboarding', read: false, created_at: new Date(baseTime - 2 * 60 * 60000).toISOString(), data: null },
      { id: 'act-e3', type: 'analytics', title: 'Monthly Report', message: 'Team engagement up 20%', read: true, created_at: new Date(baseTime - 24 * 60 * 60000).toISOString(), data: null },
    ],
  };
  
  return roleActivities[role] || roleActivities.student;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const { role } = useRoleBasedConfig();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  // Get role-based activities
  const recentActivities = getRecentActivities(role);

  useEffect(() => {
    if (!user) return;

    let profileId: string | null = null;

    const fetchNotifications = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      profileId = profile.id;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    };

    fetchNotifications();

    // Subscribe to realtime notifications - listen to all inserts, filter in handler
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // Only add notification if it belongs to this user
          if (profileId && (newNotification as any).user_id === profileId) {
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'xp':
        return <Trophy className="w-4 h-4 text-gold" />;
      case 'badge':
        return <Gift className="w-4 h-4 text-accent" />;
      case 'streak':
        return <Flame className="w-4 h-4 text-streak" />;
      case 'course':
        return <BookOpen className="w-4 h-4 text-success" />;
      case 'lesson':
        return <BookOpen className="w-4 h-4 text-accent" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-destructive" />;
      case 'video':
        return <Video className="w-4 h-4 text-primary" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-gold" />;
      case 'quiz':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'transaction':
        return <Award className="w-4 h-4 text-success" />;
      case 'message':
        return <Bell className="w-4 h-4 text-primary" />;
      case 'friend':
      case 'enrollment':
        return <Users className="w-4 h-4 text-accent" />;
      case 'submission':
      case 'review':
        return <FileText className="w-4 h-4 text-primary" />;
      case 'ticket':
      case 'escalation':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'payment':
        return <Award className="w-4 h-4 text-success" />;
      case 'child_progress':
      case 'child_achievement':
      case 'member_progress':
        return <Star className="w-4 h-4 text-gold" />;
      case 'skill_suggestion':
      case 'skill_approval':
      case 'approval':
        return <Award className="w-4 h-4 text-accent" />;
      case 'resolution':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'analytics':
      case 'report':
        return <FileText className="w-4 h-4 text-primary" />;
      case 'team':
      case 'completion':
        return <Users className="w-4 h-4 text-success" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'xp': return 'bg-gold/10';
      case 'badge': return 'bg-accent/10';
      case 'streak': return 'bg-streak/10';
      case 'course': return 'bg-success/10';
      case 'lesson': return 'bg-accent/10';
      case 'game': return 'bg-destructive/10';
      case 'video': return 'bg-primary/10';
      case 'achievement': return 'bg-gold/10';
      case 'quiz': return 'bg-success/10';
      case 'transaction': return 'bg-success/10';
      case 'payment': return 'bg-success/10';
      case 'message': return 'bg-primary/10';
      case 'friend': 
      case 'enrollment':
      case 'team':
        return 'bg-accent/10';
      case 'submission':
      case 'review':
      case 'analytics':
      case 'report':
        return 'bg-primary/10';
      case 'ticket':
      case 'escalation':
        return 'bg-destructive/10';
      case 'child_progress':
      case 'child_achievement':
      case 'member_progress':
        return 'bg-gold/10';
      case 'skill_suggestion':
      case 'skill_approval':
      case 'approval':
        return 'bg-accent/10';
      case 'resolution':
      case 'completion':
        return 'bg-success/10';
      default: return 'bg-muted';
    }
  };

  // Merge DB notifications with activity notifications
  const allNotifications = [...notifications, ...recentActivities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {allNotifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'p-3 hover:bg-muted/50 transition-colors cursor-pointer',
                    !notification.read && 'bg-accent/5'
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      getIconBgColor(notification.type)
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </p>
                        {notification.xp && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 text-success border-success/30">
                            +{notification.xp} XP
                          </Badge>
                        )}
                        {notification.aura && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 text-gold border-gold/30">
                            +{notification.aura} Aura
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
