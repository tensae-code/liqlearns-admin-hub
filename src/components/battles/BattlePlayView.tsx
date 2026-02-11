import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import GamePlayer from '@/components/games/GamePlayer';
import type { GameTemplate } from '@/hooks/useGameTemplates';
import { toast } from 'sonner';
import {
  Mic, MicOff, Volume2, VolumeX, Send, MessageSquare, X,
  Trophy, Clock, Swords, ChevronUp, ChevronDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Battle, BattleMessage } from '@/hooks/useBattles';
import type { GameConfig } from '@/lib/gameTypes';

interface BattlePlayViewProps {
  battle: Battle;
  onClose: () => void;
  onComplete: (score: number, timeSeconds: number) => void;
}

const BattlePlayView = ({ battle, onClose, onComplete }: BattlePlayViewProps) => {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [gameTemplate, setGameTemplate] = useState<GameTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [opponentMuted, setOpponentMuted] = useState(false);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isChallenger = battle.challenger_id === profile?.id;
  const opponentName = isChallenger
    ? (battle.opponent_profile?.full_name || 'Opponent')
    : (battle.challenger_profile?.full_name || 'Opponent');

  // Fetch game template
  useEffect(() => {
    const fetchGame = async () => {
      if (!battle.game_id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('game_templates')
        .select('*')
        .eq('id', battle.game_id)
        .single();
      if (data) {
        setGameTemplate({ ...data, config: data.config as unknown as GameConfig, is_published: data.is_published ?? false, is_template: data.is_template ?? false } as GameTemplate);
      }
      setLoading(false);
    };
    fetchGame();
  }, [battle.game_id]);

  // Fetch & subscribe to battle messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('battle_messages')
        .select('*')
        .eq('battle_id', battle.id)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) {
        // Fetch sender profiles
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);
        setMessages(data.map(m => ({
          ...m,
          sender_profile: profiles?.find(p => p.id === m.sender_id),
        })));
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`battle-chat-${battle.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'battle_messages',
        filter: `battle_id=eq.${battle.id}`,
      }, async (payload) => {
        const msg = payload.new as any;
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', msg.sender_id)
          .single();
        setMessages(prev => [...prev, { ...msg, sender_profile: senderProfile }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [battle.id]);

  // Subscribe to battle updates for opponent score
  useEffect(() => {
    const channel = supabase
      .channel(`battle-updates-${battle.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battle.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        if (isChallenger && updated.opponent_score !== null) {
          setOpponentScore(updated.opponent_score);
        } else if (!isChallenger && updated.challenger_score !== null) {
          setOpponentScore(updated.challenger_score);
        }
        if (updated.status === 'completed') {
          setCompleted(true);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [battle.id, isChallenger]);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile?.id) return;
    const { error } = await supabase.from('battle_messages').insert({
      battle_id: battle.id,
      sender_id: profile.id,
      content: newMessage.trim(),
    });
    if (!error) setNewMessage('');
  };

  const handleGameComplete = async (score: number, maxScore: number) => {
    if (myScore !== null) return; // Already submitted
    const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
    setMyScore(score);

    // Update battle with score
    const updateField = isChallenger
      ? { challenger_score: score, challenger_time_seconds: timeSeconds }
      : { opponent_score: score, opponent_time_seconds: timeSeconds };

    await supabase.from('battles').update({
      ...updateField,
      status: 'in_progress',
    }).eq('id', battle.id);

    // Check if both players done - determine winner
    const { data: currentBattle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battle.id)
      .single();

    if (currentBattle) {
      const cScore = isChallenger ? score : currentBattle.challenger_score;
      const oScore = isChallenger ? currentBattle.opponent_score : score;

      if (cScore !== null && oScore !== null) {
        // Both done - determine winner
        let winnerId: string | null = null;
        if (cScore > oScore) winnerId = currentBattle.challenger_id;
        else if (oScore > cScore) winnerId = currentBattle.opponent_id;

        // Update battle as completed
        await supabase.from('battles').update({
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        }).eq('id', battle.id);

        // Update wallets via individual queries
        const stake = currentBattle.stake_amount;
        if (winnerId) {
          const loserId = winnerId === currentBattle.challenger_id
            ? currentBattle.opponent_id
            : currentBattle.challenger_id;
          // Get current wallets and update
          const { data: winnerWallet } = await supabase.from('battle_wallets').select('*').eq('user_id', winnerId).single();
          const { data: loserWallet } = loserId ? await supabase.from('battle_wallets').select('*').eq('user_id', loserId).single() : { data: null };
          if (winnerWallet) {
            await supabase.from('battle_wallets').update({
              balance: winnerWallet.balance + stake,
              total_won: winnerWallet.total_won + stake,
              wins: winnerWallet.wins + 1,
              rank_points: winnerWallet.rank_points + 25,
            }).eq('user_id', winnerId);
          }
          if (loserWallet && loserId) {
            await supabase.from('battle_wallets').update({
              balance: Math.max(0, loserWallet.balance - stake),
              total_lost: loserWallet.total_lost + stake,
              losses: loserWallet.losses + 1,
              rank_points: Math.max(0, loserWallet.rank_points - 15),
            }).eq('user_id', loserId);
          }
        }

        setCompleted(true);
      }
    }

    onComplete(score, timeSeconds);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Results screen
  if (completed || myScore !== null) {
    const won = battle.winner_id === profile?.id;
    const draw = !battle.winner_id && completed;
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className={`rounded-2xl border p-6 text-center space-y-4 ${
            won ? 'bg-green-500/10 border-green-500/30' :
            draw ? 'bg-muted border-border' :
            completed ? 'bg-red-500/10 border-red-500/30' :
            'bg-muted border-border'
          }`}>
            <div className="text-4xl">
              {won ? '🏆' : draw ? '🤝' : completed ? '😤' : '⏳'}
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {won ? 'Victory!' : draw ? 'Draw!' : completed ? 'Defeated' : 'Waiting for opponent...'}
            </h2>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">You</div>
                <div className="text-3xl font-bold text-foreground">{myScore ?? '—'}</div>
              </div>
              <Swords className="w-6 h-6 text-muted-foreground" />
              <div className="text-center">
                <div className="text-sm text-muted-foreground">{opponentName}</div>
                <div className="text-3xl font-bold text-foreground">{opponentScore ?? '—'}</div>
              </div>
            </div>
            {completed && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-muted-foreground">
                  {won ? `+${battle.stake_amount} BP` : draw ? '0 BP' : `-${battle.stake_amount} BP`}
                </span>
              </div>
            )}
            <Button onClick={onClose} className="w-full">
              Back to Arena
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <Swords className="w-5 h-5 text-accent" />
          <span className="font-semibold text-sm text-foreground">vs {opponentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            {battle.stake_amount} BP
          </Badge>
          {battle.voice_enabled && (
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8"
              onClick={() => setOpponentMuted(!opponentMuted)}
            >
              {opponentMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageSquare className={`w-4 h-4 ${chatOpen ? 'text-accent' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game area */}
        <div className={`flex-1 overflow-y-auto p-4 ${chatOpen ? 'hidden md:block' : ''}`}>
          {gameTemplate ? (
            <GamePlayer
              template={gameTemplate}
              onComplete={handleGameComplete}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <Swords className="w-12 h-12 mx-auto opacity-30" />
                <p>No game selected for this battle</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border flex flex-col bg-card w-full md:w-[300px] shrink-0"
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Battle Chat</span>
                <Button size="icon" variant="ghost" className="w-6 h-6 md:hidden" onClick={() => setChatOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map(msg => {
                    const isMe = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-6 h-6 shrink-0">
                          <AvatarFallback className="text-[10px] bg-accent/10 text-accent">
                            {msg.sender_profile?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`rounded-lg px-3 py-1.5 text-xs max-w-[200px] ${
                          isMe ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-2 border-t border-border flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Send a message..."
                  className="text-xs h-8"
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <Button size="icon" className="w-8 h-8 shrink-0" onClick={sendMessage}>
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BattlePlayView;
