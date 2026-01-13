import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { STAT_GRADIENTS } from '@/lib/theme';
import { 
  Users, 
  TrendingUp, 
  Share2,
  Copy,
  ChevronRight,
  Target,
  ArrowUpRight,
  Crown,
  Star,
  Zap,
  Building2,
  UserPlus,
  BookOpen,
  Shield,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

const EnterpriseDashboard = () => {
  const [enterpriseCode] = useState('GUILD-PHOENIX-2026');

  const copyEnterpriseCode = () => {
    navigator.clipboard.writeText(enterpriseCode);
    toast.success('Enterprise invite code copied!');
  };

  const enterprise = {
    name: 'Phoenix Academy',
    members: 145,
    activeCourses: 12,
    completionRate: 78,
  };

  const earnings = {
    thisMonth: 4500,
    growth: 40.6,
  };

  const network = {
    directMembers: 45,
    departments: 5,
    instructors: 8,
    totalTeam: 145,
  };

  const guildRanks = [
    { name: 'Starter Guild', requirement: '10 members', achieved: true, perks: 'Basic features' },
    { name: 'Rising Guild', requirement: '50 members', achieved: true, perks: 'Custom branding' },
    { name: 'Elite Guild', requirement: '100 members', achieved: false, perks: 'Priority support', current: true },
    { name: 'Master Guild', requirement: '250 members', achieved: false, perks: 'API access' },
    { name: 'Legendary Guild', requirement: '500 members', achieved: false, perks: 'White label' },
  ];

  const recentMembers = [
    { name: 'Alemayehu M.', date: '2 hours ago', department: 'Engineering', progress: 78 },
    { name: 'Sara T.', date: '1 day ago', department: 'Marketing', progress: 45 },
    { name: 'Dawit B.', date: '3 days ago', department: 'Sales', progress: 92 },
    { name: 'Tigist K.', date: '5 days ago', department: 'HR', progress: 34 },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                {enterprise.name} 🏰
              </h1>
              <p className="text-muted-foreground">Enterprise Guild Dashboard</p>
            </div>
          </div>
          <Badge className="bg-gold/10 text-gold border-gold/30 text-sm px-3 py-1">
            <Crown className="w-4 h-4 mr-1" />
            Rising Guild
          </Badge>
        </div>
      </motion.div>

      {/* Enterprise Invite Code */}
      <motion.div
        className="bg-gradient-hero text-primary-foreground rounded-2xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-primary-foreground/70 mb-1">Guild Invite Code</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-display font-bold tracking-wider">{enterpriseCode}</span>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={copyEnterpriseCode}
                className="bg-white/20 hover:bg-white/30 text-primary-foreground"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-primary-foreground">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button className="bg-white text-accent hover:bg-white/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Members
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Members', value: network.totalTeam, icon: Users, gradient: STAT_GRADIENTS[0] },
          { label: 'Active Courses', value: enterprise.activeCourses, icon: BookOpen, gradient: STAT_GRADIENTS[1] },
          { label: 'This Month', value: `${earnings.thisMonth.toLocaleString()} ETB`, icon: Wallet, gradient: STAT_GRADIENTS[2], change: `+${earnings.growth}%` },
          { label: 'Completion', value: `${enterprise.completionRate}%`, icon: TrendingUp, gradient: STAT_GRADIENTS[3] },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
            <stat.icon className="w-5 h-5 md:w-6 md:h-6 mb-2 opacity-90" />
            <p className="text-xl md:text-2xl font-display font-bold">{stat.value}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-80">{stat.label}</p>
              {stat.change && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Members Overview */}
        <motion.div
          className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Recent Members</h2>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.department}</p>
                  </div>
                </div>
                <Badge className="bg-accent/10 text-accent border-accent/30">
                  {member.progress}% complete
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Guild Rank */}
        <motion.div
          className="bg-card rounded-xl border border-border p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-display font-semibold text-foreground">Guild Rank</h2>
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to Elite</span>
              <span className="font-medium text-accent">{network.totalTeam}/100</span>
            </div>
            <Progress value={network.totalTeam} className="h-3" />
          </div>
          <div className="space-y-2">
            {guildRanks.slice(0, 3).map((rank) => (
              <div 
                key={rank.name} 
                className={`flex items-center gap-3 p-2 rounded-lg border ${
                  rank.current ? 'border-gold/50 bg-gold/5' : rank.achieved ? 'border-success/30 bg-success/5' : 'border-border'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  rank.achieved ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {rank.achieved ? <Star className="w-3 h-3" /> : <Target className="w-3 h-3" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${rank.current ? 'text-gold' : rank.achieved ? 'text-success' : 'text-foreground'}`}>
                    {rank.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseDashboard;
