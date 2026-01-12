import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

const TypingIndicator = ({ users }: TypingIndicatorProps) => {
  if (users.length === 0) return null;

  const names = users.length === 1 
    ? users[0].name 
    : users.length === 2 
      ? `${users[0].name} and ${users[1].name}` 
      : `${users[0].name} and ${users.length - 1} others`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-1 bg-muted/50 rounded-full px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{names} typing</span>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
