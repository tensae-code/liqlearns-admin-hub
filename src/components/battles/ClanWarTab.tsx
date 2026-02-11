import { useState } from 'react';
import { useClanWars } from '@/hooks/useClanWars';
import { useClans } from '@/hooks/useClans';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Swords, Shield, Crown, Users, Plus, Loader2, Search,
  Check, X, Flame, Trophy, ChevronRight, Gamepad2, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { ClanWar } from '@/hooks/useClanWars';

const ClanWarTab = () => {
  const { profile } = useProfile();
  const { wars, loading, requestWar, acceptWar, declineWar, myClanIds } = useClanWars();
  const { myClans, clans } = useClans();
  const [showRequest, setShowRequest] = useState(false);
  const [selectedClanId, setSelectedClanId] = useState('');
  const [targetClanId, setTargetClanId] = useState('');
  const [totalGames, setTotalGames] = useState(5);
  const [stakePerMember, setStakePerMember] = useState(10);
  const [clanSearch, setClanSearch] = useState('');
  const [requesting, setRequesting] = useState(false);

  const otherClans = clans.filter(c => !myClanIds.includes(c.id) && c.name.toLowerCase().includes(clanSearch.toLowerCase()));

  const pendingIncoming = wars.filter(w => w.status === 'pending' && myClanIds.includes(w.opponent_clan_id));
  const pendingOutgoing = wars.filter(w => w.status === 'pending' && myClanIds.includes(w.challenger_clan_id));
  const activeWars = wars.filter(w => w.status === 'accepted' || w.status === 'in_progress');
  const completedWars = wars.filter(w => w.status === 'completed');

  const handleRequestWar = async () => {
    if (!selectedClanId || !targetClanId) return;
    setRequesting(true);
    await requestWar({
      challengerClanId: selectedClanId,
      opponentClanId: targetClanId,
      totalGames,
      stakePerMember,
      gameIds: [],
    });
    setRequesting(false);
    setShowRequest(false);
    setTargetClanId('');
    setClanSearch('');
  };

  const getWarStatusBadge = (war: ClanWar) => {
    switch (war.status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'accepted': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Ready</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">In Progress</Badge>;
      case 'completed': return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Completed</Badge>;
      default: return <Badge variant="secondary">{war.status}</Badge>;
    }
  };

  const isMyClan = (clanId: string) => myClanIds.includes(clanId);

  const WarCard = ({ war }: { war: ClanWar }) => {
    const isChallenger = isMyClan(war.challenger_clan_id);
    const myClanName = isChallenger ? war.challenger_clan?.name : war.opponent_clan?.name;
    const theirClanName = isChallenger ? war.opponent_clan?.name : war.challenger_clan?.name;
    const myScore = isChallenger ? war.challenger_score : war.opponent_score;
    const theirScore = isChallenger ? war.opponent_score : war.challenger_score;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl border border-border hover:border-accent/30 transition-colors"
      >
        {/* VS Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-10 h-10">
              <AvatarImage src={war.challenger_clan?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                {war.challenger_clan?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{war.challenger_clan?.name}</p>
              <p className="text-lg font-bold text-foreground">{war.challenger_score}</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Swords className="w-5 h-5 text-accent mb-1" />
            <span className="text-[10px] text-muted-foreground font-medium">VS</span>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{war.opponent_clan?.name}</p>
              <p className="text-lg font-bold text-foreground">{war.opponent_score}</p>
            </div>
            <Avatar className="w-10 h-10">
              <AvatarImage src={war.opponent_clan?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm">
                {war.opponent_clan?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Details */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {getWarStatusBadge(war)}
            <span className="flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" /> {war.total_games} games
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-500" /> {war.stake_per_member} BP/member
            </span>
          </div>
          <span>{formatDistanceToNow(new Date(war.created_at), { addSuffix: true })}</span>
        </div>

        {/* Actions for pending incoming */}
        {war.status === 'pending' && isMyClan(war.opponent_clan_id) && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white" onClick={() => acceptWar(war.id)}>
              <Check className="w-3 h-3 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30" onClick={() => declineWar(war.id)}>
              <X className="w-3 h-3 mr-1" /> Decline
            </Button>
          </div>
        )}

        {war.status === 'pending' && isMyClan(war.challenger_clan_id) && (
          <p className="text-xs text-muted-foreground mt-3 italic">Waiting for {war.opponent_clan?.name} to respond...</p>
        )}
      </motion.div>
    );
  };

  if (myClans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="w-14 h-14 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-medium text-foreground">Join a clan first!</p>
          <p className="text-sm text-muted-foreground mt-1">Head to the Dashboard to create or join a clan, then come back to challenge other clans.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Request War Button */}
      <Button
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
        onClick={() => setShowRequest(true)}
      >
        <Swords className="w-4 h-4 mr-2" /> Challenge Another Clan
      </Button>

      {/* Incoming Challenges */}
      {pendingIncoming.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-yellow-500" /> Incoming Challenges ({pendingIncoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingIncoming.map(war => <WarCard key={war.id} war={war} />)}
          </CardContent>
        </Card>
      )}

      {/* Active Wars */}
      {activeWars.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Swords className="w-4 h-4 text-accent" /> Active Wars
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeWars.map(war => <WarCard key={war.id} war={war} />)}
          </CardContent>
        </Card>
      )}

      {/* Outgoing / Completed */}
      {(pendingOutgoing.length > 0 || completedWars.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" /> War History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="max-h-[400px]">
              {pendingOutgoing.map(war => <WarCard key={war.id} war={war} />)}
              {completedWars.map(war => <WarCard key={war.id} war={war} />)}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {wars.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-medium text-foreground">No clan wars yet</p>
            <p className="text-sm text-muted-foreground mt-1">Challenge another clan to start a war!</p>
          </CardContent>
        </Card>
      )}

      {/* Request War Dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-violet-500" /> Challenge a Clan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* My Clan */}
            <div>
              <Label>Your Clan</Label>
              <Select value={selectedClanId} onValueChange={setSelectedClanId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your clan" />
                </SelectTrigger>
                <SelectContent>
                  {myClans.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search & Select opponent clan */}
            <div>
              <Label>Opponent Clan</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clans..."
                  value={clanSearch}
                  onChange={e => setClanSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {clanSearch && (
                <ScrollArea className="max-h-40 mt-2 border rounded-lg">
                  {otherClans.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 text-center">No clans found</p>
                  ) : (
                    otherClans.slice(0, 10).map(clan => (
                      <div
                        key={clan.id}
                        className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 transition-colors ${targetClanId === clan.id ? 'bg-accent/10' : ''}`}
                        onClick={() => { setTargetClanId(clan.id); setClanSearch(clan.name); }}
                      >
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={clan.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-violet-500/20 text-violet-600">
                            {clan.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{clan.name}</span>
                        {targetClanId === clan.id && <Check className="w-4 h-4 text-accent ml-auto" />}
                      </div>
                    ))
                  )}
                </ScrollArea>
              )}
              {targetClanId && !clanSearch && (
                <p className="text-sm text-accent mt-1">
                  Selected: {clans.find(c => c.id === targetClanId)?.name}
                </p>
              )}
            </div>

            {/* Games count */}
            <div>
              <Label>Total Rounds</Label>
              <div className="flex gap-2 mt-1">
                {[3, 5, 7].map(n => (
                  <Button key={n} size="sm" variant={totalGames === n ? 'default' : 'outline'}
                    className={totalGames === n ? 'bg-accent text-accent-foreground' : ''}
                    onClick={() => setTotalGames(n)}
                  >
                    {n} rounds
                  </Button>
                ))}
              </div>
            </div>

            {/* Stake */}
            <div>
              <Label>BP Stake per Member</Label>
              <div className="flex gap-2 mt-1">
                {[5, 10, 25].map(n => (
                  <Button key={n} size="sm" variant={stakePerMember === n ? 'default' : 'outline'}
                    className={stakePerMember === n ? 'bg-accent text-accent-foreground' : ''}
                    onClick={() => setStakePerMember(n)}
                  >
                    {n} BP
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white"
              onClick={handleRequestWar}
              disabled={!selectedClanId || !targetClanId || requesting}
            >
              {requesting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Swords className="w-4 h-4 mr-1" />}
              Send War Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClanWarTab;
