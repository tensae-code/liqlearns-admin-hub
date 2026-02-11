import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useClans } from '@/hooks/useClans';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Swords, Search, Check, Loader2, Gamepad2, Coins
} from 'lucide-react';

interface GameOption {
  id: string;
  title: string;
  type: string;
}

interface ClanWarRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (opts: {
    challengerClanId: string;
    opponentClanId: string;
    totalGames: number;
    stakePerMember: number;
    gameIds: string[];
  }) => Promise<any>;
}

const ClanWarRequestDialog = ({ open, onOpenChange, onSubmit }: ClanWarRequestDialogProps) => {
  const { profile } = useProfile();
  const { myClans, clans } = useClans();
  const [selectedClanId, setSelectedClanId] = useState('');
  const [targetClanId, setTargetClanId] = useState('');
  const [totalGames, setTotalGames] = useState(5);
  const [stakePerMember, setStakePerMember] = useState(10);
  const [clanSearch, setClanSearch] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [gameSearch, setGameSearch] = useState('');

  // Fetch published games for selection
  useEffect(() => {
    if (!open) return;
    const fetchGames = async () => {
      const { data } = await supabase
        .from('game_templates')
        .select('id, title, type')
        .eq('is_published', true)
        .order('title')
        .limit(50);
      setGames(data || []);
    };
    fetchGames();
  }, [open]);

  const myClanIds = myClans.map(c => c.id);
  const otherClans = clans.filter(c => !myClanIds.includes(c.id) && c.name.toLowerCase().includes(clanSearch.toLowerCase()));
  const filteredGames = games.filter(g => g.title.toLowerCase().includes(gameSearch.toLowerCase()));

  const toggleGame = (gameId: string) => {
    setSelectedGameIds(prev =>
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedClanId || !targetClanId) return;
    setRequesting(true);
    await onSubmit({
      challengerClanId: selectedClanId,
      opponentClanId: targetClanId,
      totalGames,
      stakePerMember,
      gameIds: selectedGameIds,
    });
    setRequesting(false);
    onOpenChange(false);
    setTargetClanId('');
    setClanSearch('');
    setSelectedGameIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Opponent Clan */}
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

          {/* Game Selection */}
          <div>
            <Label className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> Select Games
              {selectedGameIds.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{selectedGameIds.length} selected</Badge>
              )}
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                value={gameSearch}
                onChange={e => setGameSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-40 mt-2 border rounded-lg">
              {filteredGames.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">No games found</p>
              ) : (
                filteredGames.map(game => (
                  <div
                    key={game.id}
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGame(game.id)}
                  >
                    <Checkbox checked={selectedGameIds.includes(game.id)} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{game.title}</span>
                      <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">{game.type}</Badge>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Rounds */}
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
            onClick={handleSubmit}
            disabled={!selectedClanId || !targetClanId || requesting}
          >
            {requesting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Swords className="w-4 h-4 mr-1" />}
            Send War Challenge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClanWarRequestDialog;
