import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Crown, Shield, Users, UsersRound, Gamepad2, Loader2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface RankingEntry {
  entity_type: string;
  entity_id: string;
  game_type: string | null;
  category: string;
  wins: number;
  losses: number;
  draws: number;
  rank_points: number;
  total_battles: number;
  win_streak: number;
  best_streak: number;
  // joined
  name?: string;
  avatar_url?: string | null;
}

interface PlayerLeaderboardEntry {
  id: string;
  user_id: string;
  balance: number;
  wins: number;
  losses: number;
  draws: number;
  rank_points: number;
  total_won: number;
  total_lost: number;
  profile?: { full_name: string; avatar_url: string | null; username: string };
}

const getRankTitle = (points: number) => {
  if (points >= 2500) return { title: 'Legendary', color: 'text-yellow-400' };
  if (points >= 2000) return { title: 'Master', color: 'text-purple-400' };
  if (points >= 1500) return { title: 'Diamond', color: 'text-cyan-400' };
  if (points >= 1200) return { title: 'Gold', color: 'text-yellow-500' };
  if (points >= 1000) return { title: 'Silver', color: 'text-gray-400' };
  if (points >= 800) return { title: 'Bronze', color: 'text-orange-600' };
  return { title: 'Rookie', color: 'text-muted-foreground' };
};

const GAME_TYPES_FOR_FILTER = [
  { id: 'all', label: 'All Games' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'spelling_bee', label: 'Spelling Bee' },
  { id: 'memory', label: 'Memory' },
  { id: 'word_search', label: 'Word Search' },
  { id: 'type_racer', label: 'Type Racer' },
  { id: 'hangman', label: 'Hangman' },
  { id: 'fill_blanks', label: 'Fill Blanks' },
  { id: 'true_false', label: 'True/False' },
];

const BattleRankings = () => {
  const { profile } = useProfile();
  const [tab, setTab] = useState('players');
  const [gameFilter, setGameFilter] = useState('all');
  const [playerLeaderboard, setPlayerLeaderboard] = useState<PlayerLeaderboardEntry[]>([]);
  const [groupRankings, setGroupRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch player leaderboard (from battle_wallets)
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('battle_wallets')
        .select('*')
        .order('rank_points', { ascending: false })
        .limit(50);
      if (data) {
        const userIds = data.map((w: any) => w.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', userIds);
        setPlayerLeaderboard(data.map((w: any) => ({
          ...w,
          profile: profiles?.find((p: any) => p.id === w.user_id),
        })));
      }
      setLoading(false);
    };
    fetchPlayers();
  }, []);

  // Fetch group rankings (from battle_rankings table)
  useEffect(() => {
    if (tab === 'players') return;
    const entityType = tab === 'clans' ? 'clan' : tab === 'parties' ? 'party' : tab === 'enterprises' ? 'enterprise' : 'player';
    const fetchGroupRankings = async () => {
      setLoading(true);
      let query = supabase
        .from('battle_rankings')
        .select('*')
        .eq('entity_type', entityType)
        .order('rank_points', { ascending: false })
        .limit(50);

      if (gameFilter !== 'all') {
        query = query.eq('game_type', gameFilter);
      } else {
        query = query.is('game_type', null);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        // Fetch entity names
        const entityIds = data.map((r: any) => r.entity_id);
        let names: Record<string, { name: string; avatar?: string | null }> = {};

        if (entityType === 'clan') {
          const { data: clans } = await supabase.from('clans').select('id, name, avatar_url').in('id', entityIds);
          clans?.forEach((c: any) => { names[c.id] = { name: c.name, avatar: c.avatar_url }; });
        } else if (entityType === 'player') {
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', entityIds);
          profiles?.forEach((p: any) => { names[p.id] = { name: p.full_name, avatar: p.avatar_url }; });
        }

        setGroupRankings(data.map((r: any) => ({
          ...r,
          name: names[r.entity_id]?.name || 'Unknown',
          avatar_url: names[r.entity_id]?.avatar,
        })));
      } else {
        setGroupRankings([]);
      }
      setLoading(false);
    };
    fetchGroupRankings();
  }, [tab, gameFilter]);

  const renderLeaderboardEntry = (entry: PlayerLeaderboardEntry, idx: number) => {
    const rank = getRankTitle(entry.rank_points);
    const isMe = entry.user_id === profile?.id;
    return (
      <motion.div
        key={entry.id}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.03 }}
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
  };

  const renderGroupEntry = (entry: RankingEntry, idx: number) => {
    const rank = getRankTitle(entry.rank_points);
    return (
      <motion.div
        key={`${entry.entity_type}-${entry.entity_id}-${entry.game_type}`}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.03 }}
        className="flex items-center gap-3 p-3 rounded-xl border border-border"
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
            {entry.name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">{entry.name}</div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Crown className={`w-3 h-3 ${rank.color}`} />
            <span className={rank.color}>{rank.title}</span>
            {entry.win_streak > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">🔥 {entry.win_streak}</Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm text-foreground">{entry.rank_points} RP</div>
          <div className="text-[10px] text-muted-foreground">
            {entry.wins}W / {entry.losses}L / {entry.total_battles} total
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Battle Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ranking category tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="players" className="gap-1 text-xs">
              <Users className="w-3 h-3" /> Players
            </TabsTrigger>
            <TabsTrigger value="clans" className="gap-1 text-xs">
              <Shield className="w-3 h-3" /> Clans
            </TabsTrigger>
            <TabsTrigger value="parties" className="gap-1 text-xs">
              <UsersRound className="w-3 h-3" /> Parties
            </TabsTrigger>
            <TabsTrigger value="enterprises" className="gap-1 text-xs">
              <Building2 className="w-3 h-3" /> Schools
            </TabsTrigger>
          </TabsList>

          {/* Game type filter for non-player tabs */}
          {tab !== 'players' && (
            <div className="flex gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar">
              {GAME_TYPES_FOR_FILTER.map(g => (
                <Badge
                  key={g.id}
                  variant={gameFilter === g.id ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-[10px] px-2 py-0.5 shrink-0"
                  onClick={() => setGameFilter(g.id)}
                >
                  {g.label}
                </Badge>
              ))}
            </div>
          )}

          <TabsContent value="players">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
            ) : playerLeaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No rankings yet</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {playerLeaderboard.map((e, i) => renderLeaderboardEntry(e, i))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {['clans', 'parties', 'enterprises'].map(t => (
            <TabsContent key={t} value={t}>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
              ) : groupRankings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No {t} rankings yet</p>
                  <p className="text-xs mt-1">Rankings populate as battles are completed</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {groupRankings.map((e, i) => renderGroupEntry(e, i))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BattleRankings;
