import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBattles } from '@/hooks/useBattles';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import CreateBattleDialog from '@/components/battles/CreateBattleDialog';
import BattlePlayView from '@/components/battles/BattlePlayView';
import ClanWarTab from '@/components/battles/ClanWarTab';
import ClanInfoPanel from '@/components/battles/ClanInfoPanel';
import BattleRankings from '@/components/battles/BattleRankings';
import LiveBattlesList from '@/components/battles/LiveBattlesList';
import {
  Swords, Trophy, Flame, Shield, Crown, Target, Coins,
  Clock, Users, Mic, MicOff, Plus, Loader2,
  TrendingUp, TrendingDown, Minus, ChevronRight, Zap, Gamepad2,
  BarChart3, User, UsersRound, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { Battle } from '@/hooks/useBattles';

const Battles = () => {
  const { profile } = useProfile();
  const {
    wallet, myBattles, openBattles, leaderboard, loading,
    createBattle, acceptBattle, cancelBattle, getRankTitle,
  } = useBattles();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [battleMode, setBattleMode] = useState<'individual' | 'clan'>('individual');

  // Battle notifications - listen for incoming challenges & results
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('battle-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `opponent_id=eq.${profile.id}`,
      }, (payload) => {
        const b = payload.new as any;
        if (b.status === 'completed' && b.winner_id === profile.id) {
          toast.success(`🏆 You won! +${b.stake_amount} BP`);
        } else if (b.status === 'completed' && b.winner_id && b.winner_id !== profile.id) {
          toast('😤 You lost the battle', { description: `-${b.stake_amount} BP` });
        } else if (b.status === 'completed' && !b.winner_id) {
          toast('🤝 Battle ended in a draw!');
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'battles',
        filter: `opponent_id=eq.${profile.id}`,
      }, (payload) => {
        const b = payload.new as any;
        toast('⚔️ New Battle Challenge!', {
          description: `Someone challenged you for ${b.stake_amount} BP!`,
          action: { label: 'View', onClick: () => {} },
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);
  const handleRematch = async (battle: Battle) => {
    if (!profile?.id || !wallet) return;
    const opponentId = battle.challenger_id === profile.id ? battle.opponent_id : battle.challenger_id;
    const result = await createBattle({
      opponentId: opponentId || undefined,
      gameId: battle.game_id || undefined,
      courseId: battle.course_id || undefined,
      stakeAmount: battle.stake_amount,
      isOpen: false,
      voiceEnabled: battle.voice_enabled,
    });
    if (result) {
      setActiveBattle(null);
      toast.success('Rematch challenge sent!');
    }
  };

  // Calculate win rate for stats
  const totalGames = (wallet?.wins || 0) + (wallet?.losses || 0) + (wallet?.draws || 0);
  const winRate = totalGames > 0 ? Math.round(((wallet?.wins || 0) / totalGames) * 100) : 0;
  const currentStreak = (() => {
    let streak = 0;
    for (const b of myBattles) {
      if (b.status !== 'completed') continue;
      if (b.winner_id === profile?.id) streak++;
      else break;
    }
    return streak;
  })();

  const rankInfo = wallet ? getRankTitle(wallet.rank_points) : { title: 'Rookie', color: 'text-muted-foreground' };

  const handleAccept = async (battleId: string) => {
    const accepted = await acceptBattle(battleId);
    if (accepted) {
      // Find the battle and start playing
      const battle = openBattles.find(b => b.id === battleId) || myBattles.find(b => b.id === battleId);
      if (battle) setActiveBattle({ ...battle, status: 'accepted', opponent_id: profile?.id || null });
    }
  };

  const getStatusBadge = (battle: Battle) => {
    const isChallenger = battle.challenger_id === profile?.id;
    switch (battle.status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'accepted': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Accepted</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">In Progress</Badge>;
      case 'completed':
        if (battle.winner_id === profile?.id) return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Won</Badge>;
        if (battle.winner_id && battle.winner_id !== profile?.id) return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Lost</Badge>;
        return <Badge variant="outline">Draw</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="secondary">{battle.status}</Badge>;
    }
  };

  const getResultIcon = (battle: Battle) => {
    if (battle.status !== 'completed') return null;
    if (battle.winner_id === profile?.id) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (battle.winner_id) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  // If there's an active battle, render it inline within the layout
  if (activeBattle) {
    return (
      <DashboardLayout>
        <BattlePlayView
          battle={activeBattle}
          onClose={() => setActiveBattle(null)}
          onComplete={() => {}}
          onRematch={handleRematch}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Mode Switcher: Individual vs Clan War */}
        <div className="flex gap-2">
          <Button
            variant={battleMode === 'individual' ? 'default' : 'outline'}
            className={battleMode === 'individual' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white flex-1' : 'flex-1'}
            onClick={() => setBattleMode('individual')}
          >
            <User className="w-4 h-4 mr-2" /> Individual
          </Button>
          <Button
            variant={battleMode === 'clan' ? 'default' : 'outline'}
            className={battleMode === 'clan' ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white flex-1' : 'flex-1'}
            onClick={() => setBattleMode('clan')}
          >
            <UsersRound className="w-4 h-4 mr-2" /> Clan War
          </Button>
        </div>

        {battleMode === 'clan' ? (
          <div className="space-y-4">
            <ClanInfoPanel />
            <ClanWarTab />
          </div>
        ) : (
        <>
        {/* Header with wallet stats */}
        <div className="flex flex-col md:flex-row gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <Card className="bg-gradient-to-br from-orange-500/10 via-red-500/5 to-purple-500/10 border-orange-500/20">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Swords className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Battle Arena</h1>
                    <p className="text-sm text-muted-foreground">Challenge opponents, win battle points!</p>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shrink-0" size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Challenge</span><span className="sm:hidden">Fight</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallet card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="md:w-64">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-foreground">Battle Points</span>
                </div>
                <div className="text-3xl font-bold text-foreground">{wallet?.balance?.toFixed(0) || 0}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Crown className={`w-4 h-4 ${rankInfo.color}`} />
                  <span className={`text-sm font-medium ${rankInfo.color}`}>{rankInfo.title}</span>
                  <span className="text-xs text-muted-foreground ml-1">({wallet?.rank_points || 1000} RP)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div>
                    <div className="text-sm font-bold text-green-500">{wallet?.wins || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Wins</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-500">{wallet?.losses || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Losses</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-muted-foreground">{wallet?.draws || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Draws</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-4 gap-3">
            <Card className="p-3 text-center">
              <div className="text-lg font-bold text-foreground">{winRate}%</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <BarChart3 className="w-3 h-3" /> Win Rate
              </div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-lg font-bold text-foreground">{totalGames}</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Swords className="w-3 h-3" /> Total
              </div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-lg font-bold text-orange-500">{currentStreak}</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" /> Streak
              </div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-lg font-bold text-foreground">{wallet?.total_won?.toFixed(0) || 0}</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Coins className="w-3 h-3" /> Won
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="arena" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="arena" className="gap-1"><Target className="w-4 h-4" /> Arena</TabsTrigger>
            <TabsTrigger value="live" className="gap-1"><Eye className="w-4 h-4" /> Live</TabsTrigger>
            <TabsTrigger value="my-battles" className="gap-1"><Swords className="w-4 h-4" /> History</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1"><Trophy className="w-4 h-4" /> Rankings</TabsTrigger>
          </TabsList>

          {/* Arena - Open Battles */}
          <TabsContent value="arena">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" /> Open Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {openBattles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No open battles right now</p>
                    <p className="text-sm mt-1">Create a challenge and wait for opponents!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {openBattles.map(battle => (
                      <motion.div
                        key={battle.id}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-accent/10 text-accent text-sm">
                            {battle.challenger_profile?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground truncate">
                              {battle.challenger_profile?.full_name || 'Unknown'}
                            </span>
                            {(battle as any).challenger_rank && (() => {
                              const rank = getRankTitle((battle as any).challenger_rank);
                              return (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                                  <Crown className={`w-2.5 h-2.5 ${rank.color}`} />
                                  <span className={rank.color}>{rank.title}</span>
                                </Badge>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {(battle as any).mode || '1v1'}
                            </Badge>
                            <Coins className="w-3 h-3 text-yellow-500" />
                            <span>{battle.stake_amount} BP</span>
                            {battle.voice_enabled && <Mic className="w-3 h-3 text-green-500" />}
                            {(battle as any).is_judged && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-500 border-purple-500/30">
                                Judged
                              </Badge>
                            )}
                            {battle.game && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                <Gamepad2 className="w-2.5 h-2.5 mr-0.5" />{battle.game.title}
                              </Badge>
                            )}
                            {battle.course && (
                              <span className="truncate max-w-[100px]">{battle.course.title}</span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleAccept(battle.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                        >
                          Accept
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Battles - Spectating */}
          <TabsContent value="live">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-red-500" /> Live Battles
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LiveBattlesList onSpectate={(battleId) => {
                  const battle = myBattles.find(b => b.id === battleId);
                  if (battle) setActiveBattle(battle);
                  else toast('Spectating view coming soon');
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Battles */}
          <TabsContent value="my-battles">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Swords className="w-5 h-5 text-accent" /> Battle History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myBattles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No battles yet</p>
                    <p className="text-sm mt-1">Challenge someone or join an open battle!</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3">
                      {myBattles.map(battle => {
                        const isChallenger = battle.challenger_id === profile?.id;
                        const opponentName = isChallenger
                          ? (battle.opponent_profile?.full_name || 'Waiting...')
                          : (battle.challenger_profile?.full_name || 'Unknown');
                        return (
                          <motion.div
                            key={battle.id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border"
                          >
                            {getResultIcon(battle)}
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                {opponentName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-foreground truncate">{opponentName}</span>
                                {getStatusBadge(battle)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Coins className="w-3 h-3 text-yellow-500" />{battle.stake_amount} BP
                                {battle.game && <><ChevronRight className="w-3 h-3" />{battle.game.title}</>}
                                <span>• {formatDistanceToNow(new Date(battle.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                            {battle.status === 'pending' && isChallenger && (
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancelBattle(battle.id)}>
                                Cancel
                              </Button>
                            )}
                            {(battle.status === 'accepted' || battle.status === 'in_progress') && battle.game_id && (
                              <Button size="sm" onClick={() => setActiveBattle(battle)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
                              >
                                <Gamepad2 className="w-3 h-3 mr-1" /> Play
                              </Button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rankings */}
          <TabsContent value="leaderboard">
            <BattleRankings />
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>

      {/* Create Battle Dialog */}
      <CreateBattleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        wallet={wallet}
        onCreateBattle={createBattle}
      />
    </DashboardLayout>
  );
};

export default Battles;
