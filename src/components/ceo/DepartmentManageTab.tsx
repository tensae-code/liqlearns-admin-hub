import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, ChevronRight, Users, Search, Plus, Pencil, Trash2, Coins,
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
}

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Engineering', head: 'Dawit M.', memberCount: 24, status: 'on_track' },
  { id: '2', name: 'Marketing', head: 'Sara T.', memberCount: 12, status: 'on_track' },
  { id: '3', name: 'Content', head: 'Tigist K.', memberCount: 18, status: 'needs_review' },
  { id: '4', name: 'Support', head: 'Yonas G.', memberCount: 8, status: 'on_track' },
  { id: '5', name: 'Sales', head: 'Abel H.', memberCount: 6, status: 'on_track' },
];

const SUBSCRIPTION_TIERS = [
  { key: 'free', label: 'Free', defaultPoints: 50 },
  { key: 'plus', label: 'Plus', defaultPoints: 200 },
  { key: 'pro', label: 'Pro', defaultPoints: 500 },
];

const DepartmentManageTab = () => {
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHead, setNewHead] = useState('');

  // Monthly points per tier
  const [tierPoints, setTierPoints] = useState<Record<string, number>>(
    SUBSCRIPTION_TIERS.reduce((acc, t) => ({ ...acc, [t.key]: t.defaultPoints }), {} as Record<string, number>)
  );

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
    }]);
    toast.success(`${newName} department created`);
    setAddOpen(false);
    setNewName('');
    setNewHead('');
  };

  const handleEditDept = () => {
    if (!editDept) return;
    setDepartments(prev => prev.map(d => d.id === editDept.id ? editDept : d));
    toast.success(`${editDept.name} updated`);
    setEditOpen(false);
    setEditDept(null);
  };

  const handleDeleteDept = (dept: Department) => {
    setDepartments(prev => prev.filter(d => d.id !== dept.id));
    toast.success(`${dept.name} removed`);
  };

  const handleSaveTierPoints = () => {
    toast.success('Monthly point allocations saved');
  };

  return (
    <div className="space-y-6">
      {/* Departments Card */}
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
                  className="flex items-center gap-3 py-3 px-1 group"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
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
                      onClick={() => { setEditDept({ ...dept }); setEditOpen(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => handleDeleteDept(dept)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Points per Tier */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Monthly Point Allocations</h3>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Set how many points each subscription tier receives monthly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SUBSCRIPTION_TIERS.map(tier => (
              <div key={tier.key} className="space-y-1.5">
                <Label className="text-sm font-medium">{tier.label} Tier</Label>
                <Input
                  type="number"
                  min={0}
                  value={tierPoints[tier.key]}
                  onChange={e => setTierPoints(prev => ({ ...prev, [tier.key]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>
          <Button onClick={handleSaveTierPoints} className="w-full sm:w-auto">
            Save Allocations
          </Button>
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
