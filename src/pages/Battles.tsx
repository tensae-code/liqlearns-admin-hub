import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBattles } from '@/hooks/useBattles';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Swords, Trophy, Flame, Shield, Crown, Target, Coins,
  Clock, Users, Mic, MicOff, Search, Plus, Loader2,
  TrendingUp, TrendingDown, Minus, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { Battle } from '@/hooks/useBattles';

const Battles = () => {
  const { profile } = useProfile();
  const {
    wallet, myBattles, openBattles, leaderboard, loading,
    createBattle, acceptBattle, cancelBattle, getRankTitle,
  } = useBattles();
  const [createOpen, setCreateOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(10);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [creating, setCreating] = useState(false);

  const rankInfo = wallet ? getRankTitle(wallet.rank_points) : { title: 'Rookie', color: 'text-muted-foreground' };

  const handleCreateOpenBattle = async () => {
    setCreating(true);
    await createBattle({ stakeAmount, isOpen: true, voiceEnabled });
    setCreating(false);
    setCreateOpen(false);
  };

  const handleAccept = async (battleId: string) => {
    await acceptBattle(battleId);
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
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
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Clan Battles</h1>
                    <p className="text-sm text-muted-foreground">Challenge opponents, win battle points!</p>
                  </div>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600">
                        <Plus className="w-4 h-4 mr-1" /> Challenge
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Swords className="w-5 h-5 text-accent" /> Create Battle
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>Stake Amount (BP)</Label>
                          <div className="flex gap-2 mt-1">
                            {[5, 10, 25, 50].map(amt => (
                              <Button
                                key={amt}
                                size="sm"
                                variant={stakeAmount === amt ? 'default' : 'outline'}
                                onClick={() => setStakeAmount(amt)}
                                className={stakeAmount === amt ? 'bg-accent text-accent-foreground' : ''}
                              >
                                {amt} BP
                              </Button>
                            ))}
                          </div>
                          <Input
                            type="number"
                            value={stakeAmount}
                            onChange={e => setStakeAmount(Number(e.target.value))}
                            min={1}
                            max={wallet?.balance || 50}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Balance: {wallet?.balance || 0} BP</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Voice Chat</Label>
                          <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                        </div>
                        <Separator />
                        <Button
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
                          onClick={handleCreateOpenBattle}
                          disabled={creating || stakeAmount > (wallet?.balance || 0)}
                        >
                          {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
                          Find Opponent ({stakeAmount} BP)
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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

        {/* Tabs */}
        <Tabs defaultValue="arena" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="arena" className="gap-1"><Target className="w-4 h-4" /> Arena</TabsTrigger>
            <TabsTrigger value="my-battles" className="gap-1"><Swords className="w-4 h-4" /> My Battles</TabsTrigger>
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
                          <div className="font-medium text-sm text-foreground truncate">
                            {battle.challenger_profile?.full_name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Coins className="w-3 h-3 text-yellow-500" />
                            <span>{battle.stake_amount} BP</span>
                            {battle.voice_enabled && <Mic className="w-3 h-3 text-green-500" />}
                            <Clock className="w-3 h-3" />
                            <span>{formatDistanceToNow(new Date(battle.created_at), { addSuffix: true })}</span>
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
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Battle Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No rankings yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, idx) => {
                      const rank = getRankTitle(entry.rank_points);
                      const isMe = entry.user_id === profile?.id;
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'border-accent/30 bg-accent/5' : 'border-border'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-yellow-500 text-white' :
                            idx === 1 ? 'bg-gray-400 text-white' :
                            idx === 2 ? 'bg-orange-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </div>
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-accent/10 text-accent text-xs">
                              {entry.profile?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {entry.profile?.full_name || 'Unknown'} {isMe && <span className="text-accent">(You)</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Crown className={`w-3 h-3 ${rank.color}`} />
                              <span className={`text-xs ${rank.color}`}>{rank.title}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-foreground">{entry.rank_points} RP</div>
                            <div className="text-[10px] text-muted-foreground">{entry.wins}W / {entry.losses}L</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Battles;
