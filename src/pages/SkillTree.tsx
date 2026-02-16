import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSkills, SkillLevel } from '@/hooks/useSkillTree';
import { useCoins } from '@/hooks/useCoins';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ChevronRight,
  Lock,
  Unlock,
  Star,
  Coins,
  ArrowLeft,
  Trophy,
  Zap,
} from 'lucide-react';

const SkillTree = () => {
  const { categories, skills, loading, selectedCategory, setSelectedCategory, fetchSkillLevels } = useSkills();
  const { balance, spendCoins, refresh: refreshCoins } = useCoins();
  const { profile } = useProfile();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [levels, setLevels] = useState<SkillLevel[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);

  const handleSelectSkill = async (skillId: string) => {
    setSelectedSkill(skillId);
    setLoadingLevels(true);
    const data = await fetchSkillLevels(skillId);
    setLevels(data);
    setLoadingLevels(false);
  };

  const handleUnlockLevel = async (level: SkillLevel, skillId: string) => {
    if (!profile?.id) return;
    if (balance < level.coin_cost) {
      toast.error(`Need ${level.coin_cost} coins (you have ${balance})`);
      return;
    }

    const result = await spendCoins(level.coin_cost, 'level_activation', `Unlocked ${level.title}`, level.id);
    if (!result.success) {
      toast.error(result.error || 'Failed to unlock');
      return;
    }

    // Update user progress
    const currentProgress = skills.find(s => s.id === skillId)?.user_progress;
    if (currentProgress) {
      await supabase.from('user_skill_progress').update({
        current_level: level.level_number,
        xp_earned: (currentProgress.xp_earned || 0) + level.xp_reward,
        is_max_level: level.level_number >= (skills.find(s => s.id === skillId)?.max_level || 10),
        last_activity_at: new Date().toISOString(),
      }).eq('id', currentProgress.id);
    } else {
      await supabase.from('user_skill_progress').insert({
        user_id: profile.id,
        skill_id: skillId,
        current_level: level.level_number,
        xp_earned: level.xp_reward,
      });
    }

    toast.success(`🎉 Unlocked "${level.title}"! +${level.xp_reward} XP`);
    await refreshCoins();
  };

  const selectedSkillData = skills.find(s => s.id === selectedSkill);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {(selectedCategory || selectedSkill) && (
              <Button variant="ghost" size="icon" onClick={() => {
                if (selectedSkill) { setSelectedSkill(null); setLevels([]); }
                else setSelectedCategory(null);
              }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                <Zap className="w-8 h-8 text-accent" />
                {selectedSkillData ? selectedSkillData.name : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Skill Tree'}
              </h1>
              <p className="text-muted-foreground">
                {selectedSkillData ? selectedSkillData.description || 'Master each level to progress' : 'Choose a category to start learning'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border">
            <Coins className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-foreground">{balance}</span>
            <span className="text-sm text-muted-foreground">coins</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedSkill && selectedSkillData ? (
          /* Skill Levels View */
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedSkillData.icon}</span>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground">{selectedSkillData.name}</h3>
                  <p className="text-sm text-muted-foreground">Level {selectedSkillData.user_progress?.current_level || 0} / {selectedSkillData.max_level}</p>
                </div>
                <Progress value={((selectedSkillData.user_progress?.current_level || 0) / selectedSkillData.max_level) * 100} className="w-32 h-3" />
              </div>
            </div>

            {loadingLevels ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : levels.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No levels available yet. Teachers are working on content!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {levels.map((level, i) => {
                  const userLevel = selectedSkillData.user_progress?.current_level || 0;
                  const isUnlocked = level.level_number <= userLevel;
                  const isNext = level.level_number === userLevel + 1;
                  const isLocked = level.level_number > userLevel + 1;

                  return (
                    <motion.div
                      key={level.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl border transition-all ${
                        isUnlocked ? 'bg-accent/10 border-accent' : isNext ? 'bg-card border-primary hover:border-accent' : 'bg-muted/30 border-border opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                          isUnlocked ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isUnlocked ? <Star className="w-6 h-6" /> : isLocked ? <Lock className="w-5 h-5" /> : level.level_number}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{level.title}</h4>
                          <p className="text-sm text-muted-foreground">{level.description || `Level ${level.level_number}`}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs text-accent flex items-center gap-1">
                              <Coins className="w-3 h-3" /> {level.coin_cost} coins
                            </span>
                            <span className="text-xs text-muted-foreground">+{level.xp_reward} XP</span>
                          </div>
                        </div>
                        {isUnlocked ? (
                          <Badge className="bg-accent/20 text-accent border-accent">Completed</Badge>
                        ) : isNext ? (
                          <Button size="sm" onClick={() => handleUnlockLevel(level, selectedSkill!)}>
                            <Unlock className="w-4 h-4 mr-1" /> Unlock
                          </Button>
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : selectedCategory ? (
          /* Skills in Category */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.filter(s => s.category_id === selectedCategory).map((skill, i) => {
              const progress = skill.user_progress;
              const progressPercent = progress ? (progress.current_level / skill.max_level) * 100 : 0;

              return (
                <motion.button
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelectSkill(skill.id)}
                  className="p-5 rounded-xl bg-card border border-border hover:border-accent transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors">{skill.name}</h3>
                      <p className="text-xs text-muted-foreground">{skill.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progressPercent} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {progress?.current_level || 0}/{skill.max_level}
                    </span>
                  </div>
                </motion.button>
              );
            })}
            {skills.filter(s => s.category_id === selectedCategory).length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                <p>No skills in this category yet. Check back soon!</p>
              </div>
            )}
          </div>
        ) : (
          /* Category Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelectedCategory(cat.id)}
                className="p-6 rounded-xl bg-card border border-border hover:border-accent transition-all text-left group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10 text-6xl flex items-center justify-center">
                  {cat.icon}
                </div>
                <span className="text-4xl mb-3 block">{cat.icon}</span>
                <h3 className="text-xl font-display font-bold text-foreground group-hover:text-accent transition-colors mb-1">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-accent">
                  <span>Explore</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default SkillTree;
