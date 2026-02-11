import { useClans, type Clan } from '@/hooks/useClans';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Zap, Users, Swords, ScrollText, ChevronRight, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import type { ClanBattleLog } from '@/hooks/useClans';

const ClanInfoPanel = () => {
  const { profile } = useProfile();
  const { myClans, fetchBattleLog, battleLog, fetchClanMembers, clanMembers } = useClans();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  const primaryClan = myClans[0];

  useEffect(() => {
    if (primaryClan && !loaded) {
      fetchClanMembers(primaryClan.id);
      fetchBattleLog(primaryClan.id);
      setLoaded(true);
    }
  }, [primaryClan?.id, loaded]);

  if (!primaryClan) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
          <CardContent className="p-4 text-center">
            <Shield className="w-10 h-10 mx-auto mb-2 text-violet-400 opacity-50" />
            <p className="font-semibold text-sm text-foreground">No Clan Yet</p>
            <p className="text-xs text-muted-foreground mb-3">Join a clan to unlock Clan Wars!</p>
            <Button size="sm" onClick={() => navigate('/clans')} className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
              <Shield className="w-3 h-3 mr-1" /> Browse Clans
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const members = clanMembers.filter(m => m.clan_id === primaryClan.id);
  const recentLogs = battleLog.slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-violet-500/20">
        <CardContent className="p-4 space-y-3">
          {/* Clan Header */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/clans')}
          >
            <Avatar className="w-11 h-11">
              <AvatarImage src={primaryClan.avatar_url || undefined} />
              <AvatarFallback
                className="text-white font-bold"
                style={{ background: `linear-gradient(135deg, ${primaryClan.badge_color}, ${primaryClan.badge_color}88)` }}
              >
                {primaryClan.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground truncate">{primaryClan.name}</span>
                <Badge variant="outline" className="text-[10px]">Lv.{primaryClan.clan_level}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-yellow-500" />{primaryClan.clan_xp} XP</span>
                <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{members.length} members</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Member Avatars */}
          <div className="flex items-center gap-1">
            {members.slice(0, 6).map(m => (
              <Avatar key={m.id} className="w-7 h-7 border-2 border-background -ml-1 first:ml-0">
                <AvatarImage src={m.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[9px] bg-muted">{m.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
            ))}
            {members.length > 6 && (
              <span className="text-[10px] text-muted-foreground ml-1">+{members.length - 6}</span>
            )}
          </div>

          {/* Recent Battle Log */}
          {recentLogs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ScrollText className="w-3 h-3" /> Recent Activity
              </span>
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    log.event_type.includes('won') ? 'bg-green-500' :
                    log.event_type.includes('lost') ? 'bg-red-500' :
                    'bg-muted-foreground'
                  }`} />
                  <span className="text-foreground truncate flex-1">{log.description || log.event_type}</span>
                  {log.xp_earned > 0 && <span className="text-yellow-500 text-[10px]">+{log.xp_earned}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClanInfoPanel;
