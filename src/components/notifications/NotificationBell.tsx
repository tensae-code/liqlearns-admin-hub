import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trophy, BookOpen, Flame, Gift, Check, Gamepad2, Video, CheckCircle2, Star, FileText, Users, AlertCircle, HelpCircle, Award, Megaphone } from 'lucide-react';
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

// No more mock data - all notifications come from the database

const NotificationBell = () => {
  const { user } = useAuth();
  const { role } = useRoleBasedConfig();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

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
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-accent" />;
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
      case 'announcement':
        return 'bg-accent/10';
      default: return 'bg-muted';
    }
  };

  // All notifications from DB only
  const allNotifications = notifications;

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
                  onClick={async () => {
                    if (!notification.read) markAsRead(notification.id);
                    if (notification.type === 'message') {
                      const senderId = (notification.data as any)?.sender_id;
                      if (senderId) {
                        // sender_id is profile ID, need auth UUID for messages
                        const { data: senderProfile } = await supabase
                          .from('profiles')
                          .select('user_id')
                          .eq('id', senderId)
                          .maybeSingle();
                        if (senderProfile?.user_id) {
                          navigate(`/messages?dm=${senderProfile.user_id}`);
                        } else {
                          navigate('/messages');
                        }
                      } else {
                        navigate('/messages');
                      }
                      setIsOpen(false);
                    } else if (notification.type === 'course') {
                      const courseId = (notification.data as any)?.course_id;
                      if (courseId) navigate(`/courses/${courseId}`);
                      setIsOpen(false);
                    }
                  }}
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
