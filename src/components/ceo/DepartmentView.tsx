import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Crown, Shield, Star, GraduationCap, HeadphonesIcon,
  Building2, Baby, BookOpen, Users,
} from 'lucide-react';

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

const DEPARTMENTS = [
  {
    key: 'leadership',
    label: 'Leadership',
    icon: Crown,
    roles: ['ceo'],
    gradient: 'from-amber-500/20 to-yellow-500/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-500',
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: Shield,
    roles: ['admin'],
    gradient: 'from-red-500/20 to-rose-500/10',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-500',
  },
  {
    key: 'education',
    label: 'Education',
    icon: GraduationCap,
    roles: ['senior_teacher', 'teacher'],
    gradient: 'from-blue-500/20 to-indigo-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-500',
  },
  {
    key: 'support',
    label: 'Support',
    icon: HeadphonesIcon,
    roles: ['support'],
    gradient: 'from-emerald-500/20 to-green-500/10',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-500',
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    icon: Building2,
    roles: ['enterprise'],
    gradient: 'from-cyan-500/20 to-sky-500/10',
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-500',
  },
  {
    key: 'parents',
    label: 'Parents',
    icon: Baby,
    roles: ['parent'],
    gradient: 'from-pink-500/20 to-fuchsia-500/10',
    borderColor: 'border-pink-500/30',
    iconColor: 'text-pink-500',
  },
  {
    key: 'students',
    label: 'Students',
    icon: BookOpen,
    roles: ['student'],
    gradient: 'from-violet-500/20 to-purple-500/10',
    borderColor: 'border-violet-500/30',
    iconColor: 'text-violet-500',
  },
];

const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO',
  admin: 'Admin',
  senior_teacher: 'Senior Teacher',
  teacher: 'Teacher',
  support: 'Support',
  enterprise: 'Enterprise',
  parent: 'Parent',
  student: 'Student',
};

interface DepartmentViewProps {
  members: TeamMember[];
  loading: boolean;
}

const DepartmentView = ({ members, loading }: DepartmentViewProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {DEPARTMENTS.map((dept, deptIdx) => {
        const deptMembers = members.filter(m => dept.roles.includes(m.role));
        const DeptIcon = dept.icon;

        return (
          <motion.div
            key={dept.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: deptIdx * 0.06 }}
          >
            <Card className={`bg-gradient-to-br ${dept.gradient} ${dept.borderColor} border`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <DeptIcon className={`w-5 h-5 ${dept.iconColor}`} />
                    {dept.label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {deptMembers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deptMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No members</p>
                ) : (
                  deptMembers.slice(0, 10).map(member => (
                    <div
                      key={member.user_id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg bg-background/60 ${member.is_on_hold ? 'opacity-50' : ''}`}
                    >
                      <Avatar className="h-8 w-8">
                        {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                        <AvatarFallback className="bg-muted text-xs">
                          {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.full_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {ROLE_LABELS[member.role] || member.role}
                          {member.is_on_hold && ' · On Hold'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {deptMembers.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{deptMembers.length - 10} more
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DepartmentView;
