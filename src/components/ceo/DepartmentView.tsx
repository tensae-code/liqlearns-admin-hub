import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Crown, Shield, Star, GraduationCap, HeadphonesIcon,
  Building2, Baby, BookOpen, Users, Search, ChevronRight,
} from 'lucide-react';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
    iconColor: 'text-amber-500',
    statusColor: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: Shield,
    roles: ['admin'],
    iconColor: 'text-red-500',
    statusColor: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    key: 'education',
    label: 'Education',
    icon: GraduationCap,
    roles: ['senior_teacher', 'teacher'],
    iconColor: 'text-blue-500',
    statusColor: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    key: 'support',
    label: 'Support',
    icon: HeadphonesIcon,
    roles: ['support'],
    iconColor: 'text-emerald-500',
    statusColor: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    icon: Building2,
    roles: ['enterprise'],
    iconColor: 'text-cyan-500',
    statusColor: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    key: 'parents',
    label: 'Parents',
    icon: Baby,
    roles: ['parent'],
    iconColor: 'text-pink-500',
    statusColor: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    key: 'students',
    label: 'Students',
    icon: BookOpen,
    roles: ['student'],
    iconColor: 'text-violet-500',
    statusColor: 'text-emerald-600 bg-emerald-500/10',
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
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredMembers = searchQuery.trim()
    ? members.filter(m =>
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  // When searching, show flat filtered results
  if (searchQuery.trim()) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search departments by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No members found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMembers.map(member => (
              <div key={member.user_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <Avatar className="h-9 w-9">
                  {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                  <AvatarFallback className="bg-muted text-xs">
                    {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <Badge variant="outline" className="text-xs">{ROLE_LABELS[member.role] || member.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search departments by name or email..."
          className="pl-10"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {DEPARTMENTS.map((dept, deptIdx) => {
          const deptMembers = filteredMembers.filter(m => dept.roles.includes(m.role));
          const DeptIcon = dept.icon;
          const head = deptMembers[0];
          const onHoldCount = deptMembers.filter(m => m.is_on_hold).length;

          return (
            <Collapsible key={dept.key}>
              <CollapsibleTrigger className="w-full">
                <motion.div
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: deptIdx * 0.04 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <DeptIcon className={`w-5 h-5 ${dept.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-foreground text-sm">{dept.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {head ? `Head: ${head.full_name}` : 'No members'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{deptMembers.length}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${onHoldCount > 0 ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' : dept.statusColor + ' border-emerald-500/20'}`}
                    >
                      {onHoldCount > 0 ? 'Needs Review' : 'On Track'}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-3 space-y-1.5 bg-muted/30">
                  {deptMembers.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">No members in this department</p>
                  ) : (
                    deptMembers.map(member => (
                      <div
                        key={member.user_id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg bg-background ${member.is_on_hold ? 'opacity-50' : ''}`}
                      >
                        <Avatar className="h-7 w-7">
                          {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                          <AvatarFallback className="bg-muted text-[10px]">
                            {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{member.full_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {ROLE_LABELS[member.role]}
                          {member.is_on_hold && ' · Hold'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentView;
