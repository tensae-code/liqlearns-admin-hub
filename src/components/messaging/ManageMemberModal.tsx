import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Crown, Shield, User, Loader2, UserMinus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GroupMember } from './GroupInfoSheet';

interface ManageMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: GroupMember;
  groupId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  onMemberUpdated: () => void;
}

type MemberRole = 'admin' | 'member';

const ManageMemberModal = ({
  open,
  onOpenChange,
  member,
  groupId,
  currentUserRole,
  onMemberUpdated,
}: ManageMemberModalProps) => {
  const [role, setRole] = useState<MemberRole>(member.role === 'owner' ? 'admin' : member.role);
  const [adminTitle, setAdminTitle] = useState(member.adminTitle || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const canManage = currentUserRole === 'owner' || (currentUserRole === 'admin' && member.role === 'member');
  const canRemove = currentUserRole === 'owner' || (currentUserRole === 'admin' && member.role === 'member');

  const handleUpdateRole = async () => {
    if (member.role === 'owner') {
      toast.error('Cannot change owner role');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .update({
          role: role,
          admin_title: role === 'admin' ? adminTitle.trim() || null : null,
        })
        .eq('group_id', groupId)
        .eq('user_id', member.id);

      if (error) throw error;

      toast.success('Member updated!', {
        description: role === 'admin' 
          ? `${member.name} is now an admin` 
          : `${member.name} is now a regular member`
      });
      onMemberUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (member.role === 'owner') {
      toast.error('Cannot remove the owner');
      return;
    }

    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', member.id);

      if (error) throw error;

      // Update member count
      const { data: group } = await supabase
        .from('groups')
        .select('member_count')
        .eq('id', groupId)
        .single();
      
      if (group) {
        await supabase
          .from('groups')
          .update({ member_count: Math.max(0, (group.member_count || 1) - 1) })
          .eq('id', groupId);
      }

      toast.success('Member removed', { description: `${member.name} has been removed from the group` });
      onMemberUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member', { description: error.message });
    } finally {
      setIsRemoving(false);
    }
  };

  const roleOptions = [
    {
      value: 'admin' as MemberRole,
      label: 'Admin',
      description: 'Can manage members, channels, and moderate content',
      icon: Shield,
      color: 'text-accent',
    },
    {
      value: 'member' as MemberRole,
      label: 'Member',
      description: 'Regular member with standard permissions',
      icon: User,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                {member.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-foreground">{member.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {member.role === 'owner' ? (
                  <Badge className="bg-gold/20 text-gold text-[10px]">
                    <Crown className="w-3 h-3 mr-1" />
                    Owner
                  </Badge>
                ) : member.role === 'admin' ? (
                  <Badge className="bg-accent/20 text-accent text-[10px]">
                    <Shield className="w-3 h-3 mr-1" />
                    {member.adminTitle || 'Admin'}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Member</Badge>
                )}
              </div>
            </div>
          </div>

          {member.role === 'owner' ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              The owner's role cannot be changed
            </p>
          ) : canManage ? (
            <>
              {/* Role Selection */}
              <div className="space-y-3">
                <Label>Role</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setRole(v as MemberRole)}
                  className="space-y-2"
                >
                  {roleOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        role === option.value
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-muted ${option.color}`}>
                        <option.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Admin Title (if admin) */}
              {role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="admin-title">Admin Title (optional)</Label>
                  <Input
                    id="admin-title"
                    placeholder="e.g., Moderator, Support Lead"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom title shown next to their name
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading || isRemoving}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-accent text-accent-foreground"
                  onClick={handleUpdateRole}
                  disabled={isLoading || isRemoving}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>

              {/* Remove Member */}
              {canRemove && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleRemoveMember}
                  disabled={isLoading || isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserMinus className="w-4 h-4 mr-2" />
                  )}
                  Remove from Group
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              You don't have permission to manage this member
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMemberModal;
