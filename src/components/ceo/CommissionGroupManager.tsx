import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Crown,
  Search,
  User,
  Plus,
  Pencil,
  Trash2,
  Users,
  Percent,
  DollarSign,
  Save,
  X,
} from 'lucide-react';

interface CommissionGroup {
  id: string;
  name: string;
  description: string | null;
  l1_percent: number;
  l2_percent: number;
  l2_cap: number;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  commission_group_id: string | null;
}

interface CommissionGroupManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommissionGroupManager = ({ open, onOpenChange }: CommissionGroupManagerProps) => {
  const [groups, setGroups] = useState<CommissionGroup[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGroup, setEditingGroup] = useState<CommissionGroup | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formL1, setFormL1] = useState('15');
  const [formL2, setFormL2] = useState('5');
  const [formL2Cap, setFormL2Cap] = useState('50');
  const [formIcon, setFormIcon] = useState('👤');
  const [formColor, setFormColor] = useState('#6366f1');

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        supabase.from('commission_groups').select('*').order('created_at'),
        supabase.from('profiles').select('id, full_name, username, email, avatar_url, commission_group_id').order('full_name').limit(100),
      ]);
      if (groupsRes.data) setGroups(groupsRes.data as CommissionGroup[]);
      if (usersRes.data) setUsers(usersRes.data as UserProfile[]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormL1('15');
    setFormL2('5');
    setFormL2Cap('50');
    setFormIcon('👤');
    setFormColor('#6366f1');
    setEditingGroup(null);
    setShowCreateForm(false);
  };

  const openEditForm = (group: CommissionGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormDescription(group.description || '');
    setFormL1(String(group.l1_percent));
    setFormL2(String(group.l2_percent));
    setFormL2Cap(String(group.l2_cap));
    setFormIcon(group.icon);
    setFormColor(group.color);
    setShowCreateForm(true);
  };

  const handleSaveGroup = async () => {
    if (!formName.trim()) {
      toast.error('Group name is required');
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || null,
      l1_percent: Number(formL1),
      l2_percent: Number(formL2),
      l2_cap: Number(formL2Cap),
      icon: formIcon,
      color: formColor,
      is_active: true,
    };

    try {
      if (editingGroup) {
        const { error } = await supabase.from('commission_groups').update(payload).eq('id', editingGroup.id);
        if (error) throw error;
        setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, ...payload } : g));
        toast.success('Commission group updated');
      } else {
        const { data, error } = await supabase.from('commission_groups').insert(payload).select().single();
        if (error) throw error;
        if (data) setGroups(prev => [...prev, data as CommissionGroup]);
        toast.success('Commission group created');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      // Unassign users first
      await supabase.from('profiles').update({ commission_group_id: null }).eq('commission_group_id', groupId);
      const { error } = await supabase.from('commission_groups').delete().eq('id', groupId);
      if (error) throw error;
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setUsers(prev => prev.map(u => u.commission_group_id === groupId ? { ...u, commission_group_id: null } : u));
      toast.success('Group deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete group');
    }
  };

  const handleAssignUser = async (userId: string, groupId: string | null) => {
    setUpdating(userId);
    try {
      const { error } = await supabase.from('profiles').update({ commission_group_id: groupId === 'none' ? null : groupId }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, commission_group_id: groupId === 'none' ? null : groupId } : u));
      toast.success('User commission group updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign group');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupForUser = (groupId: string | null) => groups.find(g => g.id === groupId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            Commission Group Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups">Groups & Rates</TabsTrigger>
            <TabsTrigger value="assign">Assign Users</TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            {showCreateForm ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    {editingGroup ? 'Edit Group' : 'Create New Group'}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                    <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Influencer" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
                      <Input value={formIcon} onChange={e => setFormIcon(e.target.value)} placeholder="👤" className="text-center" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                      <Input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="h-10 p-1 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief description..." rows={2} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <Percent className="w-3 h-3" /> L1 Rate
                    </label>
                    <Input type="number" value={formL1} onChange={e => setFormL1(e.target.value)} min="0" max="100" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <Percent className="w-3 h-3" /> L2 Rate
                    </label>
                    <Input type="number" value={formL2} onChange={e => setFormL2(e.target.value)} min="0" max="100" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> L2 Cap
                    </label>
                    <Input type="number" value={formL2Cap} onChange={e => setFormL2Cap(e.target.value)} min="0" />
                  </div>
                </div>

                <Button onClick={handleSaveGroup} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </Button>
              </motion.div>
            ) : (
              <Button onClick={() => setShowCreateForm(true)} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Add Commission Group
              </Button>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map(group => {
                  const userCount = users.filter(u => u.commission_group_id === group.id).length;
                  return (
                    <motion.div
                      key={group.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-border bg-card"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: group.color + '20', color: group.color }}
                        >
                          {group.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{group.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          L1: {group.l1_percent}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          L2: {group.l2_percent}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Cap: ${group.l2_cap}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {userCount}
                        </Badge>

                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(group)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Assign Users Tab */}
          <TabsContent value="assign" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => {
                  const currentGroup = getGroupForUser(user.commission_group_id);
                  return (
                    <motion.div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {user.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                        </div>
                      </div>

                      <Select
                        value={user.commission_group_id || 'none'}
                        onValueChange={val => handleAssignUser(user.id, val)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <div className="flex items-center gap-1.5">
                            {currentGroup && (
                              <span>{currentGroup.icon}</span>
                            )}
                            <SelectValue placeholder="No group" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Group (Default Rates)</SelectItem>
                          {groups.filter(g => g.is_active).map(g => (
                            <SelectItem key={g.id} value={g.id}>
                              <div className="flex items-center gap-2">
                                <span>{g.icon}</span>
                                {g.name} ({g.l1_percent}%/{g.l2_percent}%)
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CommissionGroupManager;
