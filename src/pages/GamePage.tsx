import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useClans } from '@/hooks/useClans';
import { ArrowLeft, Loader2, AlertCircle, Shield, Users } from 'lucide-react';
import GamePlayer from '@/components/games/GamePlayer';
import type { GameTemplate } from '@/hooks/useGameTemplates';
import type { GameConfig } from '@/lib/gameTypes';
import { toast } from 'sonner';

const GamePage = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [template, setTemplate] = useState<GameTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!shareCode) { setError('Invalid game link'); setLoading(false); return; }
      
      const { data, error: err } = await supabase
        .from('game_templates')
        .select('*')
        .eq('share_code', shareCode)
        .eq('is_published', true)
        .maybeSingle();

      if (err) { setError('Failed to load game'); setLoading(false); return; }
      if (!data) { setError('Game not found or not published'); setLoading(false); return; }

      setTemplate({ ...data, config: (data.config || {}) as GameConfig } as GameTemplate);
      setLoading(false);
    };

    fetchGame();
  }, [shareCode]);

  const handleComplete = async (score: number, maxScore: number) => {
    if (!template || !profile?.id) return;

    try {
      // Count existing attempts
      const { count } = await supabase
        .from('game_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', template.id)
        .eq('user_id', profile.id);

      await supabase.from('game_attempts').insert({
        game_id: template.id,
        user_id: profile.id,
        score,
        max_score: maxScore,
        completed: true,
        attempt_number: (count || 0) + 1,
      });

      toast.success(`Score: ${score}/${maxScore}`);
    } catch (err) {
      console.error('Failed to save attempt:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-lg font-semibold text-foreground">{error || 'Game not found'}</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GamePageContent template={template} handleComplete={handleComplete} navigate={navigate} />
  );
};

const GamePageContent = ({ template, handleComplete, navigate }: { template: GameTemplate; handleComplete: (s: number, m: number) => void; navigate: any }) => {
  const { myClans, loading: clansLoading } = useClans();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 pt-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <GamePlayer template={template} onComplete={handleComplete} />

        {/* Clan CTA */}
        {!clansLoading && myClans.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="mt-4 border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">Join a Clan!</p>
                  <p className="text-xs text-muted-foreground">Team up with others and compete in clan wars</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/clans')}>
                  <Users className="w-3 h-3 mr-1" /> Browse
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
