import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Users, DollarSign, TrendingUp, Copy, Share2, Crown, 
  Trophy, Leaf, Gem, Sparkles, ArrowRight, Clock, CheckCircle2,
  GitBranch, UserPlus, Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import ReferralTree from '@/components/referral/ReferralTree';

const ReferralDashboard = () => {
  const {
    loading,
    stats,
    ranks,
    currentRank,
    nextRank,
    settings,
    directReferrals,
    indirectReferrals,
    recentRewards,
    referralLink,
    copyReferralLink,
    getRankProgress
  } = useReferralProgram();

  const [activeTab, setActiveTab] = useState('overview');

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      toast({ title: 'Link copied!', description: 'Share your referral link to earn rewards.' });
    } else {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const getRankIcon = (icon: string) => {
    switch (icon) {
      case 'seedling': return <Leaf className="w-5 h-5" />;
      case 'leaf': return <Leaf className="w-5 h-5" />;
      case 'trophy': return <Trophy className="w-5 h-5" />;
      case 'crown': return <Crown className="w-5 h-5" />;
      case 'gem': return <Gem className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const { referralProgress, earningsProgress } = getRankProgress();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Referral Program</h1>
            <p className="text-muted-foreground">Earn rewards by sharing LiqLearns with others</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 md:flex-none flex items-center gap-2 bg-muted rounded-lg p-2 pr-3">
              <code className="text-xs md:text-sm truncate max-w-[200px]">{referralLink}</code>
              <Button size="sm" variant="ghost" onClick={handleCopyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" onClick={handleCopyLink} className="shrink-0">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.direct_referrals || 0}</p>
                  <p className="text-xs text-muted-foreground">Direct Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <GitBranch className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.indirect_referrals || 0}</p>
                  <p className="text-xs text-muted-foreground">Level 2 Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats?.total_earnings?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats?.pending_earnings?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-muted-foreground">Pending Payout</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rank Progress Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-${currentRank?.badge_color || 'amber'}-500/20`}>
                  {getRankIcon(currentRank?.badge_icon || 'star')}
                </div>
                <div>
                  <CardTitle className="text-lg">{currentRank?.name || 'Starter'}</CardTitle>
                  <CardDescription>
                    {currentRank?.bonus_percent ? `+${currentRank.bonus_percent}% bonus on all rewards` : 'Complete referrals to rank up'}
                  </CardDescription>
                </div>
              </div>
              {nextRank && (
                <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm">Next: {nextRank.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          </CardHeader>
          {nextRank && (
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Referrals: {stats?.direct_referrals || 0} / {nextRank.min_referrals}</span>
                  <span>{Math.round(referralProgress)}%</span>
                </div>
                <Progress value={referralProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Earnings: ${stats?.paid_earnings?.toFixed(2) || '0.00'} / ${nextRank.min_earnings}</span>
                  <span>{Math.round(earningsProgress)}%</span>
                </div>
                <Progress value={earningsProgress} className="h-2" />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="ranks">Ranks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How Referral Rewards Work</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                      <UserPlus className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Level 1 - Direct Referrals</h4>
                      <p className="text-sm text-muted-foreground">
                        Earn <strong>{settings?.level1_percent || 15}%</strong> recurring reward when someone you refer purchases a subscription.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
                      <GitBranch className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Level 2 - Gratitude Reward</h4>
                      <p className="text-sm text-muted-foreground">
                        Earn <strong>{settings?.level2_percent || 5}%</strong> (capped at ${settings?.level2_cap || 50}) when your referrals bring in paying users.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <strong>Note:</strong> This is a referral program, not a job or business opportunity. Earnings are based on completed, paid subscriptions only.
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentRewards.length > 0 ? (
                  <div className="space-y-3">
                    {recentRewards.slice(0, 5).map(reward => (
                      <div key={reward.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={reward.source_user?.avatar_url || ''} />
                            <AvatarFallback>{reward.source_user?.full_name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{reward.source_user?.full_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground">
                              {reward.reward_type === 'level1' ? 'Direct referral' : 'Level 2 referral'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+${reward.amount.toFixed(2)}</p>
                          <Badge variant={reward.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {reward.status === 'paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                            {reward.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No rewards yet. Share your link to start earning!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <ReferralTree 
              directReferrals={directReferrals} 
              indirectReferrals={indirectReferrals} 
            />

            {/* Direct Referrals List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Direct Referrals ({directReferrals.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {directReferrals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {directReferrals.map(ref => (
                        <TableRow key={ref.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={ref.avatar_url || ''} />
                                <AvatarFallback>{ref.full_name?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{ref.full_name}</p>
                                <p className="text-xs text-muted-foreground">@{ref.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ref.subscription_status === 'active' ? 'default' : 'secondary'}>
                              {ref.subscription_status || 'trial'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(ref.created_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No referrals yet. Share your link to invite others!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold text-green-600">${stats?.total_earnings?.toFixed(2) || '0.00'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Paid Out</p>
                  <p className="text-3xl font-bold">${stats?.paid_earnings?.toFixed(2) || '0.00'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Pending (min ${settings?.min_payout || 20})</p>
                  <p className="text-3xl font-bold text-amber-600">${stats?.pending_earnings?.toFixed(2) || '0.00'}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earnings History</CardTitle>
              </CardHeader>
              <CardContent>
                {recentRewards.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRewards.map(reward => (
                        <TableRow key={reward.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={reward.source_user?.avatar_url || ''} />
                                <AvatarFallback>{reward.source_user?.full_name?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              <span>{reward.source_user?.full_name || 'User'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {reward.reward_type === 'level1' ? 'Level 1' : 'Level 2'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">+${reward.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={reward.status === 'paid' ? 'default' : reward.status === 'pending' ? 'secondary' : 'destructive'}>
                              {reward.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(reward.created_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No earnings yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranks Tab */}
          <TabsContent value="ranks" className="space-y-4">
            <div className="grid gap-4">
              {ranks.map((rank, idx) => {
                const isCurrentRank = currentRank?.id === rank.id;
                const isLocked = (stats?.direct_referrals || 0) < rank.min_referrals || (stats?.paid_earnings || 0) < rank.min_earnings;
                
                return (
                  <Card key={rank.id} className={isCurrentRank ? 'ring-2 ring-primary' : isLocked ? 'opacity-60' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl bg-${rank.badge_color}-500/20`}>
                            {getRankIcon(rank.badge_icon)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{rank.name}</h3>
                              {isCurrentRank && <Badge>Current</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {rank.min_referrals} referrals • ${rank.min_earnings} earned
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {rank.bonus_percent > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              +{rank.bonus_percent}% bonus
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReferralDashboard;
