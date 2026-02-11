import { useState } from 'react';
import { useClanWars } from '@/hooks/useClanWars';
import { useClans } from '@/hooks/useClans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Swords, Shield, Flame, Trophy, Gamepad2, Coins,
  Check, X, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { ClanWar } from '@/hooks/useClanWars';
import ClanWarRequestDialog from './ClanWarRequestDialog';
import ClanWarPlayView from './ClanWarPlayView';

const ClanWarTab = () => {
  const { wars, loading, requestWar, acceptWar, declineWar, myClanIds } = useClanWars();
  const { myClans } = useClans();
  const [showRequest, setShowRequest] = useState(false);
  const [activeWar, setActiveWar] = useState<ClanWar | null>(null);

  const pendingIncoming = wars.filter(w => w.status === 'pending' && myClanIds.includes(w.opponent_clan_id));
  const pendingOutgoing = wars.filter(w => w.status === 'pending' && myClanIds.includes(w.challenger_clan_id));
  const activeWars = wars.filter(w => w.status === 'accepted' || w.status === 'in_progress');
  const completedWars = wars.filter(w => w.status === 'completed');

  const isMyClan = (clanId: string) => myClanIds.includes(clanId);

  const getWarStatusBadge = (war: ClanWar) => {
    switch (war.status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'accepted': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Ready</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">In Progress</Badge>;
      case 'completed': return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Completed</Badge>;
      default: return <Badge variant="secondary">{war.status}</Badge>;
    }
  };

  const WarCard = ({ war }: { war: ClanWar }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer"
      onClick={() => (war.status === 'accepted' || war.status === 'in_progress' || war.status === 'completed') && setActiveWar(war)}
    >
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

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {getWarStatusBadge(war)}
          <span className="flex items-center gap-1">
            <Gamepad2 className="w-3 h-3" /> {war.total_games} games
          </span>
          <span className="flex items-center gap-1">
            <Coins className="w-3 h-3 text-yellow-500" /> {war.stake_per_member} BP/member
          </span>
          {war.game_ids && war.game_ids.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {war.game_ids.length} game types
            </Badge>
          )}
        </div>
        <span>{formatDistanceToNow(new Date(war.created_at), { addSuffix: true })}</span>
      </div>

      {war.status === 'pending' && isMyClan(war.opponent_clan_id) && (
        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
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
      <Button
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
        onClick={() => setShowRequest(true)}
      >
        <Swords className="w-4 h-4 mr-2" /> Challenge Another Clan
      </Button>

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

      <ClanWarRequestDialog
        open={showRequest}
        onOpenChange={setShowRequest}
        onSubmit={requestWar}
      />

      {activeWar && (
        <ClanWarPlayView war={activeWar} onClose={() => setActiveWar(null)} />
      )}
    </div>
  );
};

export default ClanWarTab;
