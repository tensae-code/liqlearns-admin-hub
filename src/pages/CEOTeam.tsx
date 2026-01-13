import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { STAT_GRADIENTS } from '@/lib/theme';
import {
  Users,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Plus,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  UserCheck,
  UserPlus,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const CEOTeam = () => {
  const navigate = useNavigate();

  const teamStats = [
    { label: 'Total Employees', value: '86', icon: Users, gradient: STAT_GRADIENTS[0] },
    { label: 'Active Today', value: '72', icon: UserCheck, gradient: STAT_GRADIENTS[2] },
    { label: 'New This Month', value: '5', icon: UserPlus, gradient: STAT_GRADIENTS[1] },
    { label: 'Avg. Tenure', value: '2.3 yrs', icon: Clock, gradient: STAT_GRADIENTS[3] },
  ];

  const departments = [
    { 
      name: 'Engineering', 
      head: 'Dawit M.', 
      headEmail: 'dawit@liqlearns.com',
      employees: 24, 
      growth: '+3',
      members: [
        { name: 'Abel T.', role: 'Senior Developer', avatar: 'AT' },
        { name: 'Hana G.', role: 'Frontend Lead', avatar: 'HG' },
        { name: 'Yosef K.', role: 'Backend Developer', avatar: 'YK' },
      ]
    },
    { 
      name: 'Marketing', 
      head: 'Sara T.', 
      headEmail: 'sara@liqlearns.com',
      employees: 12, 
      growth: '+2',
      members: [
        { name: 'Meron H.', role: 'Content Manager', avatar: 'MH' },
        { name: 'Daniel B.', role: 'Social Media', avatar: 'DB' },
      ]
    },
    { 
      name: 'Content', 
      head: 'Tigist K.', 
      headEmail: 'tigist@liqlearns.com',
      employees: 18, 
      growth: '+4',
      members: [
        { name: 'Bethel M.', role: 'Course Creator', avatar: 'BM' },
        { name: 'Solomon A.', role: 'Video Editor', avatar: 'SA' },
        { name: 'Rahel Y.', role: 'Curriculum Designer', avatar: 'RY' },
      ]
    },
    { 
      name: 'Support', 
      head: 'Yonas G.', 
      headEmail: 'yonas@liqlearns.com',
      employees: 8, 
      growth: '+1',
      members: [
        { name: 'Kidus L.', role: 'Support Lead', avatar: 'KL' },
        { name: 'Marta S.', role: 'Support Agent', avatar: 'MS' },
      ]
    },
    { 
      name: 'Finance', 
      head: 'Abebe W.', 
      headEmail: 'abebe@liqlearns.com',
      employees: 6, 
      growth: '0',
      members: [
        { name: 'Eyob T.', role: 'Accountant', avatar: 'ET' },
      ]
    },
    { 
      name: 'HR', 
      head: 'Meseret A.', 
      headEmail: 'meseret@liqlearns.com',
      employees: 4, 
      growth: '+1',
      members: [
        { name: 'Liya N.', role: 'Recruiter', avatar: 'LN' },
      ]
    },
  ];

  const handleAddMember = () => {
    toast.info('Add team member feature coming soon!');
  };

  const handleContactHead = (email: string) => {
    toast.success(`Opening email to ${email}`);
  };

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
              <p className="text-muted-foreground">Manage your organization's team members</p>
            </div>
          </div>
          <Button onClick={handleAddMember}>
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </motion.div>

        {/* Team Stats */}
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

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search team members..." className="pl-10" />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Departments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => (
            <motion.div
              key={dept.name}
              className="bg-card border border-border rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              {/* Department Header */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{dept.name}</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{dept.employees} members</span>
                  {dept.growth !== '0' && (
                    <span className="text-success flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {dept.growth}
                    </span>
                  )}
                </div>
              </div>

              {/* Department Head */}
              <div className="p-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-2">Department Head</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-hero text-primary-foreground text-sm">
                        {dept.head.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{dept.head}</p>
                      <p className="text-xs text-muted-foreground">{dept.headEmail}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleContactHead(dept.headEmail)}>
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Team Members Preview */}
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-3">Team Members</p>
                <div className="space-y-2">
                  {dept.members.map((member) => (
                    <div key={member.name} className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-3 text-xs" size="sm">
                  View All {dept.employees} Members
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CEOTeam;
