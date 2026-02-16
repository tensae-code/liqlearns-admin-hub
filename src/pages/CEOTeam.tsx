import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { STAT_GRADIENTS } from '@/lib/theme';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, ArrowLeft, Mail, Plus, Search, Filter, MoreVertical,
  UserCheck, UserPlus, Shield, Crown, GraduationCap, HeadphonesIcon,
  Building2, Baby, BookOpen, Trash2, ChevronDown, Star,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import DepartmentView from '@/components/ceo/DepartmentView';

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  is_on_hold: boolean;
}

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  ceo: { label: 'CEO', icon: Crown, color: 'text-amber-500' },
  admin: { label: 'Admin', icon: Shield, color: 'text-red-500' },
  senior_teacher: { label: 'Senior Teacher', icon: Star, color: 'text-purple-500' },
  teacher: { label: 'Teacher', icon: GraduationCap, color: 'text-blue-500' },
  support: { label: 'Support', icon: HeadphonesIcon, color: 'text-green-500' },
  enterprise: { label: 'Enterprise', icon: Building2, color: 'text-cyan-500' },
  parent: { label: 'Parent', icon: Baby, color: 'text-pink-500' },
  student: { label: 'Student', icon: BookOpen, color: 'text-foreground' },
};

const ASSIGNABLE_ROLES = ['student', 'teacher', 'senior_teacher', 'support', 'admin', 'parent', 'enterprise'];

