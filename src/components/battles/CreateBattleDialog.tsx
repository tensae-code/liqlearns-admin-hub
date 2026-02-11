import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Swords, Zap, Loader2, BookOpen, Gamepad2, Search } from 'lucide-react';
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
  }) => Promise<any>;
}

interface CourseOption {
  id: string;
  title: string;
  category: string;
}

interface GameOption {
  id: string;
  title: string;
  type: string;
  course_id: string | null;
}

const CreateBattleDialog = ({ open, onOpenChange, wallet, onCreateBattle }: CreateBattleDialogProps) => {
  const { profile } = useProfile();
  const [stakeAmount, setStakeAmount] = useState(10);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);

  // Fetch enrolled courses
  useEffect(() => {
    if (!open || !profile?.id) return;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', profile.id);
      
      if (enrollments?.length) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data } = await supabase
          .from('courses')
          .select('id, title, category')
          .in('id', courseIds)
          .eq('is_published', true);
        setCourses(data || []);
      }
      setLoadingCourses(false);
    };
    fetchCourses();
  }, [open, profile?.id]);

  // Fetch games when course selected
  useEffect(() => {
    if (!selectedCourseId) {
      setGames([]);
      setSelectedGameId('');
      return;
    }
    const fetchGames = async () => {
      setLoadingGames(true);
      const { data } = await supabase
        .from('game_templates')
        .select('id, title, type, course_id')
        .eq('course_id', selectedCourseId)
        .eq('is_published', true);
      setGames(data || []);
      setLoadingGames(false);
    };
    fetchGames();
  }, [selectedCourseId]);

  const handleCreate = async () => {
    if (!selectedGameId) {
      // If no game selected, still create the battle
    }
    setCreating(true);
    await onCreateBattle({
      courseId: selectedCourseId || undefined,
      gameId: selectedGameId || undefined,
      stakeAmount,
      isOpen: true,
      voiceEnabled,
    });
    setCreating(false);
    onOpenChange(false);
    // Reset
    setSelectedCourseId('');
    setSelectedGameId('');
    setStakeAmount(10);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-accent" /> Create Battle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
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
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
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
                  key={amt}
                  size="sm"
                  variant={stakeAmount === amt ? 'default' : 'outline'}
                  onClick={() => setStakeAmount(amt)}
                  className={stakeAmount === amt ? 'bg-accent text-accent-foreground' : ''}
                >
                  {amt} BP
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={stakeAmount}
              onChange={e => setStakeAmount(Number(e.target.value))}
              min={1}
              max={wallet?.balance || 50}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Balance: {wallet?.balance || 0} BP</p>
          </div>

          {/* Voice */}
          <div className="flex items-center justify-between">
            <Label>Voice Chat</Label>
            <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
          </div>

          <Separator />

          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
            onClick={handleCreate}
            disabled={creating || stakeAmount > (wallet?.balance || 0)}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
            Find Opponent ({stakeAmount} BP)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBattleDialog;
