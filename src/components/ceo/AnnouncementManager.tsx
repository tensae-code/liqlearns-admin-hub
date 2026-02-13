import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Megaphone, Pin, Trash2, Send, AlertCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  is_pinned: boolean;
  created_at: string;
}

interface AnnouncementManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AnnouncementManager = ({ open, onOpenChange }: AnnouncementManagerProps) => {
  const { profile } = useProfile();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) fetchAnnouncements();
  }, [open]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setAnnouncements(data as Announcement[]);
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim() || !profile) return;
    setSending(true);

    try {
      const { error } = await supabase.from('announcements').insert({
        author_id: profile.id,
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        is_pinned: isPinned,
      });

      if (error) throw error;

      // Send notification to all users
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', profile.id);

      if (allProfiles && allProfiles.length > 0) {
        const notifications = allProfiles.map(p => ({
          user_id: p.id,
          type: 'announcement' as string,
          title: `📢 ${title.trim()}`,
          message: content.trim().substring(0, 100) + (content.trim().length > 100 ? '...' : ''),
          data: { category, priority },
        }));

        // Insert in batches of 100
        for (let i = 0; i < notifications.length; i += 100) {
          await supabase.from('notifications').insert(notifications.slice(i, i + 100));
        }
      }

      toast.success('Announcement published to all users!');
      setTitle('');
      setContent('');
      setCategory('general');
      setPriority('normal');
      setIsPinned(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to publish announcement');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.success('Announcement deleted');
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return 'destructive';
      case 'important': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-accent" />
            Announcements
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* New Announcement Form */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
            <Input
              placeholder="Announcement title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write your announcement..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="update">Platform Update</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="feature">New Feature</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={isPinned} onCheckedChange={setIsPinned} id="pin" />
                <Label htmlFor="pin" className="text-sm">Pin</Label>
              </div>
              <Button
                onClick={handlePublish}
                disabled={!title.trim() || !content.trim() || sending}
                className="ml-auto"
              >
                <Send className="w-4 h-4 mr-1" />
                {sending ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          {/* Past Announcements */}
          <ScrollArea className="max-h-[40vh]">
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="p-3 bg-card rounded-lg border border-border flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {a.is_pinned && <Pin className="w-3 h-3 text-accent" />}
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <Badge variant={priorityColor(a.priority)} className="text-[10px]">
                        {a.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No announcements yet</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementManager;
