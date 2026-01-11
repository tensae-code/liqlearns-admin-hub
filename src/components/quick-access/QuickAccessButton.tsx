import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  MessageCircle, 
  Bot, 
  Users, 
  Video, 
  Hash, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BrainBankModal from '@/components/brain-bank/BrainBankModal';
import { toast } from 'sonner';

interface QuickAccessItem {
  id: string;
  icon: typeof Brain;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}

const QuickAccessButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [brainBankOpen, setBrainBankOpen] = useState(false);

  const quickAccessItems: QuickAccessItem[] = [
    {
      id: 'brain-bank',
      icon: Brain,
      label: 'Brain Bank',
      description: 'Store & review vocabulary',
      color: 'from-purple-500 to-pink-500',
      onClick: () => {
        setIsOpen(false);
        setBrainBankOpen(true);
      },
    },
    {
      id: 'ai-chat',
      icon: Bot,
      label: 'AI Assistant',
      description: 'Get help with learning',
      color: 'from-blue-500 to-cyan-400',
      onClick: () => {
        setIsOpen(false);
        toast.info('AI Assistant', { description: 'Opening AI chat...' });
      },
    },
    {
      id: 'talk-agent',
      icon: MessageCircle,
      label: 'Talk to Agent',
      description: 'Live support chat',
      color: 'from-emerald-500 to-green-400',
      onClick: () => {
        setIsOpen(false);
        toast.info('Support', { description: 'Connecting to support agent...' });
      },
    },
    {
      id: 'dm',
      icon: Users,
      label: 'Direct Message',
      description: 'Chat with friends',
      color: 'from-orange-500 to-amber-400',
      onClick: () => {
        setIsOpen(false);
        toast.info('Messages', { description: 'Opening direct messages...' });
      },
    },
    {
      id: 'group-chat',
      icon: Hash,
      label: 'Group Chat',
      description: 'Study groups & channels',
      color: 'from-indigo-500 to-purple-400',
      onClick: () => {
        setIsOpen(false);
        toast.info('Groups', { description: 'Opening group chats...' });
      },
    },
    {
      id: 'video-call',
      icon: Video,
      label: 'Video Call',
      description: 'Start or join a call',
      color: 'from-rose-500 to-pink-400',
      onClick: () => {
        setIsOpen(false);
        toast.info('Video Call', { description: 'Starting video call...' });
      },
    },
  ];

  return (
    <>
      {/* Quick Access Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-accent to-orange-500 flex items-center justify-center',
          'hover:scale-110 transition-transform'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Zap className="w-6 h-6 text-white" />
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
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Items */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-24 right-6 z-50 flex flex-col gap-2"
            >
              {quickAccessItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={item.onClick}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 pr-6 shadow-lg hover:border-accent/50 transition-colors group"
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
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Brain Bank Modal */}
      <BrainBankModal open={brainBankOpen} onOpenChange={setBrainBankOpen} />
    </>
  );
};

export default QuickAccessButton;
