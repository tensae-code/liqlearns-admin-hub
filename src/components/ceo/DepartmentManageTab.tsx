import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, ChevronRight, ChevronDown, Users, Search, Plus, Pencil, Trash2, ArrowLeft,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  head: string;
  memberCount: number;
  status: 'on_track' | 'needs_review';
  members: { id: string; name: string; email: string; avatar_url?: string; role?: string }[];
}

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Engineering', head: 'Dawit M.', memberCount: 24, status: 'on_track', members: [
    { id: 'e1', name: 'Dawit M.', email: 'dawit@example.com', role: 'Head' },
    { id: 'e2', name: 'Abebe K.', email: 'abebe@example.com', role: 'Senior Dev' },
    { id: 'e3', name: 'Hana T.', email: 'hana@example.com', role: 'Developer' },
  ]},
  { id: '2', name: 'Marketing', head: 'Sara T.', memberCount: 12, status: 'on_track', members: [
    { id: 'm1', name: 'Sara T.', email: 'sara@example.com', role: 'Head' },
    { id: 'm2', name: 'Kidist A.', email: 'kidist@example.com', role: 'Designer' },
  ]},
  { id: '3', name: 'Content', head: 'Tigist K.', memberCount: 18, status: 'needs_review', members: [
    { id: 'c1', name: 'Tigist K.', email: 'tigist@example.com', role: 'Head' },
    { id: 'c2', name: 'Yared B.', email: 'yared@example.com', role: 'Writer' },
    { id: 'c3', name: 'Meron S.', email: 'meron@example.com', role: 'Editor' },
  ]},
  { id: '4', name: 'Support', head: 'Yonas G.', memberCount: 8, status: 'on_track', members: [
    { id: 's1', name: 'Yonas G.', email: 'yonas@example.com', role: 'Head' },
    { id: 's2', name: 'Selam F.', email: 'selam@example.com', role: 'Agent' },
  ]},
  { id: '5', name: 'Sales', head: 'Abel H.', memberCount: 6, status: 'on_track', members: [
    { id: 'sa1', name: 'Abel H.', email: 'abel@example.com', role: 'Head' },
  ]},
];

const DepartmentManageTab = () => {
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHead, setNewHead] = useState('');

  // Add member to department
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.head.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDept = () => {
    if (!newName.trim()) { toast.error('Enter department name'); return; }
    setDepartments(prev => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      head: newHead.trim() || 'Unassigned',
      memberCount: 0,
      status: 'on_track',
      members: [],
    }]);
    toast.success(`${newName} department created`);
    setAddOpen(false);
    setNewName('');
    setNewHead('');
  };

  const handleEditDept = () => {
    if (!editDept) return;
    setDepartments(prev => prev.map(d => d.id === editDept.id ? editDept : d));
    if (selectedDept?.id === editDept.id) setSelectedDept(editDept);
    toast.success(`${editDept.name} updated`);
    setEditOpen(false);
    setEditDept(null);
  };

  const handleDeleteDept = (dept: Department) => {
    setDepartments(prev => prev.filter(d => d.id !== dept.id));
    if (selectedDept?.id === dept.id) setSelectedDept(null);
    toast.success(`${dept.name} removed`);
  };

  const handleAddMember = () => {
    if (!selectedDept || !newMemberName.trim()) { toast.error('Enter member name'); return; }
    const newMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole.trim() || 'Member',
    };
    const updated = {
      ...selectedDept,
      members: [...selectedDept.members, newMember],
      memberCount: selectedDept.memberCount + 1,
    };
    setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
    setSelectedDept(updated);
    setAddMemberOpen(false);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('');
    toast.success(`${newMember.name} added to ${selectedDept.name}`);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedDept) return;
    const updated = {
      ...selectedDept,
      members: selectedDept.members.filter(m => m.id !== memberId),
      memberCount: Math.max(0, selectedDept.memberCount - 1),
    };
    setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
    setSelectedDept(updated);
    toast.success('Member removed');
  };

  // Department detail view
  if (selectedDept) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDept(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{selectedDept.name}</h3>
            <p className="text-xs text-muted-foreground">Head: {selectedDept.head} · {selectedDept.members.length} members</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setEditDept({ ...selectedDept }); setEditOpen(true); }}>
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
          <Button size="sm" onClick={() => setAddMemberOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Member
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {selectedDept.members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              No members in this department yet
            </div>
          ) : (
            selectedDept.members.map((member, i) => (
              <motion.div
                key={member.id}
                className="flex items-center gap-3 p-3 group"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Avatar className="h-9 w-9">
                  {member.avatar_url && <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />}
                  <AvatarFallback className="bg-muted text-xs">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                {member.role && (
                  <Badge variant="outline" className="text-xs">{member.role}</Badge>
                )}
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            ))
          )}
        </div>

        {/* Add Member Dialog */}
        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Member to {selectedDept.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label>Name</Label>
                <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Full name" className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} placeholder="email@example.com" className="mt-1" />
              </div>
              <div>
                <Label>Role in Department</Label>
                <Input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="e.g. Developer, Designer" className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMember}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Department list view
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Departments</h3>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No departments found</div>
            ) : (
              filtered.map((dept, i) => (
                <motion.div
                  key={dept.id}
                  className="flex items-center gap-3 py-3 px-1 group cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedDept(dept)}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">Head: {dept.head}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{dept.memberCount}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${dept.status === 'needs_review'
                        ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
                        : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                      }`}
                    >
                      {dept.status === 'needs_review' ? 'Needs Review' : 'On Track'}
                    </Badge>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setEditDept({ ...dept }); setEditOpen(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Department Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Engineering" className="mt-1" />
            </div>
            <div>
              <Label>Department Head</Label>
              <Input value={newHead} onChange={e => setNewHead(e.target.value)} placeholder="e.g. John D." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDept}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { if (!o) { setEditOpen(false); setEditDept(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          {editDept && (
            <div className="space-y-3 pt-2">
              <div>
                <Label>Name</Label>
                <Input value={editDept.name} onChange={e => setEditDept({ ...editDept, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Department Head</Label>
                <Input value={editDept.head} onChange={e => setEditDept({ ...editDept, head: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={editDept.status}
                  onChange={e => setEditDept({ ...editDept, status: e.target.value as any })}
                >
                  <option value="on_track">On Track</option>
                  <option value="needs_review">Needs Review</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditDept(null); }}>Cancel</Button>
            <Button onClick={handleEditDept}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentManageTab;
