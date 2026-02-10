import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquare, Check, RotateCcw, Trophy, ArrowRight, User, Bot } from 'lucide-react';

interface DialogueBuilderPlayerProps {
  config: {
    dialogueScenarios?: {
      id: string;
      scenario: string;
      turns: {
        speaker: 'npc' | 'player';
        text?: string;
        options?: { id: string; text: string; isCorrect: boolean }[];
      }[];
    }[];
  };
  onComplete?: (score: number, maxScore: number) => void;
}

const DialogueBuilderPlayer = ({ config, onComplete }: DialogueBuilderPlayerProps) => {
  const scenarios = config.dialogueScenarios || [];
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);
  const [visibleTurns, setVisibleTurns] = useState<number[]>([0]);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = scenarios[scenarioIdx];
  if (!current) return <p className="text-center text-muted-foreground py-8">No dialogues configured</p>;

  const currentTurn = current.turns[turnIdx];

  const selectOption = (turnIndex: number, optionId: string) => {
    if (selectedOptions[turnIndex]) return;
    const turn = current.turns[turnIndex];
    if (!turn?.options) return;
    const option = turn.options.find(o => o.id === optionId);
    setSelectedOptions(prev => ({ ...prev, [turnIndex]: optionId }));
    setMaxScore(prev => prev + 1);
    if (option?.isCorrect) setScore(prev => prev + 1);

    // Advance to next turn
    setTimeout(() => {
      if (turnIdx + 1 < current.turns.length) {
        setTurnIdx(prev => prev + 1);
        setVisibleTurns(prev => [...prev, turnIdx + 1]);
      }
    }, 600);
  };

  const advanceTurn = () => {
    if (turnIdx + 1 < current.turns.length) {
      setTurnIdx(prev => prev + 1);
      setVisibleTurns(prev => [...prev, turnIdx + 1]);
    }
  };

  const nextScenario = () => {
    if (scenarioIdx + 1 < scenarios.length) {
      setScenarioIdx(prev => prev + 1);
      setTurnIdx(0);
      setVisibleTurns([0]);
      setSelectedOptions({});
    } else {
      setFinished(true);
      onComplete?.(score, maxScore);
    }
  };

  const isLastTurn = turnIdx >= current.turns.length - 1;
  const isCurrentTurnHandled = currentTurn?.speaker === 'player' ? !!selectedOptions[turnIdx] : false;

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 space-y-3">
        <Trophy className="w-10 h-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-lg text-foreground">Dialogue Complete!</p>
        {maxScore > 0 && <p className="text-muted-foreground">{score}/{maxScore} correct choices</p>}
        <Button variant="outline" onClick={() => { setScenarioIdx(0); setTurnIdx(0); setVisibleTurns([0]); setSelectedOptions({}); setScore(0); setMaxScore(0); setFinished(false); }}>
          <RotateCcw className="w-4 h-4 mr-1" /> Replay
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{scenarioIdx + 1}/{scenarios.length}</p>
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Scenario intro */}
      <div className="p-3 bg-muted/30 rounded-xl border border-border text-center">
        <p className="text-xs text-muted-foreground mb-1">Scenario</p>
        <p className="text-sm font-medium text-foreground">{current.scenario}</p>
      </div>

      {/* Chat bubbles */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {visibleTurns.map(ti => {
            const turn = current.turns[ti];
            if (!turn) return null;
            const isNPC = turn.speaker === 'npc';

            return (
              <motion.div
                key={ti}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-2', isNPC ? 'justify-start' : 'justify-end')}
              >
                {isNPC && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={cn('max-w-[75%]', isNPC ? '' : 'flex flex-col items-end')}>
                  {isNPC && turn.text && (
                    <div className="px-3 py-2 bg-muted rounded-2xl rounded-tl-sm">
                      <p className="text-sm text-foreground">{turn.text}</p>
                    </div>
                  )}
                  {!isNPC && turn.options && (
                    <div className="space-y-1.5 w-full">
                      {turn.options.map(opt => {
                        const chosen = selectedOptions[ti];
                        const isChosen = chosen === opt.id;
                        const isRight = chosen && isChosen && opt.isCorrect;
                        const isWrong = chosen && isChosen && !opt.isCorrect;
                        const showCorrect = chosen && !isChosen && opt.isCorrect;
                        return (
                          <motion.button
                            key={opt.id}
                            className={cn(
                              'w-full px-3 py-2 rounded-2xl rounded-tr-sm text-sm text-left border-2 transition-all',
                              isRight ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400' :
                              isWrong ? 'bg-destructive/10 border-destructive text-destructive' :
                              showCorrect ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600' :
                              chosen ? 'opacity-50 border-border text-muted-foreground' :
                              'bg-primary/5 border-primary/30 text-foreground hover:border-primary'
                            )}
                            onClick={() => selectOption(ti, opt.id)}
                            whileTap={!chosen ? { scale: 0.98 } : undefined}
                            disabled={!!chosen}
                          >
                            {opt.text}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                  {!isNPC && turn.text && selectedOptions[ti] && (
                    <div className="px-3 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm mt-1">
                      <p className="text-sm">{turn.options?.find(o => o.id === selectedOptions[ti])?.text}</p>
                    </div>
                  )}
                </div>
                {!isNPC && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Advance buttons */}
      <div className="flex justify-center">
        {currentTurn?.speaker === 'npc' && !isLastTurn && (
          <Button onClick={advanceTurn} size="sm" variant="ghost">
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        {(isLastTurn && (currentTurn?.speaker === 'npc' || isCurrentTurnHandled)) && (
          <Button onClick={nextScenario} size="sm">
            {scenarioIdx + 1 < scenarios.length ? 'Next Scenario →' : 'Finish'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DialogueBuilderPlayer;
