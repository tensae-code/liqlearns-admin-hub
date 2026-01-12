import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Globe, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface GroupSearchResult {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  description?: string;
  member_count: number;
  is_public: boolean;
}

interface FindGroupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinGroup: (groupId: string) => void;
}

const FindGroupsModal = ({ open, onOpenChange, onJoinGroup }: FindGroupsModalProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<GroupSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Show all public groups
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('id, name, username, avatar_url, description, member_count, is_public')
          .eq('is_public', true)
          .limit(20);

        if (error) throw error;
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, username, avatar_url, description, member_count, is_public')
        .eq('is_public', true)
        .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error searching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (group: GroupSearchResult) => {
    if (!user) {
      toast.error('Please log in to join groups');
      return;
    }

    setJoiningGroupId(group.id);
    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast.info('Already a member', { description: 'You are already in this group' });
        onJoinGroup(group.id);
        onOpenChange(false);
        return;
      }

      // Join the group
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Update member count
      await supabase
        .from('groups')
        .update({ member_count: (group.member_count || 0) + 1 })
        .eq('id', group.id);

      toast.success('Joined group!', { description: `You are now a member of ${group.name}` });
      onJoinGroup(group.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    } finally {
      setJoiningGroupId(null);
    }
  };

  // Load public groups when modal opens
  useState(() => {
    if (open) {
      handleSearch();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Find Groups</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} className="bg-gradient-accent text-accent-foreground">
              Search
            </Button>
          </div>

          {/* Results */}
          <ScrollArea className="h-[350px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No groups found</p>
                <p className="text-xs">Try a different search or create your own group</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group, i) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={group.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <Users className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{group.name}</span>
                        {group.is_public ? (
                          <Globe className="w-3 h-3 text-success shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">@{group.username}</p>
                      {group.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{group.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {group.member_count || 0} members
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="bg-gradient-accent text-accent-foreground shrink-0"
                      onClick={() => handleJoin(group)}
                      disabled={joiningGroupId === group.id}
                    >
                      {joiningGroupId === group.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Join'
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindGroupsModal;
