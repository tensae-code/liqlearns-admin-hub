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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Building, Smartphone, Wallet, Copy, Check, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RequestMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  pendingBalance: number;
}

interface UserSearchResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const withdrawMethods = [
  { id: 'bank', label: 'Bank', icon: Building },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
  { id: 'wallet', label: 'E-Wallet', icon: Wallet },
];

const RequestMoneyModal = ({ open, onOpenChange, availableBalance, pendingBalance }: RequestMoneyModalProps) => {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('withdraw');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestLink, setRequestLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  
  // For sending request to specific user
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast.error('Insufficient available balance');
      return;
    }

    if (withdrawAmount < 100) {
      toast.error('Minimum withdrawal is 100 ETB');
      return;
    }

    if (!accountDetails) {
      toast.error('Please enter account details');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Withdrawal request for ${amount} ETB submitted!`);
    setLoading(false);
    onOpenChange(false);
    resetForm();
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', profile?.id || '')
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateRequestLink = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    // Generate a shareable link with request details
    const requestData = {
      amount: parseFloat(amount),
      requester_id: profile?.id,
      requester_name: profile?.full_name || profile?.username,
      note: requestNote,
    };
    
    const encodedData = btoa(JSON.stringify(requestData));
    const link = `${window.location.origin}/pay?request=${encodedData}`;
    setRequestLink(link);
    
    setLoading(false);
    toast.success('Payment request link created!');
  };

  const handleSendRequestToUser = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedUser) {
      toast.error('Please select a user to request from');
      return;
    }

    setLoading(true);
    try {
      // Send notification to the selected user
      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        type: 'payment_request',
        title: 'Payment Request',
        message: `${profile?.full_name || profile?.username || 'Someone'} is requesting ${parseFloat(amount).toLocaleString()} ETB from you.${requestNote ? ` Note: ${requestNote}` : ''}`,
        data: {
          amount: parseFloat(amount),
          requester_id: profile?.id,
          requester_name: profile?.full_name || profile?.username,
          note: requestNote,
        },
      });

      toast.success(`Request sent to ${selectedUser.full_name || selectedUser.username}!`);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(requestLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setAmount('');
    setAccountDetails('');
    setSelectedMethod('bank');
    setRequestLink('');
    setRequestNote('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Download className="w-4 h-4 md:w-5 md:h-5 text-gold" />
            Request Money
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-9 md:h-10">
            <TabsTrigger value="withdraw" className="text-xs md:text-sm">Withdraw</TabsTrigger>
            <TabsTrigger value="request" className="text-xs md:text-sm">Request</TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw" className="space-y-3 md:space-y-4 pt-3 md:pt-4">
            {/* Balance Info */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-success/10 rounded-lg">
                <p className="text-[10px] md:text-xs text-muted-foreground">Available</p>
                <p className="font-bold text-success text-sm md:text-base">{availableBalance.toLocaleString()} ETB</p>
              </div>
              <div className="p-2 md:p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] md:text-xs text-muted-foreground">Pending</p>
                <p className="font-bold text-sm md:text-base">{pendingBalance.toLocaleString()} ETB</p>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="withdraw-amount" className="text-xs md:text-sm">Amount (ETB)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Min. 100 ETB"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 h-9 md:h-10"
              />
            </div>

            {/* Withdrawal Method */}
            <div>
              <Label className="text-xs md:text-sm">Withdrawal Method</Label>
              <div className="grid grid-cols-3 gap-1.5 md:gap-2 mt-2">
                {withdrawMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={cn(
                      'p-2 md:p-3 rounded-lg border text-center transition-colors',
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <method.icon className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-0.5 md:mb-1" />
                    <p className="text-[10px] md:text-xs leading-tight">{method.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details */}
            <div>
              <Label htmlFor="account">
                {selectedMethod === 'bank' ? 'Bank Account Number' : 
                 selectedMethod === 'mobile' ? 'Mobile Number' : 'Wallet Address'}
              </Label>
              <Input
                id="account"
                placeholder={
                  selectedMethod === 'bank' ? 'Enter account number' :
                  selectedMethod === 'mobile' ? 'Enter phone number' : 'Enter wallet address'
                }
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleWithdraw}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Withdrawals are processed within 1-3 business days
            </p>
          </TabsContent>

          <TabsContent value="request" className="space-y-4 pt-4">
            {/* Request from specific user */}
            <div>
              <Label className="text-xs md:text-sm">Request from User (Optional)</Label>
              {selectedUser ? (
                <div className="flex items-center gap-3 p-3 mt-1 bg-muted/50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar_url || ''} />
                    <AvatarFallback>
                      {(selectedUser.full_name || selectedUser.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedUser.full_name || selectedUser.username}</p>
                    <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or username..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="pl-10"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          className="w-full flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback>
                              {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="text-sm font-medium">{user.full_name || user.username}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                Leave empty to create a shareable link instead
              </p>
            </div>

            <div>
              <Label htmlFor="request-amount">Amount (ETB)</Label>
              <Input
                id="request-amount"
                type="number"
                placeholder="Enter amount to request"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="request-note-field">Description (Optional)</Label>
              <Input
                id="request-note-field"
                placeholder="What's this for?"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                className="mt-1"
              />
            </div>

            {requestLink && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <Label className="text-xs">Your Request Link</Label>
                <div className="flex gap-2">
                  <Input value={requestLink} readOnly className="text-xs" />
                  <Button size="icon" variant="outline" onClick={copyLink}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {selectedUser ? (
              <Button 
                className="w-full" 
                onClick={handleSendRequestToUser}
                disabled={loading || !amount}
              >
                {loading ? 'Sending...' : `Send Request to ${selectedUser.full_name || selectedUser.username}`}
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleCreateRequestLink}
                disabled={loading || !amount}
              >
                {loading ? 'Creating...' : 'Create Request Link'}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RequestMoneyModal;
