import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useClans, type Clan, type ClanMember, type ClanBattleLog } from '@/hooks/useClans';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, Crown, Users, Plus, Search, Loader2, Trophy,
  Star, Swords, Copy, Check, X, UserPlus, LogOut,
  Gamepad2, MessageSquare, ChevronRight, Zap, Link2,
  Settings2, ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BADGE_ICONS = ['shield', 'crown', 'star', 'swords', 'trophy', 'zap'];
const BADGE_COLORS = ['#FFD700', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12'];

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'leader': return 'Leader';
    case 'co_leader': return 'Co-Leader';
    case 'elder': return 'Elder';
    case 'member': return 'Member';
    case 'owner': return 'Leader';
    default: return role;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'leader': case 'owner': return 'text-yellow-500';
    case 'co_leader': return 'text-blue-500';
    case 'elder': return 'text-purple-500';
    default: return 'text-muted-foreground';
  }
};

const getClanLevelTitle = (level: number) => {
  if (level >= 10) return 'Legendary';
  if (level >= 7) return 'Master';
  if (level >= 5) return 'Expert';
  if (level >= 3) return 'Rising';
  return 'Starter';
};

const Clans = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const {
    clans, myClans, clanMembers, parties, battleLog, joinRequests, loading,
    fetchClans, fetchMyClans, fetchClanMembers, fetchParties, fetchBattleLog, fetchJoinRequests,
    createClan, joinClan, joinByInviteCode, requestToJoin, handleJoinRequest,
    leaveClan, updateMemberRole, createParty, joinParty, leaveParty,
  } = useClans();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');

  // Create form state
  const [clanName, setClanName] = useState('');
  const [clanDesc, setClanDesc] = useState('');
  const [clanBadgeIcon, setClanBadgeIcon] = useState('shield');
  const [clanBadgeColor, setClanBadgeColor] = useState('#FFD700');
  const [clanMinLevel, setClanMinLevel] = useState(0);
  const [clanMaxMembers, setClanMaxMembers] = useState(30);

  const isMember = (clanId: string) => myClans.some(c => c.id === clanId);
  const getMyRole = (clanId: string) => {
    const member = clanMembers.find(m => m.clan_id === clanId && m.user_id === profile?.id);
    return member?.role;
  };
  const isLeader = (clanId: string) => {
    const role = getMyRole(clanId);
    return role === 'leader' || role === 'co_leader' || role === 'owner';
  };

  useEffect(() => {
    if (selectedClan) {
      fetchClanMembers(selectedClan.id);
      fetchParties(selectedClan.id);
      fetchBattleLog(selectedClan.id);
      if (isLeader(selectedClan.id)) {
        fetchJoinRequests(selectedClan.id);
      }
    }
  }, [selectedClan?.id]);

  const filteredClans = clans.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!clanName.trim() || !profile) return;
    setCreateLoading(true);
    const result = await createClan({
      name: clanName.trim(),
      description: clanDesc.trim() || undefined,
      badgeIcon: clanBadgeIcon,
      badgeColor: clanBadgeColor,
      minLevel: clanMinLevel,
      maxMembers: clanMaxMembers,
    });
    setCreateLoading(false);
    if (result) {
      // Auto-create clan group chat
      try {
        const groupUsername = `clan_${result.id.substring(0, 8)}`;
        const { data: group, error: groupErr } = await supabase
          .from('groups')
          .insert({
            name: `${clanName.trim()} Clan`,
            username: groupUsername,
            description: `Official group chat for ${clanName.trim()}`,
            is_public: false,
            owner_id: profile.id,
            clan_id: result.id,
          })
          .select()
          .single();

        if (!groupErr && group) {
          await supabase.from('group_members').insert({
            group_id: group.id,
            user_id: profile.id,
            role: 'owner',
          });
          await supabase.from('group_channels').insert({
            group_id: group.id,
            name: 'general',
            channel_type: 'text',
            is_default: true,
            description: 'Clan general chat',
          });
        }
      } catch (err) {
        console.error('Error creating clan GC:', err);
      }

      setShowCreate(false);
      setClanName(''); setClanDesc('');
      fetchClans();
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    const success = await joinByInviteCode(inviteCode.trim());
    if (success) {
      setShowJoinCode(false);
      setInviteCode('');
      fetchClans();
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied!');
  };

  const getMemberCount = (clanId: string) => {
    // Approximate from filtered members or show from clans list
    return clanMembers.filter(m => m.clan_id === clanId).length || '?';
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
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 border-violet-500/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Clans</h1>
                  <p className="text-sm text-muted-foreground">Build your team, battle together, rise to the top!</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowJoinCode(true)}>
                    <Link2 className="w-4 h-4 mr-1" /> Code
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-violet-500 to-purple-600 text-white" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Create
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Clans */}
        {myClans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" /> My Clans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myClans.map(clan => (
                <Card
                  key={clan.id}
                  className="cursor-pointer hover:border-accent/30 transition-colors"
                  onClick={() => setSelectedClan(clan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={clan.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
                          {clan.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">{clan.name}</span>
                          <Badge variant="outline" className="text-[10px]">Lv.{clan.clan_level}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{clan.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-yellow-500" />{clan.clan_xp} XP</span>
                          <span>{getClanLevelTitle(clan.clan_level)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Browse / Search */}
        <Tabs defaultValue="browse" className="space-y-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="browse" className="gap-1"><Search className="w-4 h-4" /> Browse Clans</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1"><Trophy className="w-4 h-4" /> Clan Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clans..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {filteredClans.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="font-medium text-foreground">No clans found</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to create one!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredClans.map((clan, idx) => (
                  <motion.div
                    key={clan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="hover:border-accent/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-11 h-11">
                            <AvatarImage src={clan.avatar_url || undefined} />
                            <AvatarFallback
                              className="text-white font-bold"
                              style={{ background: `linear-gradient(135deg, ${clan.badge_color}, ${clan.badge_color}88)` }}
                            >
                              {clan.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground truncate">{clan.name}</span>
                              <Badge variant="outline" className="text-[10px]">Lv.{clan.clan_level}</Badge>
                              {clan.is_recruiting && (
                                <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">Recruiting</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{clan.description || 'No description'}</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span><Zap className="w-3 h-3 inline text-yellow-500" /> {clan.clan_xp} XP</span>
                              {clan.min_level > 0 && <span>Min Lv.{clan.min_level}</span>}
                              <span>{clan.max_members} max</span>
                            </div>
                          </div>
                          {isMember(clan.id) ? (
                            <Badge variant="outline" className="text-accent border-accent/30">Joined</Badge>
                          ) : clan.is_recruiting ? (
                            <Button size="sm" variant="outline" onClick={() => joinClan(clan.id)}>
                              <UserPlus className="w-3 h-3 mr-1" /> Join
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => requestToJoin(clan.id)}>
                              Request
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardContent className="p-4">
                {clans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No clans yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clans.slice(0, 20).map((clan, idx) => (
                      <motion.div
                        key={clan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isMember(clan.id) ? 'border-accent/30 bg-accent/5' : 'border-border'
                        }`}
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
                          <AvatarImage src={clan.avatar_url || undefined} />
                          <AvatarFallback
                            className="text-white text-xs font-bold"
                            style={{ background: clan.badge_color }}
                          >
                            {clan.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm text-foreground truncate block">{clan.name}</span>
                          <span className="text-[10px] text-muted-foreground">Lv.{clan.clan_level} • {getClanLevelTitle(clan.clan_level)}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-foreground">{clan.clan_xp} XP</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Clan Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md z-[150]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" /> Create a Clan
            </DialogTitle>
            <DialogDescription>Build your team and compete together.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Clan Name</Label>
              <Input placeholder="The Scholars" value={clanName} onChange={e => setClanName(e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea placeholder="What brings your clan together?" value={clanDesc} onChange={e => setClanDesc(e.target.value)} rows={2} maxLength={300} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Badge Color</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {BADGE_COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${clanBadgeColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ background: color }}
                      onClick={() => setClanBadgeColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max Members</Label>
                <Select value={String(clanMaxMembers)} onValueChange={v => setClanMaxMembers(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                onClick={handleCreate}
                disabled={createLoading || !clanName.trim()}
              >
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Crown className="w-4 h-4 mr-1" /> Create</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join by Code Dialog */}
      <Dialog open={showJoinCode} onOpenChange={setShowJoinCode}>
        <DialogContent className="sm:max-w-sm z-[150]">
          <DialogHeader>
            <DialogTitle>Join by Invite Code</DialogTitle>
            <DialogDescription>Enter the clan's invite code to join directly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Enter invite code..." value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
            <Button className="w-full" onClick={handleJoinByCode} disabled={!inviteCode.trim()}>
              <UserPlus className="w-4 h-4 mr-1" /> Join Clan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clan Detail Sheet */}
      <Dialog open={!!selectedClan} onOpenChange={open => !open && setSelectedClan(null)}>
        <DialogContent className="sm:max-w-lg z-[150] max-h-[85vh] overflow-hidden flex flex-col">
          {selectedClan && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedClan.avatar_url || undefined} />
                    <AvatarFallback style={{ background: selectedClan.badge_color }} className="text-white font-bold">
                      {selectedClan.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span>{selectedClan.name}</span>
                    <div className="text-xs text-muted-foreground font-normal flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Lv.{selectedClan.clan_level}</Badge>
                      <span><Zap className="w-3 h-3 inline text-yellow-500" /> {selectedClan.clan_xp} XP</span>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <Tabs defaultValue="members" className="space-y-3">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="members" className="text-xs gap-1"><Users className="w-3 h-3" /> Members</TabsTrigger>
                    <TabsTrigger value="parties" className="text-xs gap-1"><Gamepad2 className="w-3 h-3" /> Parties</TabsTrigger>
                    <TabsTrigger value="log" className="text-xs gap-1"><ScrollText className="w-3 h-3" /> Log</TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs gap-1"><Settings2 className="w-3 h-3" /> Info</TabsTrigger>
                  </TabsList>

                  {/* Members */}
                  <TabsContent value="members" className="space-y-3">
                    {isLeader(selectedClan.id) && joinRequests.length > 0 && (
                      <Card className="border-yellow-500/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Pending Requests ({joinRequests.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {joinRequests.map(req => (
                            <div key={req.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">{req.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium truncate block">{req.profile?.full_name || 'Unknown'}</span>
                                {req.message && <span className="text-[10px] text-muted-foreground truncate block">{req.message}</span>}
                              </div>
                              <Button size="sm" variant="ghost" className="text-green-600 h-7" onClick={() => handleJoinRequest(req.id, 'accepted')}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => handleJoinRequest(req.id, 'rejected')}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {clanMembers.filter(m => m.clan_id === selectedClan.id).map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{member.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{member.profile?.full_name || 'Unknown'}</span>
                          <span className={`text-[10px] font-medium ${getRoleColor(member.role)}`}>{getRoleLabel(member.role)}</span>
                        </div>
                        {isLeader(selectedClan.id) && member.user_id !== profile?.id && (
                          <Select value={member.role} onValueChange={v => updateMemberRole(member.id, v)}>
                            <SelectTrigger className="w-24 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="elder">Elder</SelectItem>
                              <SelectItem value="co_leader">Co-Leader</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </TabsContent>

                  {/* Parties */}
                  <TabsContent value="parties" className="space-y-3">
                    {isMember(selectedClan.id) && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="New party name..."
                          value={newPartyName}
                          onChange={e => setNewPartyName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          disabled={!newPartyName.trim()}
                          onClick={async () => {
                            await createParty(selectedClan.id, newPartyName.trim());
                            setNewPartyName('');
                            fetchParties(selectedClan.id);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Create
                        </Button>
                      </div>
                    )}

                    {parties.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No parties yet</p>
                        <p className="text-xs">Create a small battle squad!</p>
                      </div>
                    ) : (
                      parties.map(party => (
                        <Card key={party.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{party.name}</span>
                              <Badge variant="outline" className="text-[10px]">{party.members?.length || 0}/{party.max_members}</Badge>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {party.members?.map(m => (
                                <Avatar key={m.id} className="w-7 h-7">
                                  <AvatarFallback className="text-[10px]">{m.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            {isMember(selectedClan.id) && !party.members?.some(m => m.user_id === profile?.id) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 w-full"
                                onClick={async () => {
                                  await joinParty(party.id);
                                  fetchParties(selectedClan.id);
                                }}
                              >
                                Join Party
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Battle Log */}
                  <TabsContent value="log" className="space-y-2">
                    {battleLog.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No activity yet</p>
                      </div>
                    ) : (
                      battleLog.map(log => (
                        <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg border border-border text-sm">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            log.event_type.includes('won') ? 'bg-green-500/10 text-green-500' :
                            log.event_type.includes('lost') ? 'bg-red-500/10 text-red-500' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {log.event_type.includes('war') ? <Swords className="w-3 h-3" /> :
                             log.event_type.includes('joined') ? <UserPlus className="w-3 h-3" /> :
                             <Zap className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground">{log.description || log.event_type}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              {log.xp_earned > 0 && <span className="text-yellow-500">+{log.xp_earned} XP</span>}
                              <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Settings/Info */}
                  <TabsContent value="settings" className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Description</span>
                        <span className="text-foreground text-right max-w-[60%]">{selectedClan.description || 'None'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Level</span>
                        <span className="text-foreground">{selectedClan.clan_level} ({getClanLevelTitle(selectedClan.clan_level)})</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">XP</span>
                        <span className="text-foreground">{selectedClan.clan_xp}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Max Members</span>
                        <span className="text-foreground">{selectedClan.max_members}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min Level</span>
                        <span className="text-foreground">{selectedClan.min_level}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Recruiting</span>
                        <span className="text-foreground">{selectedClan.is_recruiting ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    {selectedClan.invite_code && isMember(selectedClan.id) && (
                      <div className="p-3 rounded-lg border border-dashed border-accent/30 bg-accent/5">
                        <Label className="text-xs text-muted-foreground mb-1 block">Invite Code</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-lg font-mono font-bold text-foreground tracking-wider">{selectedClan.invite_code}</code>
                          <Button size="sm" variant="ghost" onClick={() => copyInviteCode(selectedClan.invite_code!)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate('/messages')}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" /> Clan Chat
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate('/battles')}
                      >
                        <Swords className="w-4 h-4 mr-1" /> Clan Wars
                      </Button>
                    </div>

                    {isMember(selectedClan.id) && selectedClan.owner_id !== profile?.id && (
                      <Button
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={async () => {
                          await leaveClan(selectedClan.id);
                          setSelectedClan(null);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-1" /> Leave Clan
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Clans;
