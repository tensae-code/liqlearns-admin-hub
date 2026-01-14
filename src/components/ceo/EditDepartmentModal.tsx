import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Building2,
  DollarSign,
  Save,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Department {
  name: string;
  head: string;
  headEmail: string;
  employees: number;
  growth: string;
  budget?: string;
}

interface EditDepartmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  allHeads: Array<{ name: string; email: string }>;
}

const EditDepartmentModal = ({ open, onOpenChange, department, allHeads }: EditDepartmentModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    head: '',
    headEmail: '',
    budget: '',
    description: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        head: department.head,
        headEmail: department.headEmail,
        budget: department.budget || '',
        description: '',
      });
    }
  }, [department]);

  const handleSubmit = () => {
    if (!formData.name || !formData.head) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success(`Department "${formData.name}" updated successfully`);
    onOpenChange(false);
  };

  const handleDelete = () => {
    toast.success(`Department "${formData.name}" has been deleted`);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  if (!department) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-primary" />
            Edit Department
          </DialogTitle>
          <DialogDescription>
            Update department details and settings.
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-destructive/10 rounded-lg border border-destructive/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="font-semibold text-foreground">Delete Department?</h3>
                <p className="text-sm text-muted-foreground">
                  This will remove "{department.name}" and reassign all {department.employees} members.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Department
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-4"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="deptName">Department Name *</Label>
                <Input
                  id="deptName"
                  placeholder="e.g., Engineering"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Department Head *</Label>
                <Select
                  value={formData.head}
                  onValueChange={(value) => {
                    const selectedHead = allHeads.find(h => h.name === value);
                    setFormData({ 
                      ...formData, 
                      head: value,
                      headEmail: selectedHead?.email || '' 
                    });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department head" />
                  </SelectTrigger>
                  <SelectContent>
                    {allHeads.map((head) => (
                      <SelectItem key={head.name} value={head.name}>
                        {head.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budget">Annual Budget</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="text"
                    placeholder="e.g., $450K"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of department responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{department.employees}</span> team members · 
                  <span className="text-success ml-1">{department.growth}</span> this month
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditDepartmentModal;
