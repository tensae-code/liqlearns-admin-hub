import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Pin, Swords, Users, BookOpen, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeedItem {
  id: string;
  type: 'announcement' | 'battle' | 'community';
  title: string;
  content: string;
  category?: string;
  priority?: string;
  is_pinned?: boolean;
  created_at: string;
}

const NewsFeedWidget = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();

    // Subscribe to new announcements
    const channel = supabase
      .channel('news-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        const a = payload.new as any;
        setItems(prev => [{
          id: a.id,
          type: 'announcement',
          title: a.title,
          content: a.content,
          category: a.category,
          priority: a.priority,
          is_pinned: a.is_pinned,
          created_at: a.created_at,
        }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchFeed = async () => {
    try {
      // Fetch announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      const feedItems: FeedItem[] = (announcements || []).map((a: any) => ({
        id: a.id,
        type: 'announcement' as const,
        title: a.title,
        content: a.content,
        category: a.category,
        priority: a.priority,
        is_pinned: a.is_pinned,
        created_at: a.created_at,
      }));

      // Fetch recent completed battles
      const { data: battles } = await supabase
        .from('battles')
        .select('id, status, completed_at, game_type, mode, stake_amount')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      if (battles) {
        battles.forEach((b: any) => {
          feedItems.push({
            id: b.id,
            type: 'battle',
            title: `Battle Completed`,
            content: `A ${b.mode} ${b.game_type || 'battle'} just ended${b.stake_amount > 0 ? ` with ${b.stake_amount} coins at stake` : ''}!`,
            created_at: b.completed_at || b.created_at,
          });
        });
      }

      // Sort all by date, pinned first
      feedItems.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setItems(feedItems.slice(0, 15));
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (item: FeedItem) => {
    switch (item.type) {
      case 'announcement': return <Megaphone className="w-4 h-4 text-accent" />;
      case 'battle': return <Swords className="w-4 h-4 text-destructive" />;
      case 'community': return <Users className="w-4 h-4 text-primary" />;
    }
  };

  const getIconBg = (item: FeedItem) => {
    switch (item.type) {
      case 'announcement': return 'bg-accent/10';
      case 'battle': return 'bg-destructive/10';
      case 'community': return 'bg-primary/10';
    }
  };

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

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-5 h-5 text-accent" />
          <h3 className="font-display font-semibold text-foreground">News Feed</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="w-5 h-5 text-accent" />
        <h3 className="font-display font-semibold text-foreground">News Feed</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No updates yet</p>
      ) : (
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={cn(
                  'p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors',
                  item.is_pinned && 'bg-accent/5 border-accent/20'
                )}
              >
                <div className="flex gap-2.5">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', getIconBg(item))}>
                    {getIcon(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {item.is_pinned && <Pin className="w-3 h-3 text-accent" />}
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      {item.priority === 'urgent' && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{formatTime(item.created_at)}</span>
                      {item.category && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{item.category}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
};

export default NewsFeedWidget;
