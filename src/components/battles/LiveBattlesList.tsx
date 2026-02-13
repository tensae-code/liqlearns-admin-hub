import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, EyeOff, Users, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { Battle } from '@/hooks/useBattles';

interface LiveBattleCardProps {
  battle: Battle;
  onSpectate: (battleId: string) => void;
}

export const LiveBattleCard = ({ battle, onSpectate }: LiveBattleCardProps) => {
  const { profile } = useProfile();
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Fetch spectator count
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('battle_spectators')
        .select('*', { count: 'exact', head: true })
        .eq('battle_id', battle.id);
      setSpectatorCount(count || 0);
    };
    fetchCount();

    // Realtime spectator count
    const channel = supabase
      .channel(`spectators-${battle.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_spectators', filter: `battle_id=eq.${battle.id}` }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [battle.id]);

  // Check follow status
  useEffect(() => {
    if (!profile?.id) return;
    const checkFollow = async () => {
      const { data } = await supabase
        .from('battle_follows')
        .select('id')
        .eq('follower_id', profile.id)
        .eq('target_type', 'player')
        .eq('target_id', battle.challenger_id)
        .maybeSingle();
      setIsFollowing(!!data);
    };
    checkFollow();
  }, [profile?.id, battle.challenger_id]);

  const toggleFollow = async () => {
    if (!profile?.id) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from('battle_follows')
        .delete()
        .eq('follower_id', profile.id)
        .eq('target_type', 'player')
        .eq('target_id', battle.challenger_id);
      setIsFollowing(false);
      toast('Unfollowed');
    } else {
      await supabase.from('battle_follows')
        .insert({ follower_id: profile.id, target_type: 'player', target_id: battle.challenger_id });
      setIsFollowing(true);
      toast.success('Following! You\'ll be notified of their battles');
    }
    setFollowLoading(false);
  };

  const canSpectate = (battle as any).allow_spectators && !(battle as any).is_private;
  const isLive = battle.status === 'in_progress' || battle.status === 'accepted';

  if (!isLive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
    >
      {/* Live indicator */}
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-accent/10 text-accent text-sm">
            {battle.challenger_profile?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">
            {battle.challenger_profile?.full_name || '?'} vs {battle.opponent_profile?.full_name || '?'}
          </span>
          <Badge className="text-[10px] px-1.5 py-0 bg-red-500 text-white">LIVE</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {(battle as any).mode || '1v1'}
          </Badge>
          {battle.game && (
            <span className="truncate">{battle.game.title}</span>
          )}
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" /> {spectatorCount}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm" variant="ghost"
          onClick={toggleFollow}
          disabled={followLoading}
          className="h-7 px-2"
        >
          {followLoading ? <Loader2 className="w-3 h-3 animate-spin" /> :
            isFollowing ? <UserCheck className="w-3.5 h-3.5 text-accent" /> : <UserPlus className="w-3.5 h-3.5" />
          }
        </Button>
        {canSpectate ? (
          <Button size="sm" variant="outline" onClick={() => onSpectate(battle.id)} className="h-7 gap-1 text-xs">
            <Eye className="w-3 h-3" /> Watch
          </Button>
        ) : (
          <Badge variant="outline" className="text-[10px] gap-0.5">
            <EyeOff className="w-2.5 h-2.5" /> Private
          </Badge>
        )}
      </div>
    </motion.div>
  );
};

interface LiveBattlesListProps {
  onSpectate: (battleId: string) => void;
}

const LiveBattlesList = ({ onSpectate }: LiveBattlesListProps) => {
  const [liveBattles, setLiveBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLive = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('battles')
        .select('*')
        .in('status', ['accepted', 'in_progress'])
        .eq('allow_spectators', true)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const userIds = new Set<string>();
        data.forEach((b: any) => { userIds.add(b.challenger_id); if (b.opponent_id) userIds.add(b.opponent_id); });
        const { data: profiles } = userIds.size > 0
          ? await supabase.from('profiles').select('id, full_name, avatar_url, username').in('id', Array.from(userIds))
          : { data: [] };
        const gameIds = data.filter((b: any) => b.game_id).map((b: any) => b.game_id);
        const { data: games } = gameIds.length
          ? await supabase.from('game_templates').select('id, title, type').in('id', gameIds)
          : { data: [] };

        setLiveBattles(data.map((b: any) => ({
          ...b,
          challenger_profile: profiles?.find((p: any) => p.id === b.challenger_id),
          opponent_profile: b.opponent_id ? profiles?.find((p: any) => p.id === b.opponent_id) : undefined,
          game: games?.find((g: any) => g.id === b.game_id),
        })));
      }
      setLoading(false);
    };
    fetchLive();

    // Realtime updates
    const channel = supabase
      .channel('live-battles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles' }, () => {
        fetchLive();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  if (liveBattles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">No live battles right now</p>
        <p className="text-xs mt-1">Live battles will appear here for spectating</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-2">
        {liveBattles.map(battle => (
          <LiveBattleCard key={battle.id} battle={battle} onSpectate={onSpectate} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default LiveBattlesList;
