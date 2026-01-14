import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useClans, Clan, ClanMember } from '@/hooks/useClans';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateClanModal from '@/components/clan/CreateClanModal';
import {
  Sword,
  Shield,
  Flame,
  Crown,
  Star,
  Zap,
  Target,
  Rocket,
  Gem,
  Trophy,
  Heart,
  Skull,
  Moon,
  Sun,
  Anchor,
  Mountain,
  Users,
  Award,
  Plus,
  Search,
  LogOut,
  UserPlus,
  X,
  Loader2,
} from 'lucide-react';

interface ClanPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClanPopup = ({ isOpen, onClose }: ClanPopupProps) => {
  const navigate = useNavigate();
  const { clans, myClans, clanMembers, loading, fetchClanMembers, fetchMyClans, joinClan, leaveClan } = useClans();
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningClanId, setJoiningClanId] = useState<string | null>(null);
  const [leavingClanId, setLeavingClanId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load members when a clan is selected
  useEffect(() => {
    if (selectedClan) {
      fetchClanMembers(selectedClan.id);
    }
  }, [selectedClan, fetchClanMembers]);

  if (!isOpen) return null;

  const filteredClans = clans.filter(clan => 
    clan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (clan.description && clan.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isMember = (clanId: string) => myClans.some(c => c.id === clanId);

  const handleJoinClan = async (clanId: string) => {
    setJoiningClanId(clanId);
    await joinClan(clanId);
    setJoiningClanId(null);
  };

  const handleLeaveClan = async (clanId: string) => {
    setLeavingClanId(clanId);
    await leaveClan(clanId);
    setLeavingClanId(null);
    if (selectedClan?.id === clanId) {
      setSelectedClan(null);
    }
  };

  const handleClanCreated = () => {
    fetchMyClans();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed z-[100] w-[95%] max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        style={{ top: '10%', left: '50%', transform: 'translateX(-50%)', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold">
            {selectedClan ? selectedClan.name : 'Clans'}
          </h3>
          <div className="flex items-center gap-2">
            {selectedClan && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setSelectedClan(null)}
              >
                Back
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <AnimatePresence mode="wait">
            {selectedClan ? (
              /* Clan Detail View */
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Clan Logo & Info */}
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-2">
                    <AvatarImage src={selectedClan.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl">
                      {selectedClan.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="text-xl font-bold text-foreground">{selectedClan.name}</h4>
                  {selectedClan.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedClan.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Users className="w-4 h-4 mx-auto text-violet-500 mb-1" />
                    <p className="text-lg font-bold text-foreground">{clanMembers.length}</p>
                    <p className="text-[10px] text-muted-foreground">Members</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Award className="w-4 h-4 mx-auto text-gold mb-1" />
                    <p className="text-lg font-bold text-foreground">--</p>
                    <p className="text-[10px] text-muted-foreground">Team XP</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Trophy className="w-4 h-4 mx-auto text-accent mb-1" />
                    <p className="text-lg font-bold text-foreground">--</p>
                    <p className="text-[10px] text-muted-foreground">Rank</p>
                  </div>
                </div>

                {/* Members List */}
                <div>
                  <h5 className="text-sm font-semibold text-foreground mb-2">Members</h5>
                  <div className="space-y-2">
                    {clanMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.profile?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.profile?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                        {member.role === 'owner' && (
                          <Crown className="w-4 h-4 text-gold" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {isMember(selectedClan.id) ? (
                    <Button 
                      variant="outline"
                      className="w-full border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleLeaveClan(selectedClan.id)}
                      disabled={leavingClanId === selectedClan.id}
                    >
                      {leavingClanId === selectedClan.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4 mr-2" />
                      )}
                      Leave Clan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                      onClick={() => handleJoinClan(selectedClan.id)}
                      disabled={joiningClanId === selectedClan.id}
                    >
                      {joiningClanId === selectedClan.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Join Clan
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Clan List View */
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4"
              >
                <Tabs defaultValue={myClans.length > 0 ? 'my-clans' : 'discover'}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="my-clans">My Clans ({myClans.length})</TabsTrigger>
                    <TabsTrigger value="discover">Discover</TabsTrigger>
                  </TabsList>

                  <TabsContent value="my-clans" className="space-y-3">
                    {myClans.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">You haven't joined any clans yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Discover clans or create your own!
                        </p>
                      </div>
                    ) : (
                      myClans.map((clan) => (
                        <motion.div
                          key={clan.id}
                          className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-violet-500/30"
                          onClick={() => setSelectedClan(clan)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={clan.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                {clan.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground">{clan.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {clan.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="discover" className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search clans..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredClans.length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No clans found</p>
                      </div>
                    ) : (
                      filteredClans.map((clan) => (
                        <motion.div
                          key={clan.id}
                          className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedClan(clan)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={clan.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                {clan.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground">{clan.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {clan.description || 'No description'}
                              </p>
                            </div>
                            {isMember(clan.id) && (
                              <span className="text-xs bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-1 rounded-full">
                                Joined
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>

                {/* Create Clan Button */}
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Clan
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </motion.div>

      {/* Create Clan Modal */}
      <CreateClanModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onClanCreated={handleClanCreated}
      />
    </motion.div>
  );
};

export default ClanPopup;
