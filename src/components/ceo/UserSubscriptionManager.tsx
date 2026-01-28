import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Crown,
  Search,
  User,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
}

interface UserSubscriptionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  { value: 'trial', label: 'Trial', icon: Clock, color: 'text-muted-foreground' },
  { value: 'active', label: 'Active (Premium)', icon: CheckCircle, color: 'text-success' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-destructive' },
  { value: 'expired', label: 'Expired', icon: XCircle, color: 'text-destructive' },
];

const planOptions = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
];

const UserSubscriptionManager = ({ open, onOpenChange }: UserSubscriptionManagerProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, username, email, avatar_url, subscription_status, subscription_plan')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, subscription_status: newStatus } : u
      ));
      toast.success('Subscription status updated');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handlePlanChange = async (userId: string, newPlan: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_plan: newPlan })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, subscription_plan: newPlan } : u
      ));
      toast.success('Subscription plan updated');
    } catch (err) {
      console.error('Error updating plan:', err);
      toast.error('Failed to update plan');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = (status: string | null) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            User Subscription Manager
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const statusConfig = getStatusConfig(user.subscription_status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </div>

                  {/* Status & Plan Controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 sm:flex-none">
                      <Select
                        value={user.subscription_status || 'trial'}
                        onValueChange={(value) => handleStatusChange(user.id, value)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <option.icon className={`w-3 h-3 ${option.color}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 sm:flex-none">
                      <Select
                        value={user.subscription_plan || 'free'}
                        onValueChange={(value) => handlePlanChange(user.id, value)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {planOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {user.subscription_status === 'active' && (
                      <Badge variant="secondary" className="bg-success/10 text-success text-[10px] hidden sm:inline-flex">
                        <Crown className="w-3 h-3 mr-1" />
                        PRO
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserSubscriptionManager;
