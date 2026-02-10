import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import GamePlayer from '@/components/games/GamePlayer';
import type { GameTemplate } from '@/hooks/useGameTemplates';
import type { GameConfig } from '@/lib/gameTypes';

interface GameResourceProps {
  title: string;
  gameTemplateId?: string;
  onComplete?: (score: number, maxScore: number) => void;
  onClose: () => void;
}

const GameResource = ({ title, gameTemplateId, onComplete, onClose }: GameResourceProps) => {
  const [template, setTemplate] = useState<GameTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!gameTemplateId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('game_templates')
        .select('*')
        .eq('id', gameTemplateId)
        .single();

      if (!error && data) {
        setTemplate({ ...data, config: (data.config || {}) as GameConfig } as GameTemplate);
      }
      setLoading(false);
    };
    fetchTemplate();
  }, [gameTemplateId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl p-8 flex items-center justify-center"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </motion.div>
    );
  }

  if (!template) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl p-8"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Game template not found</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl"
    >
      <div className="flex justify-end mb-2">
        <Button variant="ghost" size="icon" onClick={onClose} className="bg-card/80 backdrop-blur-sm">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <GamePlayer template={template} onComplete={onComplete} />
    </motion.div>
  );
};

export default GameResource;
