import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import BrainBankModal from './BrainBankModal';

const BrainBankButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-floating',
          'bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center',
          'hover:scale-110 transition-transform'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Brain className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center text-xs font-bold text-gold-foreground">
          🧠
        </span>
      </motion.button>

      <BrainBankModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default BrainBankButton;
