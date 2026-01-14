import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Settings,
  Link,
  Bell,
  BellOff,
  LogOut,
  UserPlus,
  Shield,
  Crown,
  Star,
  Hash,
  Megaphone,
  Mic,
  Plus,
  MoreVertical,
  Copy,
  Check,
  Trash2,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  adminTitle?: string;
  isOnline?: boolean;
}

export interface GroupChannel {
  id: string;
  name: string;
  type: 'text' | 'announcement' | 'voice';
  description?: string;
  isDefault?: boolean;
}

interface GroupInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    description?: string;
    inviteLink?: string;
    isPublic?: boolean;
    memberCount?: number;
  };
  members: GroupMember[];
  channels: GroupChannel[];
  currentUserId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  onLeaveGroup?: () => void;
  onAddMember?: () => void;
  onCreateChannel?: () => void;
  onSelectChannel?: (channel: GroupChannel) => void;
  onMemberClick?: (member: GroupMember) => void;
}

const GroupInfoSheet = ({
  open,
  onOpenChange,
  group,
  members,
  channels,
  currentUserId,
  currentUserRole,
  onLeaveGroup,
  onAddMember,
  onCreateChannel,
  onSelectChannel,
  onMemberClick
}: GroupInfoSheetProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'channels' | 'members'>('channels');

  const copyInviteLink = () => {
    if (group.inviteLink) {
      navigator.clipboard.writeText(group.inviteLink);
      setCopiedLink(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getChannelIcon = (type: GroupChannel['type']) => {
    switch (type) {
      case 'text': return <Hash className="w-4 h-4" />;
      case 'announcement': return <Megaphone className="w-4 h-4" />;
      case 'voice': return <Mic className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: GroupMember['role'], adminTitle?: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-gold/20 text-gold text-[10px]">
            <Crown className="w-3 h-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-accent/20 text-accent text-[10px]">
            <Shield className="w-3 h-3 mr-1" />
            {adminTitle || 'Admin'}
          </Badge>
        );
      default:
        return null;
    }
  };

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={group.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                <Users className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">{group.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">@{group.username}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {group.memberCount || members.length} members
              </p>
            </div>
          </div>
          
          {group.description && (
            <p className="text-sm text-muted-foreground mt-4">{group.description}</p>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={copyInviteLink}
            >
              {copiedLink ? <Check className="w-4 h-4 mr-2" /> : <Link className="w-4 h-4 mr-2" />}
              {copiedLink ? 'Copied!' : 'Invite Link'}
            </Button>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === 'channels' 
                ? "text-accent border-b-2 border-accent" 
                : "text-muted-foreground"
            )}
            onClick={() => setActiveTab('channels')}
          >
            Channels ({channels.length})
          </button>
          <button
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === 'members' 
                ? "text-accent border-b-2 border-accent" 
                : "text-muted-foreground"
            )}
            onClick={() => setActiveTab('members')}
          >
            Members ({members.length})
          </button>
        </div>

        <ScrollArea className="flex-1">
          {activeTab === 'channels' && (
            <div className="p-4">
              {canManageMembers && (
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={onCreateChannel}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Channel
                </Button>
              )}
              
              <div className="space-y-1">
                {channels.map((channel) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => onSelectChannel?.(channel)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      channel.type === 'announcement' && "bg-gold/20 text-gold",
                      channel.type === 'text' && "bg-muted text-muted-foreground",
                      channel.type === 'voice' && "bg-success/20 text-success"
                    )}>
                      {getChannelIcon(channel.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{channel.name}</p>
                      {channel.description && (
                        <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
                      )}
                    </div>
                    {channel.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">Default</Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="p-4">
              {canManageMembers && (
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={onAddMember}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Members
                </Button>
              )}

              {/* Grouped by role */}
              {['owner', 'admin', 'member'].map((role) => {
                const roleMembers = members.filter(m => m.role === role);
                if (roleMembers.length === 0) return null;
                
                return (
                  <div key={role} className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admins' : 'Members'} — {roleMembers.length}
                    </p>
                    <div className="space-y-1">
                      {roleMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                          onClick={() => onMemberClick?.(member)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                                {member.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {member.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{member.name}</span>
                              {getRoleBadge(member.role, member.adminTitle)}
                            </div>
                          </div>
                          {canManageMembers && member.id !== currentUserId && (
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onLeaveGroup}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Group
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GroupInfoSheet;
