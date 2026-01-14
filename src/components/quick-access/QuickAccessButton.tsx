import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
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
  Megaphone,
  Maximize2,
  Minimize2,
  Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAT_GRADIENTS } from '@/lib/theme';
import BrainBankModal from '@/components/brain-bank/BrainBankModal';
import DailyBonusModal from './DailyBonusModal';
import AIAssistantModal from './AIAssistantModal';
import NewDMModal, { UserSearchResult } from '@/components/messaging/NewDMModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
    color: STAT_GRADIENTS[3], // Orange
    enabled: true,
  },
  {
    id: 'brain-bank',
    icon: Brain,
    label: 'Brain Bank',
    description: 'Store & review vocabulary',
    color: STAT_GRADIENTS[1], // Purple
    enabled: true,
  },
  {
    id: 'ai-chat',
    icon: Bot,
    label: 'AI Assistant',
    description: 'Get help with learning',
    color: STAT_GRADIENTS[0], // Blue
    enabled: true,
  },
  {
    id: 'talk-agent',
    icon: MessageCircle,
    label: 'Talk to Agent',
    description: 'Live support chat',
    color: STAT_GRADIENTS[2], // Green
    enabled: true,
  },
  {
    id: 'dm',
    icon: Users,
    label: 'Direct Message',
    description: 'Chat with friends',
    color: STAT_GRADIENTS[3], // Orange
    enabled: true,
  },
  {
    id: 'group-chat',
    icon: Hash,
    label: 'Group Chat',
    description: 'Study groups & channels',
    color: STAT_GRADIENTS[1], // Purple
    enabled: true,
  },
  {
    id: 'video-call',
    icon: Video,
    label: 'Video Call',
    description: 'Start or join a call',
    color: STAT_GRADIENTS[0], // Blue
    enabled: true,
  },
  {
    id: 'add-friend',
    icon: UserPlus,
    label: 'Add Friend',
    description: 'Find and add friends',
    color: STAT_GRADIENTS[2], // Green
    enabled: false,
  },
  {
    id: 'group-call',
    icon: Phone,
    label: 'Group Call',
    description: 'Voice call with group',
    color: STAT_GRADIENTS[1], // Purple
    enabled: false,
  },
  {
    id: 'announcements',
    icon: Megaphone,
    label: 'Announcements',
    description: 'View latest updates',
    color: STAT_GRADIENTS[3], // Orange
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

type ViewMode = 'full' | 'compact' | 'icon';

interface Position {
  x: number;
  y: number;
}

const QuickAccessButton = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [brainBankOpen, setBrainBankOpen] = useState(false);
  const [dailyBonusOpen, setDailyBonusOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [dmPickerOpen, setDmPickerOpen] = useState(false);
  const [videoCallPickerOpen, setVideoCallPickerOpen] = useState(false);
  const [searchUsers, setSearchUsers] = useState<Array<{ id: string; name: string; username: string; avatar?: string; isOnline?: boolean; isFriend?: boolean }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Default to 'full' on desktop, 'compact' on mobile
    const saved = localStorage.getItem('quickAccessViewMode') as ViewMode;
    return saved || 'full';
  });
  const [items, setItems] = useState<QuickAccessItem[]>(() => {
    const saved = localStorage.getItem('quickAccessItems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ id: string; enabled: boolean }>;
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

  // Icon positions for edit mode (iPhone-like grid)
  const [iconPositions, setIconPositions] = useState<Record<string, Position>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Save viewMode to localStorage
  useEffect(() => {
    localStorage.setItem('quickAccessViewMode', viewMode);
  }, [viewMode]);

  // Save items to localStorage
  useEffect(() => {
    const toSave = items.map(item => ({ id: item.id, enabled: item.enabled }));
    localStorage.setItem('quickAccessItems', JSON.stringify(toSave));
  }, [items]);

  const enabledItems = items.filter(item => item.enabled);
  const disabledItems = items.filter(item => !item.enabled);

  const cycleViewMode = () => {
    setViewMode(prev => {
      if (prev === 'full') return 'compact';
      if (prev === 'compact') return 'icon';
      return 'full';
    });
  };

  // Search users for DM/video call picker
  const handleSearchUsers = async (query: string) => {
    setSearchLoading(true);
    try {
      const { data, error } = await import('@/integrations/supabase/client').then(m => 
        m.supabase
          .from('profiles')
          .select('id, user_id, full_name, username, avatar_url')
          .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(20)
      );
      
      if (error) throw error;
      
      setSearchUsers(data?.map(p => ({
        id: p.user_id,
        name: p.full_name,
        username: p.username,
        avatar: p.avatar_url || undefined,
        isOnline: false,
        isFriend: false,
      })) || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

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
        setAiAssistantOpen(true);
        break;
      case 'talk-agent':
        // Navigate to support/help page
        navigate('/help');
        break;
      case 'dm':
        // Open user picker for DM
        setDmPickerOpen(true);
        break;
      case 'group-chat':
        navigate('/messages');
        break;
      case 'video-call':
        // Open user picker for video call
        setVideoCallPickerOpen(true);
        break;
      case 'add-friend':
        navigate('/community');
        break;
      case 'group-call':
        navigate('/study-rooms');
        break;
      case 'announcements':
        toast.info('Announcements', { description: 'Loading announcements...' });
        break;
      default:
        toast.info('Coming Soon', { description: 'This feature is coming soon!' });
    }
  };

  const handleSelectUserForDM = (user: { id: string; name: string }) => {
    setDmPickerOpen(false);
    navigate('/messages', { state: { startDmWith: user.id } });
    toast.success(`Starting chat with ${user.name}`);
  };

  const handleSelectUserForCall = (user: { id: string; name: string }) => {
    setVideoCallPickerOpen(false);
    navigate('/messages', { state: { startCallWith: user.id, callType: 'video' } });
    toast.success(`Starting video call with ${user.name}`);
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

  // Wobble animation for edit mode (like iOS)
  const wobbleAnimation = {
    rotate: [0, -2, 2, -2, 0],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatType: "loop" as const,
    }
  };

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
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 max-h-[70vh] overflow-hidden"
            >
              {/* Header with Edit & View Mode */}
              <div className="flex items-center gap-2 justify-end">
                {/* View Mode Toggle - Glassy Style */}
                <motion.button
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={cycleViewMode}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-colors backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 hover:bg-white/20 text-foreground"
                  title={`View: ${viewMode}`}
                >
                  {viewMode === 'full' && <Maximize2 className="w-4 h-4" />}
                  {viewMode === 'compact' && <Grid3X3 className="w-4 h-4" />}
                  {viewMode === 'icon' && <Minimize2 className="w-4 h-4" />}
                  <span className="text-xs font-medium capitalize">{viewMode}</span>
                </motion.button>
                
                {/* Edit Button / Done Button - Glassy Style */}
                <motion.button
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-colors backdrop-blur-xl",
                    isEditMode 
                      ? "bg-success text-white" 
                      : "bg-white/10 dark:bg-white/5 border border-white/20 hover:bg-white/20 text-foreground"
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
              </div>

              {/* Enabled Items */}
              <div className={cn(
                "overflow-y-auto max-h-[50vh]",
                viewMode === 'icon' ? "flex flex-wrap gap-3 justify-end max-w-[220px]" : "space-y-2"
              )}>
                {isEditMode ? (
                  viewMode === 'icon' ? (
                    // iPhone-like grid edit mode for icons
                    <div className="flex flex-wrap gap-3 justify-end max-w-[220px]">
                      {enabledItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            ...wobbleAnimation
                          }}
                          className="relative"
                          drag
                          dragConstraints={containerRef}
                          dragElastic={0.1}
                          whileDrag={{ scale: 1.15, zIndex: 100 }}
                        >
                          <div
                            className={cn(
                              'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                              item.color
                            )}
                          >
                            <item.icon className="w-6 h-6 text-white" />
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={() => toggleItem(item.id)}
                            className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <p className="text-[10px] text-center text-foreground mt-1 max-w-[56px] truncate">
                            {item.label}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    // List-based reorder for full/compact views
                    <Reorder.Group axis="y" values={enabledItems} onReorder={handleReorder} className="space-y-2">
                      {enabledItems.map((item, index) => (
                        <Reorder.Item key={item.id} value={item}>
                          <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center gap-2 backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl p-3 pr-4 shadow-lg group"
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
                              {viewMode === 'full' && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </p>
                              )}
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
                  )
                ) : viewMode === 'icon' ? (
                  // Icon-only view - Glassy style
                  enabledItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleItemClick(item.id)}
                      className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg hover:scale-110 transition-transform relative',
                        item.color
                      )}
                      title={item.label}
                    >
                      <item.icon className="w-5 h-5 text-white" />
                      {item.id === 'daily-bonus' && hasUnclaimedBonus && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive animate-pulse" />
                      )}
                    </motion.button>
                  ))
                ) : viewMode === 'compact' ? (
                  // Compact view - icon + label with glassy style
                  enabledItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleItemClick(item.id)}
                      className="flex items-center gap-2 backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl px-3 py-2 shadow-lg hover:bg-white/20 transition-colors group w-full"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                        item.color
                      )}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-foreground text-sm group-hover:text-accent transition-colors">
                        {item.label}
                      </span>
                      {item.id === 'daily-bonus' && hasUnclaimedBonus && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      )}
                    </motion.button>
                  ))
                ) : (
                  // Full view - Glassy style
                  enabledItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleItemClick(item.id)}
                      className="flex items-center gap-3 backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl p-3 pr-6 shadow-lg hover:bg-white/20 transition-colors group w-full"
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

              {/* Disabled Items (Only in Edit Mode) - Glassy Style */}
              {isEditMode && disabledItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-white/10 pt-3 mt-2"
                >
                  <p className="text-xs text-muted-foreground px-2 mb-2 flex items-center gap-2">
                    <Plus className="w-3 h-3" /> Available to add
                  </p>
                  <div className={cn(
                    viewMode === 'icon' ? "flex flex-wrap gap-3 justify-end max-w-[220px]" : "space-y-2"
                  )}>
                    {viewMode === 'icon' ? (
                      // Icon grid for disabled items
                      disabledItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.03 }}
                          className="relative"
                        >
                          <button
                            onClick={() => toggleItem(item.id)}
                            className={cn(
                              'w-14 h-14 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg opacity-60 hover:opacity-100 hover:border-success/50 transition-all'
                            )}
                          >
                            <item.icon className={cn('w-6 h-6', item.color.includes('gold') ? 'text-gold' : 'text-foreground/60')} />
                          </button>
                          {/* Add button */}
                          <button
                            onClick={() => toggleItem(item.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-success text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <p className="text-[10px] text-center text-muted-foreground mt-1 max-w-[56px] truncate">
                            {item.label}
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      // List view for disabled items
                      disabledItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.03 }}
                          className="flex items-center gap-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 pr-4 shadow-sm opacity-60 hover:opacity-100 hover:border-success/30 transition-all"
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
                            {viewMode === 'full' && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Add Button */}
                          <button
                            onClick={() => toggleItem(item.id)}
                            className="w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))
                    )}
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

      {/* AI Assistant Modal */}
      <AIAssistantModal open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} />

      {/* DM User Picker Modal */}
      <NewDMModal
        open={dmPickerOpen}
        onOpenChange={setDmPickerOpen}
        users={searchUsers}
        onSelectUser={handleSelectUserForDM}
        onSearch={handleSearchUsers}
        isLoading={searchLoading}
      />

      {/* Video Call User Picker Modal */}
      <NewDMModal
        open={videoCallPickerOpen}
        onOpenChange={setVideoCallPickerOpen}
        users={searchUsers}
        onSelectUser={handleSelectUserForCall}
        onSearch={handleSearchUsers}
        isLoading={searchLoading}
      />
    </>
  );
};

export default QuickAccessButton;
