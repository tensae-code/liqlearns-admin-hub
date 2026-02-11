import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Swords, Trophy, Gamepad2, CheckCircle, Clock, Users, Zap, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { ClanWar, ClanWarRound } from '@/hooks/useClanWars';

interface ClanWarPlayViewProps {
  war: ClanWar;
  onClose: () => void;
}

const ClanWarPlayView = ({ war, onClose }: ClanWarPlayViewProps) => {
  const { profile } = useProfile();
  const [rounds, setRounds] = useState<ClanWarRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const isChallenger = war.challenger_clan?.name === war.challenger_clan?.name; // always true, used for side logic
  const myClanName = war.challenger_clan?.name;
  const theirClanName = war.opponent_clan?.name;

  const fetchRounds = useCallback(async () => {
    const { data, error } = await supabase
      .from('clan_war_rounds')
      .select('*')
      .eq('war_id', war.id)
      .order('round_number');

    if (error) { console.error(error); setLoading(false); return; }

    // Enrich with player & game info
    if (data?.length) {
      const playerIds = new Set<string>();
      const gameIds = new Set<string>();
      data.forEach((r: any) => {
        if (r.challenger_player_id) playerIds.add(r.challenger_player_id);
        if (r.opponent_player_id) playerIds.add(r.opponent_player_id);
        if (r.game_id) gameIds.add(r.game_id);
      });

      const [{ data: players }, { data: games }] = await Promise.all([
        playerIds.size > 0
          ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', Array.from(playerIds))
          : Promise.resolve({ data: [] }),
        gameIds.size > 0
          ? supabase.from('game_templates').select('id, title, type').in('id', Array.from(gameIds))
          : Promise.resolve({ data: [] }),
      ]);

      setRounds(data.map((r: any) => ({
        ...r,
        challenger_player: players?.find((p: any) => p.id === r.challenger_player_id),
        opponent_player: players?.find((p: any) => p.id === r.opponent_player_id),
        game: games?.find((g: any) => g.id === r.game_id),
      })));
    } else {
      setRounds([]);
    }
    setLoading(false);
  }, [war.id]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // Realtime updates for rounds
  useEffect(() => {
    const channel = supabase
      .channel(`clan-war-rounds-${war.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_war_rounds', filter: `war_id=eq.${war.id}` }, (payload) => {
        fetchRounds();
        const round = payload.new as any;
        if (round.status === 'completed' && round.winner_player_id) {
          setNotification(`Round ${round.round_number} completed!`);
          setTimeout(() => setNotification(null), 3000);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clan_wars', filter: `id=eq.${war.id}` }, (payload) => {
        const updated = payload.new as any;
        if (updated.status === 'completed') {
          toast.success('🏆 Clan War completed!');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [war.id, fetchRounds]);

  const completedRounds = rounds.filter(r => r.status === 'completed');
  const activeRound = rounds.find(r => r.status === 'in_progress');
  const pendingRounds = rounds.filter(r => r.status === 'pending');

  const getRoundStatusBadge = (round: ClanWarRound) => {
    switch (round.status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">Done</Badge>;
      case 'in_progress': return <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px]">Playing</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">Pending</Badge>;
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* VS Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white p-5 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium opacity-80">Clan War</span>
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Challenger Clan */}
            <div className="flex-1 text-center">
              <Avatar className="w-14 h-14 mx-auto mb-1 border-2 border-white/30">
                <AvatarImage src={war.challenger_clan?.avatar_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                  {war.challenger_clan?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate">{war.challenger_clan?.name}</p>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black">{war.challenger_score}</span>
                <Swords className="w-6 h-6 text-yellow-300" />
                <span className="text-3xl font-black">{war.opponent_score}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] opacity-70">
                <Gamepad2 className="w-3 h-3" /> Best of {war.total_games}
              </div>
            </div>

            {/* Opponent Clan */}
            <div className="flex-1 text-center">
              <Avatar className="w-14 h-14 mx-auto mb-1 border-2 border-white/30">
                <AvatarImage src={war.opponent_clan?.avatar_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                  {war.opponent_clan?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate">{war.opponent_clan?.name}</p>
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-accent/10 text-accent px-4 py-2 text-sm font-medium text-center flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rounds */}
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" /> Rounds ({completedRounds.length}/{war.total_games})
          </h3>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading rounds...</div>
          ) : rounds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No rounds started yet</p>
                <p className="text-xs text-muted-foreground mt-1">Rounds will appear here as the war progresses</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {rounds.map((round) => (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-xl border transition-colors ${
                      round.status === 'in_progress' ? 'border-accent/30 bg-accent/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">Round {round.round_number}</span>
                      <div className="flex items-center gap-2">
                        {round.game && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <Gamepad2 className="w-2.5 h-2.5 mr-0.5" />{round.game.title}
                          </Badge>
                        )}
                        {getRoundStatusBadge(round)}
                      </div>
                    </div>

                    {/* Players VS */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={round.challenger_player?.avatar_url || undefined} />
                          <AvatarFallback className="text-[9px] bg-violet-500/20 text-violet-600">
                            {round.challenger_player?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-foreground truncate">
                          {round.challenger_player?.full_name || 'TBD'}
                        </span>
                        {round.challenger_score !== null && (
                          <span className="text-xs font-bold text-foreground ml-auto">{round.challenger_score}</span>
                        )}
                      </div>

                      <span className="text-[10px] text-muted-foreground font-medium">VS</span>

                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                        {round.opponent_score !== null && (
                          <span className="text-xs font-bold text-foreground mr-auto">{round.opponent_score}</span>
                        )}
                        <span className="text-xs text-foreground truncate text-right">
                          {round.opponent_player?.full_name || 'TBD'}
                        </span>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={round.opponent_player?.avatar_url || undefined} />
                          <AvatarFallback className="text-[9px] bg-orange-500/20 text-orange-600">
                            {round.opponent_player?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    {round.status === 'completed' && round.winner_player_id && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Winner: {round.winner_player_id === round.challenger_player_id
                          ? round.challenger_player?.full_name
                          : round.opponent_player?.full_name}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* War Status */}
          {war.status === 'completed' && war.winner_clan_id && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 text-center"
            >
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="font-bold text-foreground">
                {war.winner_clan_id === war.challenger_clan_id
                  ? war.challenger_clan?.name
                  : war.opponent_clan?.name} wins!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Final Score: {war.challenger_score} - {war.opponent_score}
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClanWarPlayView;
