import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EarningsPanel from '@/components/dashboard/EarningsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { STAT_GRADIENTS } from '@/lib/theme';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { useProfile } from '@/hooks/useProfile';
import ReferralTree from '@/components/referral/ReferralTree';
import { 
  Users, 
  TrendingUp, 
  Share2,
  Copy,
  ChevronRight,
  Target,
  Crown,
  Star,
  Zap,
  Gift,
  UserPlus,
  Network,
  Layers,
  Trophy,
  Rocket,
  Lock,
  Link2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BusinessDashboard = () => {
  const { profile } = useProfile();
  const {
    loading,
    stats,
    ranks,
    currentRank,
    nextRank,
    directReferrals,
    indirectReferrals,
    referralLink,
    copyReferralLink,
    getRankProgress
  } = useReferralProgram();

  const isPremium = profile?.subscription_status === 'active' || profile?.subscription_status === 'premium';
  
  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      toast.success('Referral link copied to clipboard!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const { referralProgress, earningsProgress } = getRankProgress();

  // Premium blur overlay component
  const PremiumBlur = ({ children, message = "Upgrade to Premium to unlock" }: { children: React.ReactNode; message?: string }) => {
    if (isPremium) return <>{children}</>;
    
    return (
      <div className="relative">
        <div className="blur-sm grayscale opacity-60 pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-xl">
          <Lock className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-muted-foreground text-center px-4">{message}</p>
          <Button size="sm" className="mt-3" onClick={() => toast.info('Premium upgrade coming soon!')}>
            <Crown className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </div>
      </div>
    );
  };

  const recentReferralsList = directReferrals.slice(0, 4).map(ref => ({
    name: ref.full_name || ref.username,
    date: new Date(ref.created_at).toLocaleDateString(),
    status: ref.subscription_status === 'active' || ref.subscription_status === 'premium' ? 'active' : 'pending',
    avatar: (ref.full_name || ref.username || 'U').charAt(0).toUpperCase()
  }));

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-4 md:mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
              Business Hub 💼
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Track your referrals, earnings, and network growth</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!isPremium && (
              <Badge className="bg-muted text-muted-foreground border-border text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Free Tier
              </Badge>
            )}
            {currentRank && (
              <Badge className="bg-gold/10 text-gold border-gold/30 text-xs md:text-sm px-2 md:px-3 py-1">
                <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                {currentRank.name}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Referral Link Banner */}
      <motion.div
        className="bg-gradient-hero text-primary-foreground rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs md:text-sm text-primary-foreground/70 mb-1">Your Referral Link</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 flex-1 min-w-0">
                <Link2 className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs md:text-sm font-mono truncate">
                  {referralLink || 'Loading...'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleCopyLink}
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground flex-1 sm:flex-none"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground flex-1 sm:flex-none"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ url: referralLink, title: 'Join Liqlearns!' });
                    } else {
                      handleCopyLink();
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-primary-foreground/60 mt-2">
              Earn 15% commission on every referral's purchases • Level 2: 5%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-4 md:mb-6">
        {[
          { 
            label: 'Registered', 
            value: stats?.direct_referrals || 0, 
            icon: UserPlus, 
            gradient: STAT_GRADIENTS[0],
            description: 'Direct signups'
          },
          { 
            label: 'Level 2', 
            value: stats?.indirect_referrals || 0, 
            icon: Network, 
            gradient: STAT_GRADIENTS[1],
            description: 'Indirect'
          },
          { 
            label: 'Pending', 
            value: `$${(stats?.pending_earnings || 0).toFixed(0)}`, 
            icon: Gift, 
            gradient: STAT_GRADIENTS[2],
            description: 'Awaiting payout'
          },
          { 
            label: 'Earned', 
            value: `$${(stats?.paid_earnings || 0).toFixed(0)}`, 
            icon: Trophy, 
            gradient: STAT_GRADIENTS[3],
            description: 'Paid out'
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`relative overflow-hidden rounded-xl md:rounded-2xl p-3 md:p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <div className="absolute top-0 right-0 w-12 md:w-16 h-12 md:h-16 bg-white/10 rounded-full -mr-4 md:-mr-6 -mt-4 md:-mt-6" />
            <stat.icon className="w-4 h-4 md:w-6 md:h-6 mb-1 md:mb-2 opacity-90" />
            <p className="text-lg md:text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-[10px] md:text-xs opacity-80 truncate">{stat.label}</p>
            <p className="text-[8px] md:text-[10px] opacity-60 mt-0.5 hidden sm:block">{stat.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Genealogy Tree - Blurred for non-premium */}
          <PremiumBlur message="Upgrade to view your referral network tree">
            <motion.div
              className="bg-card rounded-xl border border-border p-4 md:p-5 overflow-x-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                <h2 className="text-base md:text-lg font-display font-semibold text-foreground">Your Network</h2>
                <Badge variant="outline" className="ml-auto text-[10px] md:text-xs">
                  {(stats?.direct_referrals || 0) + (stats?.indirect_referrals || 0)} total
                </Badge>
              </div>
              <div className="min-w-[280px]">
                <ReferralTree 
                  directReferrals={directReferrals}
                  indirectReferrals={indirectReferrals}
                />
              </div>
            </motion.div>
          </PremiumBlur>

          {/* Recent Referrals */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-success" />
                <h2 className="text-lg font-display font-semibold text-foreground">Recent Signups</h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {stats?.direct_referrals || 0} registered
              </Badge>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-24" />
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentReferralsList.length > 0 ? (
              <div className="space-y-3">
                {recentReferralsList.map((referral, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                        {referral.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{referral.name}</p>
                        <p className="text-xs text-muted-foreground">{referral.date}</p>
                      </div>
                    </div>
                    <Badge className={referral.status === 'active' ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground border-border'}>
                      {referral.status === 'active' ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Subscribed
                        </>
                      ) : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No referrals yet</p>
                <p className="text-xs mt-1">Share your link to start earning!</p>
              </div>
            )}
          </motion.div>

          {/* Rank Progress - Blurred for non-premium */}
          <PremiumBlur message="Upgrade to track rank progression & earn bonuses">
            <motion.div
              className="bg-card rounded-xl border border-border p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-display font-semibold text-foreground">Rank Progress</h2>
              </div>
              
              {nextRank && (
                <div className="mb-4 p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress to {nextRank.name}</span>
                    <span className="font-medium text-accent">{stats?.direct_referrals || 0}/{nextRank.min_referrals} referrals</span>
                  </div>
                  <Progress value={referralProgress} className="h-3 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>${stats?.paid_earnings || 0} / ${nextRank.min_earnings} earnings</span>
                    <span>+{nextRank.bonus_percent}% bonus at this rank</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {ranks.map((rank) => {
                  const isAchieved = currentRank && rank.level <= currentRank.level;
                  const isCurrent = currentRank?.id === rank.id;
                  
                  return (
                    <div 
                      key={rank.name} 
                      className={`flex items-center gap-3 p-2 rounded-lg border ${
                        isCurrent ? 'border-gold/50 bg-gold/5' : isAchieved ? 'border-success/30 bg-success/5' : 'border-border'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isAchieved ? 'bg-success/20' : 'bg-muted'
                      }`}>
                        {rank.level === 1 && <Star className={`w-4 h-4 ${isAchieved ? 'text-success' : 'text-muted-foreground'}`} />}
                        {rank.level === 2 && <Zap className={`w-4 h-4 ${isAchieved ? 'text-success' : 'text-accent'}`} />}
                        {rank.level === 3 && <Crown className={`w-4 h-4 ${isAchieved ? 'text-success' : 'text-primary'}`} />}
                        {rank.level === 4 && <Trophy className={`w-4 h-4 ${isAchieved ? 'text-success' : 'text-gold'}`} />}
                        {rank.level >= 5 && <Rocket className={`w-4 h-4 ${isAchieved ? 'text-success' : 'text-success'}`} />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isCurrent ? 'text-gold' : isAchieved ? 'text-success' : 'text-foreground'}`}>
                          {rank.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{rank.min_referrals} referrals • ${rank.min_earnings} earnings</p>
                      </div>
                      {isAchieved && <CheckCircle className="w-4 h-4 text-success" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </PremiumBlur>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Earnings Panel - Blurred for non-premium */}
          <PremiumBlur message="Upgrade to unlock commission earnings">
            <EarningsPanel />
          </PremiumBlur>

          {/* Quick Stats */}
          <motion.div
            className="bg-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-display font-semibold text-foreground">Quick Stats</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Network</span>
                <span className="font-bold text-foreground">{(stats?.direct_referrals || 0) + (stats?.indirect_referrals || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Active Subscribers</span>
                <span className="font-bold text-success">
                  {directReferrals.filter(r => r.subscription_status === 'active' || r.subscription_status === 'premium').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-bold text-accent">
                  {stats?.direct_referrals ? 
                    Math.round((directReferrals.filter(r => r.subscription_status === 'active' || r.subscription_status === 'premium').length / stats.direct_referrals) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Current Rank</span>
                <Badge className="bg-gold/10 text-gold border-gold/30">
                  {currentRank?.name || 'Starter'}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Upgrade CTA for non-premium */}
          {!isPremium && (
            <motion.div
              className="bg-gradient-to-br from-accent to-primary rounded-xl p-5 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Crown className="w-8 h-8 mb-3" />
              <h3 className="font-display font-bold text-lg mb-2">Unlock Full Potential</h3>
              <p className="text-sm text-white/80 mb-4">
                Upgrade to Premium to earn commissions, view your network tree, and track rank progression.
              </p>
              <Button className="w-full bg-white text-accent hover:bg-white/90">
                Upgrade to Premium
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessDashboard;
