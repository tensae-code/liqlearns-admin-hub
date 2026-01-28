import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

interface UserResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

const SendMoneyModal = ({ open, onOpenChange, availableBalance }: SendMoneyModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async () => {
    if (!selectedUser) {
      toast.error('Please select a recipient');
      return;
    }
    
    const sendAmount = parseFloat(amount);
    if (!sendAmount || sendAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (sendAmount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`${amount} ETB sent to ${selectedUser.full_name}!`);
    setLoading(false);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setAmount('');
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-accent" />
            Send Money
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Search */}
          {!selectedUser ? (
            <div>
              <Label>Search Recipient</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Username or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? '...' : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg divide-y">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-10 w-10">
                {selectedUser.avatar_url && <AvatarImage src={selectedUser.avatar_url} />}
                <AvatarFallback>{selectedUser.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.full_name}</p>
                <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                Change
              </Button>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label htmlFor="send-amount">Amount (ETB)</Label>
            <Input
              id="send-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available: {availableBalance.toLocaleString()} ETB
            </p>
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              placeholder="What's this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button 
            className="w-full" 
            onClick={handleSend}
            disabled={loading || !selectedUser || !amount}
          >
            {loading ? 'Sending...' : `Send ${amount ? `${amount} ETB` : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendMoneyModal;
