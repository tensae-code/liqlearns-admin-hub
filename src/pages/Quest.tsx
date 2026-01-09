import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Star,
  Flame,
  Trophy,
  Clock,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  Gift,
  Zap
} from 'lucide-react';

const dailyMissions = [
  { id: '1', title: 'Complete 3 lessons', xp: 50, aura: 10, progress: 2, total: 3, icon: '📚' },
  { id: '2', title: 'Practice vocabulary for 10 minutes', xp: 30, aura: 5, progress: 10, total: 10, completed: true, icon: '💬' },
  { id: '3', title: 'Watch 1 video lesson', xp: 25, aura: 5, progress: 0, total: 1, icon: '🎬' },
  { id: '4', title: 'Score 80%+ on a quiz', xp: 40, aura: 8, progress: 0, total: 1, icon: '✅' },
  { id: '5', title: 'Join a study room', xp: 35, aura: 7, progress: 0, total: 1, icon: '👥' },
];

const weeklyQuests = [
  { id: 'w1', title: 'Complete 15 lessons this week', xp: 300, aura: 50, progress: 8, total: 15, icon: '🎯' },
  { id: 'w2', title: 'Maintain 7-day streak', xp: 200, aura: 40, progress: 5, total: 7, icon: '🔥' },
  { id: 'w3', title: 'Earn 500 XP this week', xp: 150, aura: 30, progress: 320, total: 500, icon: '⭐' },
];

const achievements = [
  { id: 'a1', title: 'First Steps', description: 'Complete your first lesson', completed: true, icon: '🎓' },
  { id: 'a2', title: 'Streak Starter', description: 'Maintain a 3-day streak', completed: true, icon: '🔥' },
  { id: 'a3', title: 'Quiz Master', description: 'Score 100% on 5 quizzes', completed: false, progress: 3, total: 5, icon: '🏆' },
  { id: 'a4', title: 'Social Learner', description: 'Join 10 study rooms', completed: false, progress: 4, total: 10, icon: '👥' },
  { id: 'a5', title: 'Vocabulary Expert', description: 'Learn 500 words', completed: false, progress: 187, total: 500, icon: '📖' },
  { id: 'a6', title: 'Dedication Master', description: 'Maintain a 30-day streak', completed: false, locked: true, icon: '💎' },
];

const Quest = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'achievements'>('daily');

  const completedDaily = dailyMissions.filter(m => m.completed).length;
  const totalDailyXP = dailyMissions.reduce((sum, m) => sum + m.xp, 0);
  const earnedDailyXP = dailyMissions.filter(m => m.completed).reduce((sum, m) => sum + m.xp, 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">Quest Center</h1>
            <p className="text-muted-foreground">Complete quests to earn XP and Aura points</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-xl">
              <Star className="w-5 h-5 text-gold" />
              <span className="font-bold text-gold">1,250 XP</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-xl">
              <Zap className="w-5 h-5 text-accent" />
              <span className="font-bold text-accent">85 Aura</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily Progress Banner */}
      <motion.div
        className="mb-8 p-6 rounded-2xl bg-gradient-hero text-primary-foreground relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-display font-bold mb-1">Today's Progress</h2>
              <p className="text-primary-foreground/70">{completedDaily}/{dailyMissions.length} missions complete</p>
            </div>
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-streak" />
              <div>
                <p className="text-2xl font-bold">7</p>
                <p className="text-xs text-primary-foreground/70">day streak</p>
              </div>
            </div>
          </div>
          <Progress value={(completedDaily / dailyMissions.length) * 100} className="h-3 bg-primary-foreground/20" />
          <div className="flex items-center justify-between mt-2 text-sm">
            <span>{earnedDailyXP} XP earned</span>
            <span>{totalDailyXP - earnedDailyXP} XP remaining</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex gap-2 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { id: 'daily', label: 'Daily Missions', icon: Target },
          { id: 'weekly', label: 'Weekly Quests', icon: Trophy },
          { id: 'achievements', label: 'Achievements', icon: Star },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            className={activeTab === tab.id ? 'bg-gradient-accent text-accent-foreground' : ''}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </motion.div>

      {/* Content */}
      {activeTab === 'daily' && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Daily Missions</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Resets in 14h 32m</span>
            </div>
          </div>
          
          {dailyMissions.map((mission, i) => (
            <motion.div
              key={mission.id}
              className={`p-4 rounded-xl border transition-all ${
                mission.completed 
                  ? 'bg-success/5 border-success/30' 
                  : 'bg-card border-border hover:border-accent/30'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{mission.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${mission.completed ? 'text-success line-through' : 'text-foreground'}`}>
                      {mission.title}
                    </h3>
                    {mission.completed && <CheckCircle2 className="w-5 h-5 text-success" />}
                  </div>
                  {!mission.completed && (
                    <div className="mt-2">
                      <Progress value={(mission.progress / mission.total) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {mission.progress}/{mission.total} completed
                      </p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-1">
                    <Star className="w-3 h-3 mr-1 text-gold" />
                    +{mission.xp} XP
                  </Badge>
                  <p className="text-xs text-accent">+{mission.aura} Aura</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Bonus Reward */}
          <motion.div
            className="p-4 rounded-xl bg-gold/10 border border-gold/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">Complete All Missions</h3>
                <p className="text-sm text-muted-foreground">Finish all daily missions for a bonus reward!</p>
              </div>
              <Badge className="bg-gold text-gold-foreground">
                +100 Bonus XP
              </Badge>
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'weekly' && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Weekly Quests</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Resets in 3 days</span>
            </div>
          </div>

          {weeklyQuests.map((quest, i) => (
            <motion.div
              key={quest.id}
              className="p-5 rounded-xl bg-card border border-border hover:border-accent/30 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{quest.icon}</span>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground mb-2">{quest.title}</h3>
                  <Progress value={(quest.progress / quest.total) * 100} className="h-3 mb-2" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {quest.progress}/{quest.total} completed
                    </p>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1 text-gold" />
                        +{quest.xp} XP
                      </Badge>
                      <Badge variant="outline" className="text-accent border-accent">
                        <Zap className="w-3 h-3 mr-1" />
                        +{quest.aura} Aura
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeTab === 'achievements' && (
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {achievements.map((achievement, i) => (
            <motion.div
              key={achievement.id}
              className={`p-5 rounded-xl border transition-all ${
                achievement.completed 
                  ? 'bg-success/5 border-success/30'
                  : achievement.locked
                    ? 'bg-muted/50 border-border opacity-60'
                    : 'bg-card border-border hover:border-accent/30'
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <div className="flex items-start gap-4">
                <div className={`text-4xl ${achievement.locked ? 'grayscale' : ''}`}>
                  {achievement.locked ? '🔒' : achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-display font-semibold ${
                      achievement.completed ? 'text-success' : 'text-foreground'
                    }`}>
                      {achievement.title}
                    </h3>
                    {achievement.completed && <CheckCircle2 className="w-4 h-4 text-success" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  {!achievement.completed && !achievement.locked && achievement.progress !== undefined && (
                    <>
                      <Progress value={(achievement.progress / achievement.total!) * 100} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">{achievement.progress}/{achievement.total}</p>
                    </>
                  )}
                  {achievement.locked && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default Quest;
