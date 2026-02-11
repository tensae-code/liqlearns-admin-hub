import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useOptionalLiveKitContext } from '@/contexts/LiveKitContext';
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
  Trophy, Clock, Swords, Loader2, Phone, PhoneOff,
  CheckCircle2, XCircle, RotateCcw, RefreshCw, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Battle, BattleMessage } from '@/hooks/useBattles';
import type { GameConfig } from '@/lib/gameTypes';

interface BattlePlayViewProps {
  battle: Battle;
  onClose: () => void;
  onComplete: (score: number, timeSeconds: number) => void;
  onRematch?: (battle: Battle) => void;
}

interface ReviewItem {
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

const BATTLE_TIME_LIMIT = 300; // 5 minutes

const BattlePlayView = ({ battle, onClose, onComplete, onRematch }: BattlePlayViewProps) => {
  const { profile } = useProfile();
  const livekit = useOptionalLiveKitContext();
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [gameTemplate, setGameTemplate] = useState<GameTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [opponentMuted, setOpponentMuted] = useState(false);
  const [myMicOn, setMyMicOn] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [timeLeft, setTimeLeft] = useState(BATTLE_TIME_LIMIT);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isChallenger = battle.challenger_id === profile?.id;
  const opponentName = isChallenger
    ? (battle.opponent_profile?.full_name || 'Opponent')
    : (battle.challenger_profile?.full_name || 'Opponent');

  // Connect voice chat if enabled
  useEffect(() => {
    if (!battle.voice_enabled || !livekit || !profile?.id) return;
    
    const connectVoice = async () => {
      try {
        const roomName = `battle:${battle.id}`;
        await livekit.connect(roomName, 'dm' as any, battle.id, 'speaker');
        setVoiceConnected(true);
        setMyMicOn(true);
      } catch (err) {
        console.error('Voice connect failed:', err);
      }
    };
    connectVoice();

    return () => {
      if (voiceConnected && livekit) {
        livekit.disconnect();
        setVoiceConnected(false);
      }
    };
  }, [battle.voice_enabled, battle.id, profile?.id]);

  const toggleMyMic = () => {
    if (livekit) {
      livekit.toggleMute();
      setMyMicOn(!myMicOn);
    }
  };

  const toggleOpponentMute = () => {
    // Mute opponent audio locally using room reference
    if (livekit?.room) {
      const room = livekit.room;
      room.remoteParticipants.forEach(p => {
        p.audioTrackPublications.forEach(pub => {
          if (pub.track) {
            (pub.track.mediaStreamTrack as MediaStreamTrack).enabled = opponentMuted; // toggle: if currently muted, enable
          }
        });
      });
    }
    setOpponentMuted(!opponentMuted);
  };

  const disconnectVoice = () => {
    if (livekit) {
      livekit.disconnect();
      setVoiceConnected(false);
      setMyMicOn(false);
    }
  };

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

  // Countdown timer
  useEffect(() => {
    if (myScore !== null || completed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto-submit with score 0
          clearInterval(timerRef.current!);
          handleGameComplete(0, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [myScore, completed]);

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
    if (myScore !== null) return;
    const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
    setMyScore(score);

    // Build review items from game config
    if (gameTemplate?.config) {
      const config = gameTemplate.config as any;
      const items: ReviewItem[] = [];
      
      if (config.questions) {
        config.questions.forEach((q: any, i: number) => {
          items.push({
            question: q.question || q.text || `Question ${i + 1}`,
            yourAnswer: q.userAnswer || '—',
            correctAnswer: q.correctAnswer || q.answer || '—',
            isCorrect: q.userAnswer === q.correctAnswer || q.answer,
          });
        });
      }
      if (items.length > 0) setReviewItems(items);
    }

    const updateField = isChallenger
      ? { challenger_score: score, challenger_time_seconds: timeSeconds }
      : { opponent_score: score, opponent_time_seconds: timeSeconds };

    await supabase.from('battles').update({
      ...updateField,
      status: 'in_progress',
    }).eq('id', battle.id);

    const { data: currentBattle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battle.id)
      .single();

    if (currentBattle) {
      const cScore = isChallenger ? score : currentBattle.challenger_score;
      const oScore = isChallenger ? currentBattle.opponent_score : score;

      if (cScore !== null && oScore !== null) {
        let winnerId: string | null = null;
        if (cScore > oScore) winnerId = currentBattle.challenger_id;
        else if (oScore > cScore) winnerId = currentBattle.opponent_id;
        else {
          // Tiebreaker: fewer time wins, then fewer moves (approximated by time)
          const cTime = isChallenger ? timeSeconds : currentBattle.challenger_time_seconds;
          const oTime = isChallenger ? currentBattle.opponent_time_seconds : timeSeconds;
          if (cTime !== null && oTime !== null) {
            if (cTime < oTime) winnerId = currentBattle.challenger_id;
            else if (oTime < cTime) winnerId = currentBattle.opponent_id;
            // If still tied, it's a draw (winnerId stays null)
          }
        }

        await supabase.from('battles').update({
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        }).eq('id', battle.id);

        const stake = currentBattle.stake_amount;
        if (winnerId) {
          const loserId = winnerId === currentBattle.challenger_id
            ? currentBattle.opponent_id
            : currentBattle.challenger_id;
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

        // Update per-game-type ELO ratings
        if (gameTemplate?.type) {
          const gameType = gameTemplate.type;
          const playersToUpdate = [currentBattle.challenger_id, currentBattle.opponent_id].filter(Boolean) as string[];
          
          for (const playerId of playersToUpdate) {
            const isWinner = winnerId === playerId;
            const isDraw = !winnerId;
            
            // Upsert ELO record
            const { data: existing } = await supabase
              .from('player_game_elo')
              .select('*')
              .eq('user_id', playerId)
              .eq('game_type', gameType)
              .maybeSingle();
            
            const currentElo = existing?.elo_rating || 1000;
            const eloChange = isDraw ? 0 : isWinner ? 20 : -15;
            const newElo = Math.max(100, currentElo + eloChange);

            if (existing) {
              await supabase.from('player_game_elo').update({
                elo_rating: newElo,
                games_played: (existing.games_played || 0) + 1,
                wins: (existing.wins || 0) + (isWinner ? 1 : 0),
                losses: (existing.losses || 0) + (!isWinner && !isDraw ? 1 : 0),
                updated_at: new Date().toISOString(),
              }).eq('id', existing.id);
            } else {
              await supabase.from('player_game_elo').insert({
                user_id: playerId,
                game_type: gameType,
                elo_rating: newElo,
                games_played: 1,
                wins: isWinner ? 1 : 0,
                losses: !isWinner && !isDraw ? 1 : 0,
              });
            }
          }
        }

        setCompleted(true);
        // Disconnect voice when battle ends
        if (voiceConnected && livekit) {
          livekit.disconnect();
          setVoiceConnected(false);
        }
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

  // Results screen with review
  if (completed || myScore !== null) {
    const won = battle.winner_id === profile?.id;
    const draw = !battle.winner_id && completed;
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full my-8"
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

            {/* Game Review Section */}
            {reviewItems.length > 0 && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReview(!showReview)}
                  className="gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {showReview ? 'Hide Review' : 'Review Answers'}
                </Button>
                <AnimatePresence>
                  {showReview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2 text-left max-h-60 overflow-y-auto">
                        {reviewItems.map((item, i) => (
                          <div key={i} className={`p-2.5 rounded-lg border text-xs ${
                            item.isCorrect
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-red-500/5 border-red-500/20'
                          }`}>
                            <div className="flex items-start gap-2">
                              {item.isCorrect
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                              }
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">{item.question}</p>
                                {!item.isCorrect && (
                                  <>
                                    <p className="text-red-500 mt-0.5">Your: {item.yourAnswer}</p>
                                    <p className="text-green-600 mt-0.5">Correct: {item.correctAnswer}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Chat history in results */}
            {messages.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Battle Chat ({messages.length} messages)</p>
                <ScrollArea className="max-h-32 text-left">
                  <div className="space-y-1">
                    {messages.map(msg => (
                      <div key={msg.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {msg.sender_profile?.full_name || 'Unknown'}:
                        </span>{' '}
                        {msg.content}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex gap-2">
              {completed && onRematch && (
                <Button variant="outline" className="flex-1 gap-1" onClick={() => onRematch(battle)}>
                  <RefreshCw className="w-4 h-4" /> Rematch
                </Button>
              )}
              <Button onClick={onClose} className={completed && onRematch ? 'flex-1' : 'w-full'}>
                Back to Arena
              </Button>
            </div>
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
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            {battle.stake_amount} BP
          </Badge>

          {/* Countdown Timer */}
          <Badge variant="outline" className={`gap-1 font-mono ${
            timeLeft <= 30 ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' :
            timeLeft <= 60 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
            'bg-muted text-foreground border-border'
          }`}>
            <Timer className="w-3 h-3" />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Badge>

          {/* Voice controls */}
          {battle.voice_enabled && (
            <div className="flex items-center gap-1">
              {voiceConnected ? (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8"
                    onClick={toggleMyMic}
                    title={myMicOn ? 'Mute yourself' : 'Unmute yourself'}
                  >
                    {myMicOn ? <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-red-500" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8"
                    onClick={toggleOpponentMute}
                    title={opponentMuted ? 'Unmute opponent' : 'Mute opponent'}
                  >
                    {opponentMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-red-500 hover:text-red-600"
                    onClick={disconnectVoice}
                    title="Leave voice"
                  >
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-green-600 border-green-500/30"
                  onClick={async () => {
                    if (livekit && profile?.id) {
                      try {
                        await livekit.connect(`battle:${battle.id}`, 'dm' as any, battle.id, 'speaker');
                        setVoiceConnected(true);
                        setMyMicOn(true);
                      } catch { toast.error('Voice connect failed'); }
                    }
                  }}
                >
                  <Phone className="w-3 h-3" /> Join Voice
                </Button>
              )}
            </div>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageSquare className={`w-4 h-4 ${chatOpen ? 'text-accent' : ''}`} />
            {messages.length > 0 && !chatOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
            )}
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
