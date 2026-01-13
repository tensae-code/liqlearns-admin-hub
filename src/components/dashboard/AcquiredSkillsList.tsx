import { motion } from 'framer-motion';
import { Award, Star, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AcquiredSkill {
  id: string;
  name: string;
  icon: string;
  level: number;
  maxLevel: number;
  color: string;
  earnedAt: string;
}

const mockSkills: AcquiredSkill[] = [
  { id: '1', name: 'Amharic Reading', icon: '📖', level: 3, maxLevel: 5, color: 'from-accent to-orange-500', earnedAt: '2 days ago' },
  { id: '2', name: 'Vocabulary Master', icon: '📝', level: 2, maxLevel: 5, color: 'from-gold to-amber-500', earnedAt: '1 week ago' },
  { id: '3', name: 'Pronunciation', icon: '🎤', level: 4, maxLevel: 5, color: 'from-success to-emerald-500', earnedAt: '3 days ago' },
  { id: '4', name: 'Grammar Expert', icon: '✍️', level: 1, maxLevel: 5, color: 'from-streak to-orange-600', earnedAt: '5 days ago' },
  { id: '5', name: 'Cultural Knowledge', icon: '🏛️', level: 2, maxLevel: 5, color: 'from-purple-500 to-pink-500', earnedAt: '1 day ago' },
  { id: '6', name: 'Listening Skills', icon: '👂', level: 3, maxLevel: 5, color: 'from-blue-500 to-cyan-500', earnedAt: '4 days ago' },
];

interface AcquiredSkillsListProps {
  skills?: AcquiredSkill[];
  onViewAll?: () => void;
}

const AcquiredSkillsList = ({ skills = mockSkills, onViewAll }: AcquiredSkillsListProps) => {
  const getLevelStars = (level: number, maxLevel: number) => {
    return Array.from({ length: maxLevel }, (_, i) => (
      <Star 
        key={i} 
        className={cn(
          'w-3 h-3',
          i < level ? 'text-gold fill-gold' : 'text-muted-foreground/30'
        )} 
      />
    ));
  };

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">Acquired Skills</h2>
            <p className="text-xs text-muted-foreground">{skills.length} skills earned</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {skills.map((skill, i) => (
          <motion.div
            key={skill.id}
            className="relative group cursor-pointer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="bg-muted/30 rounded-xl p-3 border border-border hover:border-accent/30 transition-all">
              {/* Badge Icon */}
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg',
                  skill.color
                )}>
                  {skill.icon}
                </div>
                {/* Level Badge */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gold/10 border border-gold/20">
                  <Sparkles className="w-3 h-3 text-gold" />
                  <span className="text-xs font-bold text-gold">Lv.{skill.level}</span>
                </div>
              </div>

              {/* Skill Name */}
              <p className="font-medium text-foreground text-sm mb-1 truncate">{skill.name}</p>

              {/* Level Stars */}
              <div className="flex items-center gap-0.5">
                {getLevelStars(skill.level, skill.maxLevel)}
              </div>

              {/* Earned Date */}
              <p className="text-[10px] text-muted-foreground mt-1">
                Earned {skill.earnedAt}
              </p>
            </div>

            {/* Hover Glow Effect */}
            <div className={cn(
              'absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none',
              skill.color
            )} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AcquiredSkillsList;
