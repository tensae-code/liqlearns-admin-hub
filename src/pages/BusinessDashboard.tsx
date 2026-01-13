import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EarningsPanel from '@/components/dashboard/EarningsPanel';
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
  Gift,
  UserPlus,
  Network,
  Layers,
  Trophy,
  Rocket
} from 'lucide-react';
import { toast } from 'sonner';

const BusinessDashboard = () => {
  const [referralCode] = useState('LIQ-LEARN-2026');

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const referralStats = {
    directReferrals: 24,
    teamSize: 156,
    activeMembers: 89,
    pendingInvites: 5,
  };

  const monthlyGoals = {
    referrals: { current: 8, target: 15, reward: '500 ETB bonus' },
    teamSales: { current: 12500, target: 20000, reward: '2x commission' },
  };

  const ranks = [
    { name: 'Starter', requirement: '0 referrals', achieved: true, icon: Star, color: 'text-muted-foreground' },
    { name: 'Builder', requirement: '5 referrals', achieved: true, icon: Zap, color: 'text-accent' },
    { name: 'Leader', requirement: '15 referrals', achieved: true, icon: Crown, color: 'text-primary' },
    { name: 'Ambassador', requirement: '50 referrals', achieved: false, current: true, icon: Trophy, color: 'text-gold' },
    { name: 'Diamond', requirement: '100 referrals', achieved: false, icon: Rocket, color: 'text-success' },
  ];

  const topReferrers = [
    { name: 'Kidus A.', referrals: 45, earnings: 12500, avatar: 'K' },
    { name: 'Meron T.', referrals: 38, earnings: 10200, avatar: 'M' },
    { name: 'Yonas B.', referrals: 32, earnings: 8900, avatar: 'Y' },
    { name: 'Bethel G.', referrals: 28, earnings: 7500, avatar: 'B' },
    { name: 'You', referrals: 24, earnings: 6800, avatar: 'U', isUser: true },
  ];

  const recentReferrals = [
    { name: 'Hanna K.', date: '2 hours ago', status: 'active', coursesCompleted: 3 },
    { name: 'Robel M.', date: '1 day ago', status: 'active', coursesCompleted: 1 },
    { name: 'Selam T.', date: '3 days ago', status: 'pending', coursesCompleted: 0 },
    { name: 'Abel D.', date: '5 days ago', status: 'active', coursesCompleted: 5 },
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
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
              Business Hub 💼
            </h1>
            <p className="text-muted-foreground">Track your referrals, earnings, and network growth</p>
          </div>
          <Badge className="bg-gold/10 text-gold border-gold/30 text-sm px-3 py-1">
            <Crown className="w-4 h-4 mr-1" />
            Leader Rank
          </Badge>
        </div>
      </motion.div>

      {/* Referral Code Banner */}
      <motion.div
        className="bg-gradient-hero text-primary-foreground rounded-2xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-primary-foreground/70 mb-1">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-display font-bold tracking-wider">{referralCode}</span>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={copyReferralCode}
                className="bg-white/20 hover:bg-white/30 text-primary-foreground"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/60 mt-2">
              Earn 10% commission on every referral's purchases
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-primary-foreground">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button className="bg-white text-accent hover:bg-white/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Friends
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Direct Referrals', value: referralStats.directReferrals, icon: UserPlus, gradient: STAT_GRADIENTS[0] },
          { label: 'Team Size', value: referralStats.teamSize, icon: Network, gradient: STAT_GRADIENTS[1] },
          { label: 'Active Members', value: referralStats.activeMembers, icon: Users, gradient: STAT_GRADIENTS[2] },
          { label: 'Pending Invites', value: referralStats.pendingInvites, icon: Gift, gradient: STAT_GRADIENTS[3] },
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
            <p className="text-xs opacity-80">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Goals */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-display font-semibold text-foreground">Monthly Goals</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">New Referrals</span>
                  <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                    {monthlyGoals.referrals.reward}
                  </Badge>
                </div>
                <Progress value={(monthlyGoals.referrals.current / monthlyGoals.referrals.target) * 100} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{monthlyGoals.referrals.current} of {monthlyGoals.referrals.target}</span>
                  <span>{Math.round((monthlyGoals.referrals.current / monthlyGoals.referrals.target) * 100)}%</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Team Sales</span>
                  <Badge className="bg-gold/10 text-gold border-gold/30 text-xs">
                    {monthlyGoals.teamSales.reward}
                  </Badge>
                </div>
                <Progress value={(monthlyGoals.teamSales.current / monthlyGoals.teamSales.target) * 100} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{monthlyGoals.teamSales.current.toLocaleString()} of {monthlyGoals.teamSales.target.toLocaleString()} ETB</span>
                  <span>{Math.round((monthlyGoals.teamSales.current / monthlyGoals.teamSales.target) * 100)}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Referrals */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-foreground">Recent Referrals</h2>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {recentReferrals.map((referral, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                      {referral.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{referral.name}</p>
                      <p className="text-xs text-muted-foreground">{referral.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={referral.status === 'active' ? 'bg-success/10 text-success border-success/30' : 'bg-gold/10 text-gold border-gold/30'}>
                      {referral.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{referral.coursesCompleted} courses</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Referrers Leaderboard */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-display font-semibold text-foreground">Top Referrers</h2>
            </div>
            <div className="space-y-2">
              {topReferrers.map((referrer, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 p-3 rounded-lg ${referrer.isUser ? 'bg-accent/10 border border-accent/30' : 'bg-muted/30'}`}
                >
                  <span className="w-6 text-center font-bold text-muted-foreground">#{i + 1}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${referrer.isUser ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'}`}>
                    {referrer.avatar}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${referrer.isUser ? 'text-accent' : 'text-foreground'}`}>{referrer.name}</p>
                    <p className="text-xs text-muted-foreground">{referrer.referrals} referrals</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">{referrer.earnings.toLocaleString()} ETB</p>
                    <p className="text-xs text-muted-foreground">earnings</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Earnings Panel */}
          <EarningsPanel />

          {/* Rank Progress */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Rank Progress</h2>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress to Ambassador</span>
                <span className="font-medium text-accent">{referralStats.directReferrals}/50</span>
              </div>
              <Progress value={(referralStats.directReferrals / 50) * 100} className="h-3" />
            </div>
            <div className="space-y-2">
              {ranks.map((rank) => (
                <div 
                  key={rank.name} 
                  className={`flex items-center gap-3 p-2 rounded-lg border ${
                    rank.current ? 'border-gold/50 bg-gold/5' : rank.achieved ? 'border-success/30 bg-success/5' : 'border-border'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    rank.achieved ? 'bg-success/20' : 'bg-muted'
                  }`}>
                    <rank.icon className={`w-4 h-4 ${rank.achieved ? 'text-success' : rank.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${rank.current ? 'text-gold' : rank.achieved ? 'text-success' : 'text-foreground'}`}>
                      {rank.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{rank.requirement}</p>
                  </div>
                  {rank.achieved && <Star className="w-4 h-4 text-success" />}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessDashboard;
