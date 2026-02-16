import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  BookOpen,
  CheckCircle,
} from 'lucide-react';

const SkillTree = () => {
  const { categories, skills, loading, selectedCategory, setSelectedCategory, fetchSkillLevels } = useSkills();
  const { balance, spendCoins, refresh: refreshCoins } = useCoins();
  const { profile } = useProfile();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [levels, setLevels] = useState<SkillLevel[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [viewingLevel, setViewingLevel] = useState<SkillLevel | null>(null);

  const handleSelectSkill = async (skillId: string) => {
    setSelectedSkill(skillId);
    setLoadingLevels(true);
    const data = await fetchSkillLevels(skillId);
    setLevels(data);
    setLoadingLevels(false);
  };

  const handleUnlockLevel = async (level: SkillLevel, skillId: string) => {
    if (!profile?.id) return;
    if (level.coin_cost > 0 && balance < level.coin_cost) {
      toast.error(`Need ${level.coin_cost} coins (you have ${balance})`);
      return;
    }

    if (level.coin_cost > 0) {
      const result = await spendCoins(level.coin_cost, 'level_activation', `Unlocked ${level.title}`, level.id);
      if (!result.success) {
        toast.error(result.error || 'Failed to unlock');
        return;
      }
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
    // Open the level content after unlock
    setViewingLevel(level);
  };

  const selectedSkillData = skills.find(s => s.id === selectedSkill);

  // Render markdown-like content simply
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-display font-bold text-foreground mt-4 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-display font-semibold text-foreground mt-4 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-display font-semibold text-foreground mt-3 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-accent pl-4 py-1 my-2 italic text-muted-foreground">{line.slice(2)}</blockquote>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4 text-foreground list-disc">{renderInlineMarkdown(line.slice(2))}</li>;
      if (line.startsWith('| ')) return <div key={i} className="text-sm text-foreground font-mono">{line}</div>;
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-foreground leading-relaxed">{renderInlineMarkdown(line)}</p>;
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Handle bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {(selectedCategory || selectedSkill || viewingLevel) && (
              <Button variant="ghost" size="icon" onClick={() => {
                if (viewingLevel) { setViewingLevel(null); }
                else if (selectedSkill) { setSelectedSkill(null); setLevels([]); }
                else setSelectedCategory(null);
              }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                <Zap className="w-8 h-8 text-accent" />
                {viewingLevel ? viewingLevel.title : selectedSkillData ? selectedSkillData.name : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Skill Tree'}
              </h1>
              <p className="text-muted-foreground">
                {viewingLevel ? `Level ${viewingLevel.level_number}` : selectedSkillData ? selectedSkillData.description || 'Master each level to progress' : 'Choose a category to start learning'}
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
        ) : viewingLevel ? (
          /* Level Content View */
          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-xl border border-border p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground">{viewingLevel.title}</h2>
                  <p className="text-sm text-muted-foreground">{viewingLevel.description}</p>
                </div>
                <Badge className="ml-auto bg-accent/20 text-accent border-accent">+{viewingLevel.xp_reward} XP</Badge>
              </div>
              
              {viewingLevel.content?.lesson_text ? (
                <div className="prose-sm space-y-1">
                  {renderContent(viewingLevel.content.lesson_text)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Content coming soon! Teachers are working on this level.</p>
                </div>
              )}
            </div>
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
                  const hasContent = !!(level.content?.lesson_text);

                  return (
                    <motion.div
                      key={level.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl border transition-all ${
                        isUnlocked
                          ? 'bg-accent/10 border-accent cursor-pointer hover:bg-accent/20'
                          : isNext
                          ? 'bg-card border-primary hover:border-accent'
                          : 'bg-muted/30 border-border opacity-60'
                      }`}
                      onClick={() => {
                        if (isUnlocked) setViewingLevel(level);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                          isUnlocked ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isUnlocked ? <CheckCircle className="w-6 h-6" /> : isLocked ? <Lock className="w-5 h-5" /> : level.level_number}
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
                          <div className="flex items-center gap-2">
                            {hasContent && <BookOpen className="w-4 h-4 text-accent" />}
                            <Badge className="bg-accent/20 text-accent border-accent">
                              <CheckCircle className="w-3 h-3 mr-1" /> Done
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-accent" />
                          </div>
                        ) : isNext ? (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUnlockLevel(level, selectedSkill!); }}>
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors truncate">{skill.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{skill.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={progressPercent} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {progress?.current_level || 0}/{skill.max_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {skill.max_level} levels</span>
                    {progress?.is_max_level && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Mastered</Badge>}
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
