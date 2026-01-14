import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Sword,
  Shield,
  Flame,
  Crown,
  Star,
  Zap,
  Target,
  Rocket,
  Gem,
  Trophy,
  Heart,
  Skull,
  Moon,
  Sun,
  Anchor,
  Mountain,
  Users,
  Award,
} from 'lucide-react';

interface ClanPopupProps {
  isOpen: boolean;
  onClose: () => void;
  clanName?: string;
  userRole?: string;
}

// Clan logo icons (background-less)
const clanIcons = [
  { icon: Sword, name: 'Sword' },
  { icon: Shield, name: 'Shield' },
  { icon: Flame, name: 'Flame' },
  { icon: Crown, name: 'Crown' },
  { icon: Star, name: 'Star' },
  { icon: Zap, name: 'Lightning' },
  { icon: Target, name: 'Target' },
  { icon: Rocket, name: 'Rocket' },
  { icon: Gem, name: 'Gem' },
  { icon: Trophy, name: 'Trophy' },
  { icon: Heart, name: 'Heart' },
  { icon: Skull, name: 'Skull' },
  { icon: Moon, name: 'Moon' },
  { icon: Sun, name: 'Sun' },
  { icon: Anchor, name: 'Anchor' },
  { icon: Mountain, name: 'Mountain' },
];

const ClanPopup = ({ isOpen, onClose, clanName = 'Eliteforce', userRole = 'Leader' }: ClanPopupProps) => {
  const navigate = useNavigate();
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [showIconPicker, setShowIconPicker] = useState(false);

  if (!isOpen) return null;

  const SelectedIconComponent = clanIcons[selectedIcon].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed z-[100] w-[90%] max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        style={{ top: '15%', left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold">Your Clan</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Clan Logo & Info */}
          <div className="text-center">
            <div 
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-2 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowIconPicker(!showIconPicker)}
            >
              <SelectedIconComponent className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold text-foreground">{clanName}</h4>
            <p className="text-sm text-muted-foreground">You are the {userRole}</p>
          </div>

          {/* Icon Picker */}
          {showIconPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-xl bg-muted/50 border border-border"
            >
              <p className="text-xs text-muted-foreground mb-2 text-center">Choose clan logo</p>
              <div className="grid grid-cols-8 gap-2">
                {clanIcons.map((iconItem, index) => (
                  <button
                    key={iconItem.name}
                    onClick={() => {
                      setSelectedIcon(index);
                      setShowIconPicker(false);
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      selectedIcon === index 
                        ? 'bg-violet-500 text-white' 
                        : 'bg-card hover:bg-muted text-foreground'
                    }`}
                  >
                    <iconItem.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <Users className="w-4 h-4 mx-auto text-violet-500 mb-1" />
              <p className="text-lg font-bold text-foreground">24</p>
              <p className="text-[10px] text-muted-foreground">Members</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <Award className="w-4 h-4 mx-auto text-gold mb-1" />
              <p className="text-lg font-bold text-foreground">15.2K</p>
              <p className="text-[10px] text-muted-foreground">Team XP</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <Trophy className="w-4 h-4 mx-auto text-accent mb-1" />
              <p className="text-lg font-bold text-foreground">#5</p>
              <p className="text-[10px] text-muted-foreground">Rank</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white"
              onClick={() => {
                onClose();
                navigate('/profile');
              }}
            >
              Manage Clan in Profile
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Join or create clans in your profile
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClanPopup;
