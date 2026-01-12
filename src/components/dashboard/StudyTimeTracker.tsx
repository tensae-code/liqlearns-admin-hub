import { motion } from 'framer-motion';
import { Clock, Play, Pause, Target, Flame, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudyTime } from '@/hooks/useStudyTime';
import { cn } from '@/lib/utils';

interface StudyTimeTrackerProps {
  roomId?: string;
  compact?: boolean;
}

const StudyTimeTracker = ({ roomId, compact = false }: StudyTimeTrackerProps) => {
  const {
    currentSession,
    elapsedSeconds,
    totalTodaySeconds,
    remainingForStreak,
    streakProgress,
    isStreakEligible,
    startSession,
    endSession,
    formatTime,
    STREAK_REQUIREMENT_SECONDS,
  } = useStudyTime();

  const handleToggle = async () => {
    if (currentSession) {
      await endSession();
    } else {
      await startSession(roomId);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
        <div className={cn(
          "w-2 h-2 rounded-full",
          currentSession ? "bg-success animate-pulse" : "bg-muted-foreground"
        )} />
        <span className="text-sm font-medium text-foreground">
          {currentSession ? formatTime(elapsedSeconds) : 'Not studying'}
        </span>
        <Button
          variant={currentSession ? "destructive" : "default"}
          size="sm"
          className="h-7 px-2"
          onClick={handleToggle}
        >
          {currentSession ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            currentSession 
              ? "bg-gradient-to-br from-success to-emerald-600" 
              : "bg-gradient-to-br from-accent to-primary"
          )}>
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">Study Time</h2>
            <p className="text-xs text-muted-foreground">
              {currentSession ? 'Session active' : 'Start studying'}
            </p>
          </div>
        </div>
        <Button
          variant={currentSession ? "destructive" : "default"}
          size="sm"
          onClick={handleToggle}
          className="gap-1"
        >
          {currentSession ? (
            <>
              <Pause className="w-4 h-4" /> Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Start
            </>
          )}
        </Button>
      </div>

      {/* Current Session Timer */}
      {currentSession && (
        <motion.div
          className="p-4 rounded-lg bg-success/10 border border-success/30 mb-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Session</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success">Live</span>
            </div>
          </div>
          <motion.p
            className="text-3xl font-display font-bold text-success mt-1"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {formatTime(elapsedSeconds)}
          </motion.p>
        </motion.div>
      )}

      {/* Today's Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Daily Goal</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatTime(totalTodaySeconds)} / {formatTime(STREAK_REQUIREMENT_SECONDS)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isStreakEligible 
                ? "bg-gradient-to-r from-success to-emerald-400" 
                : "bg-gradient-to-r from-accent to-primary"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${streakProgress}%` }}
            transition={{ duration: 0.5 }}
          />
          {/* 30 min marker */}
          <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-streak/50" style={{ left: '100%' }} />
        </div>

        {/* Streak Status */}
        <div className={cn(
          "p-3 rounded-lg flex items-center gap-3",
          isStreakEligible 
            ? "bg-streak/10 border border-streak/30" 
            : "bg-muted"
        )}>
          {isStreakEligible ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-streak" />
              <div>
                <p className="text-sm font-medium text-streak">Streak Secured! 🔥</p>
                <p className="text-xs text-muted-foreground">You've studied 30+ minutes today</p>
              </div>
            </>
          ) : (
            <>
              <Flame className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatTime(remainingForStreak)} to go
                </p>
                <p className="text-xs text-muted-foreground">Study 30 min to keep your streak</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-center">
          <p className="text-lg font-display font-bold text-accent">
            {formatTime(totalTodaySeconds)}
          </p>
          <p className="text-[10px] text-muted-foreground">Total Today</p>
        </div>
        <div className="p-3 rounded-lg bg-gold/10 border border-gold/20 text-center">
          <p className="text-lg font-display font-bold text-gold">
            {Math.round(streakProgress)}%
          </p>
          <p className="text-[10px] text-muted-foreground">Goal Progress</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StudyTimeTracker;
