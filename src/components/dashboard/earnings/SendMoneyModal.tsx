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
import { Send, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';

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
  const { sendMoney, balance } = useWallet();

  // Use actual wallet balance if available, otherwise use prop
  const actualBalance = balance > 0 ? balance : availableBalance;

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
      toast.error('Failed to search users');
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

    if (sendAmount > actualBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    
    const result = await sendMoney(
      selectedUser.id,
      selectedUser.full_name,
      sendAmount,
      note || undefined
    );

    if (result.success) {
      toast.success(`${sendAmount.toLocaleString()} ETB sent to ${selectedUser.full_name}!`);
      onOpenChange(false);
      resetForm();
    } else {
      toast.error(result.error || 'Failed to send money');
    }
    
    setLoading(false);
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
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Send className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            Send Money
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4">
          {/* Recipient Search */}
          {!selectedUser ? (
            <div>
              <Label className="text-xs md:text-sm">Search Recipient</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                  <Input
                    placeholder="Username or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-8 md:pl-10 h-9 md:h-10 text-sm"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching} size="sm" className="h-9 md:h-10 px-3">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg divide-y max-h-[150px] overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-7 w-7 md:h-8 md:w-8">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback className="text-xs">{user.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-left min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">{user.full_name}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-8 w-8 md:h-10 md:w-10">
                {selectedUser.avatar_url && <AvatarImage src={selectedUser.avatar_url} />}
                <AvatarFallback className="text-xs md:text-sm">{selectedUser.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm md:text-base truncate">{selectedUser.full_name}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">@{selectedUser.username}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="text-xs h-8 px-2">
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
              Available: {actualBalance.toLocaleString()} ETB
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
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              `Send ${amount ? `${parseFloat(amount).toLocaleString()} ETB` : ''}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendMoneyModal;
