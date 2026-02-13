import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Swords, Zap, Loader2, BookOpen, Gamepad2, Eye, EyeOff, Camera, Mic, MessageSquare, Shield, Users, UsersRound, GraduationCap, Crown } from 'lucide-react';
import type { BattleWallet } from '@/hooks/useBattles';

interface CreateBattleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: BattleWallet | null;
  onCreateBattle: (opts: {
    courseId?: string;
    gameId?: string;
    stakeAmount: number;
    isOpen: boolean;
    voiceEnabled: boolean;
    mode?: string;
    maxTeamSize?: number;
    isJudged?: boolean;
    isPrivate?: boolean;
    allowSpectators?: boolean;
    spectatorCamera?: boolean;
    spectatorAudio?: boolean;
    spectatorChat?: boolean;
  }) => Promise<any>;
}

interface CourseOption { id: string; title: string; category: string; }
interface GameOption { id: string; title: string; type: string; course_id: string | null; }

const BATTLE_MODES = [
  { id: '1v1', label: '1v1', icon: Swords, desc: 'Solo duel', teamSize: 1 },
  { id: '1v2', label: '1v2', icon: Users, desc: '1 vs 2 players', teamSize: 2 },
  { id: '1v5', label: '1v5', icon: Users, desc: '1 vs 5 players', teamSize: 5 },
  { id: '5v5', label: '5v5', icon: UsersRound, desc: 'Team battle', teamSize: 5 },
  { id: 'clan_v_clan', label: 'Clan v Clan', icon: Shield, desc: 'Clan warfare', teamSize: 10 },
  { id: 'party_v_party', label: 'Party v Party', icon: UsersRound, desc: 'Party clash', teamSize: 5 },
] as const;

const CreateBattleDialog = ({ open, onOpenChange, wallet, onCreateBattle }: CreateBattleDialogProps) => {
  const { profile } = useProfile();
  const [stakeAmount, setStakeAmount] = useState(10);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);

  // New fields
  const [mode, setMode] = useState('1v1');
  const [isJudged, setIsJudged] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [spectatorCamera, setSpectatorCamera] = useState(false);
  const [spectatorAudio, setSpectatorAudio] = useState(false);
  const [spectatorChat, setSpectatorChat] = useState(true);

  const selectedMode = BATTLE_MODES.find(m => m.id === mode) || BATTLE_MODES[0];

  useEffect(() => {
    if (!open || !profile?.id) return;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      const { data: enrollments } = await supabase
        .from('enrollments').select('course_id').eq('user_id', profile.id);
      if (enrollments?.length) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data } = await supabase
          .from('courses').select('id, title, category')
          .in('id', courseIds).eq('is_published', true);
        setCourses(data || []);
      }
      setLoadingCourses(false);
    };
    fetchCourses();
  }, [open, profile?.id]);

  useEffect(() => {
    if (!selectedCourseId) { setGames([]); setSelectedGameId(''); return; }
    const fetchGames = async () => {
      setLoadingGames(true);
      const { data } = await supabase
        .from('game_templates').select('id, title, type, course_id')
        .eq('course_id', selectedCourseId).eq('is_published', true);
      setGames(data || []);
      setLoadingGames(false);
    };
    fetchGames();
  }, [selectedCourseId]);

  const handleCreate = async () => {
    setCreating(true);
    await onCreateBattle({
      courseId: selectedCourseId || undefined,
      gameId: selectedGameId || undefined,
      stakeAmount,
      isOpen: true,
      voiceEnabled,
      mode,
      maxTeamSize: selectedMode.teamSize,
      isJudged,
      isPrivate,
      allowSpectators,
      spectatorCamera,
      spectatorAudio,
      spectatorChat,
    });
    setCreating(false);
    onOpenChange(false);
    setSelectedCourseId('');
    setSelectedGameId('');
    setStakeAmount(10);
    setMode('1v1');
    setIsJudged(false);
    setIsPrivate(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-accent" /> Create Battle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">

          {/* Battle Mode Selection */}
          <div>
            <Label className="mb-1.5 block">Battle Mode</Label>
            <div className="grid grid-cols-3 gap-2">
              {BATTLE_MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      mode === m.id
                        ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${mode === m.id ? 'text-accent' : 'text-muted-foreground'}`} />
                    <div className="text-xs font-semibold text-foreground">{m.label}</div>
                    <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Course Selection */}
          <div>
            <Label className="flex items-center gap-1 mb-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Course
            </Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCourses ? "Loading..." : "Select a course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Game Selection */}
          {selectedCourseId && (
            <div>
              <Label className="flex items-center gap-1 mb-1.5">
                <Gamepad2 className="w-3.5 h-3.5" /> Game
              </Label>
              {loadingGames ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading games...
                </div>
              ) : games.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No games available for this course</p>
              ) : (
                <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        <div className="flex items-center gap-2">
                          <span>{g.title}</span>
                          <Badge variant="outline" className="text-[10px] px-1">{g.type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Stake */}
          <div>
            <Label>Stake Amount (BP)</Label>
            <div className="flex gap-2 mt-1">
              {[5, 10, 25, 50].map(amt => (
                <Button
                  key={amt} size="sm"
                  variant={stakeAmount === amt ? 'default' : 'outline'}
                  onClick={() => setStakeAmount(amt)}
                  className={stakeAmount === amt ? 'bg-accent text-accent-foreground' : ''}
                >
                  {amt} BP
                </Button>
              ))}
            </div>
            <Input
              type="number" value={stakeAmount}
              onChange={e => setStakeAmount(Number(e.target.value))}
              min={1} max={wallet?.balance || 50} className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Balance: {wallet?.balance || 0} BP</p>
          </div>

          <Separator />

          {/* Judge & Privacy Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Teacher Judge
              </Label>
              <Switch checked={isJudged} onCheckedChange={setIsJudged} />
            </div>
            {isJudged && (
              <p className="text-[11px] text-muted-foreground -mt-1 ml-5">
                A teacher will moderate and judge the battle (e.g. Spelling Bee). Both players must be on camera.
              </p>
            )}

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Voice Chat
              </Label>
              <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                {isPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                Private Match
              </Label>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>

          <Separator />

          {/* Spectator Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 font-semibold">
                <Eye className="w-3.5 h-3.5" /> Allow Spectators
              </Label>
              <Switch checked={allowSpectators && !isPrivate} onCheckedChange={setAllowSpectators} disabled={isPrivate} />
            </div>

            {allowSpectators && !isPrivate && (
              <div className="ml-5 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Camera className="w-3 h-3" /> Show Camera Feed
                  </Label>
                  <Switch checked={spectatorCamera} onCheckedChange={setSpectatorCamera} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Mic className="w-3 h-3" /> Share Audio
                  </Label>
                  <Switch checked={spectatorAudio} onCheckedChange={setSpectatorAudio} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> Spectator Chat
                  </Label>
                  <Switch checked={spectatorChat} onCheckedChange={setSpectatorChat} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
            onClick={handleCreate}
            disabled={creating || stakeAmount > (wallet?.balance || 0)}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
            Find Opponent ({stakeAmount} BP) — {selectedMode.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBattleDialog;
