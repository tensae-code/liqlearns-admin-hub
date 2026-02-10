import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 pt-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <GamePlayer template={template} onComplete={handleComplete} />
      </div>
    </div>
  );
};

export default GamePage;
