import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  MessageCircle, 
  Bot, 
  Users, 
  Video, 
  Hash, 
  X,
  Pencil,
  Check,
  Minus,
  GripVertical,
  Plus,
  Gift,
  UserPlus,
  Phone,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BrainBankModal from '@/components/brain-bank/BrainBankModal';
import DailyBonusModal from './DailyBonusModal';
import { toast } from 'sonner';

interface QuickAccessItem {
  id: string;
  icon: typeof Brain;
  label: string;
  description: string;
  color: string;
  enabled: boolean;
}

const defaultQuickAccessItems: QuickAccessItem[] = [
  {
    id: 'daily-bonus',
    icon: Gift,
    label: 'Daily Bonus',
    description: 'Spin for rewards',
    color: 'from-gold to-amber-500',
    enabled: true,
  },
  {
    id: 'brain-bank',
    icon: Brain,
    label: 'Brain Bank',
    description: 'Store & review vocabulary',
    color: 'from-purple-500 to-pink-500',
    enabled: true,
  },
  {
    id: 'ai-chat',
    icon: Bot,
    label: 'AI Assistant',
    description: 'Get help with learning',
    color: 'from-blue-500 to-cyan-400',
    enabled: true,
  },
  {
    id: 'talk-agent',
    icon: MessageCircle,
    label: 'Talk to Agent',
    description: 'Live support chat',
    color: 'from-emerald-500 to-green-400',
    enabled: true,
  },
  {
    id: 'dm',
    icon: Users,
    label: 'Direct Message',
    description: 'Chat with friends',
    color: 'from-orange-500 to-amber-400',
    enabled: true,
  },
  {
    id: 'group-chat',
    icon: Hash,
    label: 'Group Chat',
    description: 'Study groups & channels',
    color: 'from-indigo-500 to-purple-400',
    enabled: true,
  },
  {
    id: 'video-call',
    icon: Video,
    label: 'Video Call',
    description: 'Start or join a call',
    color: 'from-rose-500 to-pink-400',
    enabled: true,
  },
  {
    id: 'add-friend',
    icon: UserPlus,
    label: 'Add Friend',
    description: 'Find and add friends',
    color: 'from-teal-500 to-emerald-400',
    enabled: false,
  },
  {
    id: 'group-call',
    icon: Phone,
    label: 'Group Call',
    description: 'Voice call with group',
    color: 'from-violet-500 to-purple-400',
    enabled: false,
  },
  {
    id: 'announcements',
    icon: Megaphone,
    label: 'Announcements',
    description: 'View latest updates',
    color: 'from-yellow-500 to-orange-400',
    enabled: false,
  },
];

// Helper to get icon map for restoring from localStorage
const iconMap: Record<string, typeof Brain> = {
  'daily-bonus': Gift,
  'brain-bank': Brain,
  'ai-chat': Bot,
  'talk-agent': MessageCircle,
  'dm': Users,
  'group-chat': Hash,
  'video-call': Video,
  'add-friend': UserPlus,
  'group-call': Phone,
  'announcements': Megaphone,
};

const QuickAccessButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [brainBankOpen, setBrainBankOpen] = useState(false);
  const [dailyBonusOpen, setDailyBonusOpen] = useState(false);
  const [items, setItems] = useState<QuickAccessItem[]>(() => {
    const saved = localStorage.getItem('quickAccessItems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ id: string; enabled: boolean }>;
        // Reconstruct items from defaults using saved order and enabled state
        return parsed.map(savedItem => {
          const defaultItem = defaultQuickAccessItems.find(d => d.id === savedItem.id);
          if (defaultItem) {
            return { ...defaultItem, enabled: savedItem.enabled };
          }
          return null;
        }).filter(Boolean) as QuickAccessItem[];
      } catch {
        return defaultQuickAccessItems;
      }
    }
    return defaultQuickAccessItems;
  });

  // Save to localStorage when items change - only save id and enabled state
  useEffect(() => {
    const toSave = items.map(item => ({ id: item.id, enabled: item.enabled }));
    localStorage.setItem('quickAccessItems', JSON.stringify(toSave));
  }, [items]);

  const enabledItems = items.filter(item => item.enabled);
  const disabledItems = items.filter(item => !item.enabled);

  const handleItemClick = (id: string) => {
    if (isEditMode) return;
    
    setIsOpen(false);
    
    switch (id) {
      case 'brain-bank':
        setBrainBankOpen(true);
        break;
      case 'daily-bonus':
        setDailyBonusOpen(true);
        break;
      case 'ai-chat':
        toast.info('AI Assistant', { description: 'Opening AI chat...' });
        break;
      case 'talk-agent':
        toast.info('Support', { description: 'Connecting to support agent...' });
        break;
      case 'dm':
        toast.info('Messages', { description: 'Opening direct messages...' });
        break;
      case 'group-chat':
        toast.info('Groups', { description: 'Opening group chats...' });
        break;
      case 'video-call':
        toast.info('Video Call', { description: 'Starting video call...' });
        break;
      case 'add-friend':
        toast.info('Add Friend', { description: 'Opening friend search...' });
        break;
      case 'group-call':
        toast.info('Group Call', { description: 'Starting group voice call...' });
        break;
      case 'announcements':
        toast.info('Announcements', { description: 'Loading announcements...' });
        break;
      default:
        toast.info('Coming Soon', { description: 'This feature is coming soon!' });
    }
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const handleReorder = (newOrder: QuickAccessItem[]) => {
    // Merge reordered enabled items with disabled items
    const disabledOnes = items.filter(item => !item.enabled);
    setItems([...newOrder, ...disabledOnes]);
  };

  const hasUnclaimedBonus = !localStorage.getItem('dailyBonusClaimed');

  return (
    <>
      {/* Quick Access Button with Glow and Bounce */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-accent to-orange-500 flex items-center justify-center',
          'hover:scale-110 transition-transform'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          rotate: isOpen ? 45 : 0,
          y: [0, -5, 0],
          boxShadow: [
            '0 0 20px rgba(249, 115, 22, 0.4)',
            '0 0 40px rgba(249, 115, 22, 0.6)',
            '0 0 20px rgba(249, 115, 22, 0.4)'
          ]
        }}
        transition={{ 
          rotate: { duration: 0.2 },
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Zap className="w-6 h-6 text-white" />
        )}
        {/* Notification dot for unclaimed bonus */}
        {hasUnclaimedBonus && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
            !
          </span>
        )}
      </motion.button>

      {/* Quick Access Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => {
                if (!isEditMode) setIsOpen(false);
              }}
            />

            {/* Menu Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 max-h-[70vh] overflow-hidden"
            >
              {/* Edit Button / Done Button */}
              <motion.button
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                onClick={() => setIsEditMode(!isEditMode)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-colors self-end",
                  isEditMode 
                    ? "bg-success text-white" 
                    : "bg-card border border-border hover:border-accent/50"
                )}
              >
                {isEditMode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Done</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit</span>
                  </>
                )}
              </motion.button>

              {/* Enabled Items */}
              <div className="overflow-y-auto max-h-[50vh] space-y-2">
                {isEditMode ? (
                  <Reorder.Group axis="y" values={enabledItems} onReorder={handleReorder} className="space-y-2">
                    {enabledItems.map((item, index) => (
                      <Reorder.Item key={item.id} value={item}>
                        <motion.div
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 50 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center gap-2 bg-card border border-border rounded-xl p-3 pr-4 shadow-lg group"
                        >
                          {/* Drag Handle */}
                          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          {/* Icon */}
                          <div className={cn(
                            'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                            item.color
                          )}>
                            <item.icon className="w-5 h-5 text-white" />
                          </div>
                          
                          {/* Content */}
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {item.label}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => toggleItem(item.id)}
                            className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </motion.div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  enabledItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleItemClick(item.id)}
                      className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 pr-6 shadow-lg hover:border-accent/50 transition-colors group w-full"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                        item.color
                      )}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground text-sm group-hover:text-accent transition-colors">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      {item.id === 'daily-bonus' && hasUnclaimedBonus && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      )}
                    </motion.button>
                  ))
                )}
              </div>

              {/* Disabled Items (Only in Edit Mode) */}
              {isEditMode && disabledItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-border pt-2 mt-2"
                >
                  <p className="text-xs text-muted-foreground px-2 mb-2">Available to add:</p>
                  <div className="space-y-2">
                    {disabledItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.03 }}
                        className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-3 pr-4 shadow-sm opacity-60"
                      >
                        {/* Icon */}
                        <div className={cn(
                          'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                          item.color
                        )}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                        
                        {/* Add Button */}
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Brain Bank Modal */}
      <BrainBankModal open={brainBankOpen} onOpenChange={setBrainBankOpen} />
      
      {/* Daily Bonus Modal */}
      <DailyBonusModal open={dailyBonusOpen} onOpenChange={setDailyBonusOpen} />
    </>
  );
};

export default QuickAccessButton;
