import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
  isFriend?: boolean;
}

interface NewDMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserSearchResult[];
  onSelectUser: (user: UserSearchResult) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

const NewDMModal = ({ 
  open, 
  onOpenChange, 
  users, 
  onSelectUser,
  onSearch,
  isLoading 
}: NewDMModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (onSearch) {
      const debounce = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, onSearch]);

  const handleSelect = (user: UserSearchResult) => {
    setSelectedUser(user.id);
    onSelectUser(user);
    onOpenChange(false);
    setSearchQuery('');
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate friends from other users
  const friends = filteredUsers.filter(u => u.isFriend);
  const others = filteredUsers.filter(u => !u.isFriend);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* User List */}
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <UserPlus className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Friends Section */}
                {friends.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      Friends
                    </p>
                    <div className="space-y-1">
                      {friends.map((user, i) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                            selectedUser === user.id 
                              ? "bg-accent/20 border border-accent" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => handleSelect(user)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                          {selectedUser === user.id && (
                            <Check className="w-5 h-5 text-accent" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Others Section */}
                {others.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      {friends.length > 0 ? 'Other Users' : 'Users'}
                    </p>
                    <div className="space-y-1">
                      {others.map((user, i) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (friends.length + i) * 0.03 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                            selectedUser === user.id 
                              ? "bg-accent/20 border border-accent" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => handleSelect(user)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                          {selectedUser === user.id && (
                            <Check className="w-5 h-5 text-accent" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewDMModal;
