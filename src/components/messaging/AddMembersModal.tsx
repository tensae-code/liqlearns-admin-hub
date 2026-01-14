import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  Users, 
  Link, 
  Copy, 
  Check, 
  Loader2,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isFriend?: boolean;
  isAlreadyMember?: boolean;
}

interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  inviteLink?: string;
  onMemberAdded: () => void;
}

const AddMembersModal = ({
  open,
  onOpenChange,
  groupId,
  inviteLink,
  onMemberAdded,
}: AddMembersModalProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());

  // Fetch existing members
  useEffect(() => {
    const fetchExistingMembers = async () => {
      if (!open) return;
      
      const { data } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);
      
      if (data) {
        setExistingMemberIds(new Set(data.map(m => m.user_id)));
      }
    };

    fetchExistingMembers();
  }, [open, groupId]);

  // Fetch friends list
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user || !profile || !open) return;

      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

      if (!friendships?.length) {
        setFriends([]);
        return;
      }

      const friendIds = friendships.map(f => 
        f.requester_id === profile.id ? f.addressee_id : f.requester_id
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', friendIds);

      if (profiles) {
        setFriends(profiles.map(p => ({
          id: p.id,
          name: p.full_name,
          username: p.username,
          avatar: p.avatar_url,
          isFriend: true,
          isAlreadyMember: existingMemberIds.has(p.id),
        })));
      }
    };

    fetchFriends();
  }, [user, profile, open, existingMemberIds]);

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || !user) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('user_id', user.id)
        .limit(20);

      // Check friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profile?.id},addressee_id.eq.${profile?.id}`);

      const friendIds = new Set<string>();
      friendships?.forEach(f => {
        if (f.requester_id === profile?.id) friendIds.add(f.addressee_id);
        else friendIds.add(f.requester_id);
      });

      if (profiles) {
        setSearchResults(profiles.map(p => ({
          id: p.id,
          name: p.full_name,
          username: p.username,
          avatar: p.avatar_url,
          isFriend: friendIds.has(p.id),
          isAlreadyMember: existingMemberIds.has(p.id),
        })));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add member to group
  const handleAddMember = async (userId: string) => {
    setAddingUserId(userId);
    
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        });

      if (error) throw error;

      toast.success('Member added successfully!');
      setExistingMemberIds(prev => new Set([...prev, userId]));
      onMemberAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member');
    } finally {
      setAddingUserId(null);
    }
  };

  // Copy invite link
  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const renderUserItem = (userItem: User) => (
    <div
      key={userItem.id}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={userItem.avatar} />
        <AvatarFallback className="bg-gradient-accent text-accent-foreground">
          {userItem.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{userItem.name}</p>
          {userItem.isFriend && (
            <Badge variant="secondary" className="text-[10px]">
              <UserCheck className="w-3 h-3 mr-1" />
              Friend
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">@{userItem.username}</p>
      </div>

      {userItem.isAlreadyMember ? (
        <Badge variant="outline" className="text-muted-foreground">
          Already member
        </Badge>
      ) : (
        <Button
          size="sm"
          onClick={() => handleAddMember(userItem.id)}
          disabled={addingUserId === userItem.id}
        >
          {addingUserId === userItem.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-1" />
              Add
            </>
          )}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-accent" />
            Add Members
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="text-xs">
              <Search className="w-3 h-3 mr-1" />
              Search
            </TabsTrigger>
            <TabsTrigger value="friends" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="link" className="text-xs">
              <Link className="w-3 h-3 mr-1" />
              Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <ScrollArea className="h-[250px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map(renderUserItem)}
                  </div>
                ) : searchQuery ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No users found</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">Search for users to add</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="friends" className="mt-4">
            <ScrollArea className="h-[300px]">
              {friends.length > 0 ? (
                <div className="space-y-1">
                  {friends.map(renderUserItem)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No friends yet</p>
                  <p className="text-xs mt-1">Add friends to see them here</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="link" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Link className="w-12 h-12 mx-auto mb-3 text-accent opacity-70" />
                <p className="text-sm text-foreground font-medium mb-2">
                  Share Invite Link
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Anyone with this link can join the group
                </p>
                
                {inviteLink ? (
                  <div className="flex gap-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="text-xs bg-background"
                    />
                    <Button onClick={handleCopyLink} size="icon">
                      {copiedLink ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Invite link not available for this group
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddMembersModal;