const CEOTeam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('members');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  // Add member
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('student');
  const [addLoading, setAddLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: roles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');
      if (rolesErr) throw rolesErr;

      if (!roles || roles.length === 0) {
        setMembers([]);
        return;
      }

      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, avatar_url, is_on_hold')
        .in('user_id', userIds);
      if (profErr) throw profErr;

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      const merged: TeamMember[] = (roles || []).map(r => {
        const p = profileMap[r.user_id];
        return {
          id: p?.id || r.user_id,
          user_id: r.user_id,
          full_name: p?.full_name || 'Unknown',
          email: p?.email || '',
          avatar_url: p?.avatar_url || null,
          role: r.role,
          created_at: r.created_at,
          is_on_hold: p?.is_on_hold || false,
        };
      });

      setMembers(merged);
    } catch (err: any) {
      console.error('Error fetching team:', err);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleChangeRole = async (member: TeamMember, newRole: string) => {
    if (member.role === newRole) return;
    if (member.role === 'ceo') {
      toast.error("Cannot change the CEO's role");
      return;
    }
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', member.user_id);
      if (error) throw error;

      setMembers(prev => prev.map(m =>
        m.user_id === member.user_id ? { ...m, role: newRole } : m
      ));
      toast.success(`${member.full_name} is now ${ROLE_CONFIG[newRole]?.label || newRole}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deleteTarget.user_id);
      if (error) throw error;

      setMembers(prev => prev.filter(m => m.user_id !== deleteTarget.user_id));
      toast.success(`${deleteTarget.full_name} removed from team`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleToggleHold = async (member: TeamMember) => {
    const newHold = !member.is_on_hold;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_on_hold: newHold, held_at: newHold ? new Date().toISOString() : null })
        .eq('user_id', member.user_id);
      if (error) throw error;

      setMembers(prev => prev.map(m =>
        m.user_id === member.user_id ? { ...m, is_on_hold: newHold } : m
      ));
      toast.success(newHold ? `${member.full_name} put on hold` : `${member.full_name} hold removed`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddByEmail = async () => {
    if (!addEmail.trim()) { toast.error('Enter an email'); return; }
    setAddLoading(true);
    try {
      // Find user by email
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('email', addEmail.trim())
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile) { toast.error('No user found with that email'); setAddLoading(false); return; }

      // Check if already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (existingRole) {
        // Update role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: addRole as any })
          .eq('user_id', profile.user_id);
        if (error) throw error;
        toast.success(`${profile.full_name}'s role updated to ${ROLE_CONFIG[addRole]?.label}`);
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: profile.user_id, role: addRole } as any);
        if (error) throw error;
        toast.success(`${profile.full_name} added as ${ROLE_CONFIG[addRole]?.label}`);
      }

      setAddOpen(false);
      setAddEmail('');
      setAddRole('student');
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setAddLoading(false);
    }
  };

  // Counts
  const roleCounts = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = members.filter(m => {
    const matchSearch = m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const teamStats = [
    { label: 'Total Users', value: members.length, icon: Users, gradient: STAT_GRADIENTS[0] },
    { label: 'Teachers', value: (roleCounts['teacher'] || 0) + (roleCounts['senior_teacher'] || 0), icon: GraduationCap, gradient: STAT_GRADIENTS[2] },
    { label: 'Admins', value: roleCounts['admin'] || 0, icon: Shield, gradient: STAT_GRADIENTS[1] },
    { label: 'Students', value: roleCounts['student'] || 0, icon: BookOpen, gradient: STAT_GRADIENTS[3] },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ceo')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                Team Management
              </h1>
              <p className="text-muted-foreground">Manage roles, seniority, and access</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ToggleGroup type="single" value={viewMode} onValueChange={v => v && setViewMode(v)} className="bg-muted rounded-lg p-0.5">
              <ToggleGroupItem value="members" className="text-xs gap-1 px-3 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
                <Users className="w-3.5 h-3.5" />
                Members
              </ToggleGroupItem>
              <ToggleGroupItem value="departments" className="text-xs gap-1 px-3 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
                <Building2 className="w-3.5 h-3.5" />
                Departments
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add / Change Role
          </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {teamStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
              <stat.icon className="w-5 h-5 md:w-6 md:h-6 mb-2 opacity-90" />
              <p className="text-xl md:text-2xl font-display font-bold">{stat.value}</p>
              <p className="text-xs opacity-80">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {viewMode === 'members' ? (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label} ({roleCounts[key] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Members List */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No members found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((member, i) => {
                  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.student;
                  const RoleIcon = cfg.icon;
                  const isSelf = member.user_id === user?.id;

                  return (
                    <motion.div
                      key={member.user_id}
                      className={`flex items-center gap-3 p-3 bg-card border rounded-xl ${member.is_on_hold ? 'border-destructive/30 opacity-60' : 'border-border'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    >
                      <Avatar className="h-10 w-10">
                        {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                        <AvatarFallback className="bg-muted text-sm">
                          {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm truncate">{member.full_name}</p>
                          {member.is_on_hold && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">On Hold</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>

                      <Badge variant="outline" className={`text-xs gap-1 ${cfg.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>

                      {!isSelf && member.role !== 'ceo' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Shield className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {ASSIGNABLE_ROLES.map(role => {
                                  const rc = ROLE_CONFIG[role];
                                  const Icon = rc.icon;
                                  return (
                                    <DropdownMenuItem
                                      key={role}
                                      onClick={() => handleChangeRole(member, role)}
                                      className={member.role === role ? 'bg-accent/10 font-semibold' : ''}
                                    >
                                      <Icon className={`w-4 h-4 mr-2 ${rc.color}`} />
                                      {rc.label}
                                      {member.role === role && ' ✓'}
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem onClick={() => handleToggleHold(member)}>
                              <UserCheck className="w-4 h-4 mr-2" />
                              {member.is_on_hold ? 'Remove Hold' : 'Put on Hold'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(member)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <DepartmentView members={members} loading={loading} />
        )}
      </div>

      {/* Add/Change Role Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Add or Change User Role
            </DialogTitle>
            <DialogDescription>
              Enter a user's email to assign or change their role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>User Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map(role => {
                    const rc = ROLE_CONFIG[role];
                    const Icon = rc.icon;
                    return (
                      <SelectItem key={role} value={role}>
                        <span className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${rc.color}`} />
                          {rc.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddByEmail} disabled={addLoading}>
              {addLoading ? 'Processing...' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove their role from the system. They will lose access to their current dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CEOTeam;
