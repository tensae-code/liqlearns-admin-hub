import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Share2,
  Copy,
  ChevronRight,
  Award,
  Target,
  Wallet,
  ArrowUpRight,
  Crown,
  Star,
  Gift,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

const BusinessDashboard = () => {
  const [referralCode] = useState('LIQLEARN-ABC123');

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const earnings = {
    thisMonth: 4500,
    lastMonth: 3200,
    total: 28750,
    pending: 1200,
    growth: 40.6,
  };

  const network = {
    directReferrals: 12,
    level2: 38,
    level3: 95,
    activeUsers: 89,
    totalTeam: 145,
  };

  const ranks = [
    { name: 'Bronze', requirement: '5 referrals', achieved: true, bonus: '5%' },
    { name: 'Silver', requirement: '15 referrals', achieved: true, bonus: '10%' },
    { name: 'Gold', requirement: '30 referrals', achieved: false, bonus: '15%', current: true },
    { name: 'Platinum', requirement: '50 referrals', achieved: false, bonus: '20%' },
    { name: 'Diamond', requirement: '100 referrals', achieved: false, bonus: '25%' },
  ];

  const recentReferrals = [
    { name: 'Alemayehu M.', date: '2 hours ago', status: 'active', earnings: 150 },
    { name: 'Sara T.', date: '1 day ago', status: 'active', earnings: 200 },
    { name: 'Dawit B.', date: '3 days ago', status: 'pending', earnings: 0 },
    { name: 'Tigist K.', date: '5 days ago', status: 'active', earnings: 175 },
    { name: 'Yonas G.', date: '1 week ago', status: 'active', earnings: 225 },
  ];

  const commissionHistory = [
    { type: 'Direct Referral', amount: 500, date: 'Jan 8, 2026', user: 'Alemayehu M.' },
    { type: 'Level 2 Bonus', amount: 150, date: 'Jan 7, 2026', user: 'Network' },
    { type: 'Rank Bonus', amount: 1000, date: 'Jan 5, 2026', user: 'Silver Achievement' },
    { type: 'Direct Referral', amount: 500, date: 'Jan 4, 2026', user: 'Sara T.' },
    { type: 'Course Sale', amount: 350, date: 'Jan 3, 2026', user: 'Dawit B.' },
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
              Business Dashboard 💼
            </h1>
            <p className="text-muted-foreground">Track your referrals, earnings, and network growth</p>
          </div>
          <Badge className="bg-gold/10 text-gold border-gold/30 text-sm px-3 py-1">
            <Crown className="w-4 h-4 mr-1" />
            Silver Rank
          </Badge>
        </div>
      </motion.div>

      {/* Referral Code Card */}
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
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-primary-foreground">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button className="bg-white text-accent hover:bg-white/90">
              <Gift className="w-4 h-4 mr-2" />
              Invite Friends
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'This Month', value: `${earnings.thisMonth.toLocaleString()} ETB`, icon: Wallet, color: 'text-success', bg: 'bg-success/10', change: `+${earnings.growth}%` },
          { label: 'Pending', value: `${earnings.pending.toLocaleString()} ETB`, icon: DollarSign, color: 'text-gold', bg: 'bg-gold/10' },
          { label: 'Total Earnings', value: `${earnings.total.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Team Size', value: network.totalTeam, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-card rounded-xl p-4 border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.change && (
                <span className="text-xs text-success flex items-center">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Network Overview */}
        <motion.div
          className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Network Overview</h2>
            <Button variant="ghost" size="sm">
              View Details <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-accent/5 rounded-xl border border-accent/20">
              <p className="text-3xl font-display font-bold text-accent">{network.directReferrals}</p>
              <p className="text-sm text-muted-foreground">Level 1 (Direct)</p>
              <p className="text-xs text-success mt-1">20% commission</p>
            </div>
            <div className="text-center p-4 bg-gold/5 rounded-xl border border-gold/20">
              <p className="text-3xl font-display font-bold text-gold">{network.level2}</p>
              <p className="text-sm text-muted-foreground">Level 2</p>
              <p className="text-xs text-gold mt-1">10% commission</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-3xl font-display font-bold text-primary">{network.level3}</p>
              <p className="text-sm text-muted-foreground">Level 3</p>
              <p className="text-xs text-primary mt-1">5% commission</p>
            </div>
          </div>

          {/* Recent Referrals */}
          <h3 className="font-medium text-foreground mb-3">Recent Referrals</h3>
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
                <div className="text-right">
                  <Badge className={referral.status === 'active' ? 'bg-success/10 text-success border-success/30' : 'bg-gold/10 text-gold border-gold/30'}>
                    {referral.status}
                  </Badge>
                  {referral.earnings > 0 && (
                    <p className="text-sm text-success mt-1">+{referral.earnings} ETB</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rank Progress */}
        <motion.div
          className="bg-card rounded-xl border border-border p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-display font-semibold text-foreground">Rank Progress</h2>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to Gold</span>
              <span className="font-medium text-accent">12/30 referrals</span>
            </div>
            <Progress value={40} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">18 more referrals to unlock Gold rank</p>
          </div>

          <div className="space-y-3">
            {ranks.map((rank, i) => (
              <div 
                key={rank.name} 
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  rank.current 
                    ? 'border-gold/50 bg-gold/5' 
                    : rank.achieved 
                      ? 'border-success/30 bg-success/5' 
                      : 'border-border'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  rank.achieved ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {rank.achieved ? <Star className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${rank.current ? 'text-gold' : rank.achieved ? 'text-success' : 'text-foreground'}`}>
                    {rank.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{rank.requirement}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {rank.bonus}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Commission History */}
      <motion.div
        className="mt-6 bg-card rounded-xl border border-border p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-display font-semibold text-foreground">Commission History</h2>
          </div>
          <Button variant="ghost" size="sm">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {commissionHistory.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  </td>
                  <td className="py-3 text-foreground">{item.user}</td>
                  <td className="py-3 text-muted-foreground text-sm">{item.date}</td>
                  <td className="py-3 text-right font-medium text-success">+{item.amount} ETB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default BusinessDashboard;
