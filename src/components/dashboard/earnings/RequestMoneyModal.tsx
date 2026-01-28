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
import { Download, Building, Smartphone, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RequestMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  pendingBalance: number;
}

const withdrawMethods = [
  { id: 'bank', label: 'Bank', icon: Building },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
  { id: 'wallet', label: 'E-Wallet', icon: Wallet },
];

const RequestMoneyModal = ({ open, onOpenChange, availableBalance, pendingBalance }: RequestMoneyModalProps) => {
  const [activeTab, setActiveTab] = useState('withdraw');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleRequestPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Payment request link created!');
    setLoading(false);
  };

  const resetForm = () => {
    setAmount('');
    setAccountDetails('');
    setSelectedMethod('bank');
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
            <p className="text-sm text-muted-foreground">
              Create a payment request link to send to someone
            </p>

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
              <Label htmlFor="request-note">Description (Optional)</Label>
              <Input
                id="request-note"
                placeholder="What's this for?"
                className="mt-1"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleRequestPayment}
              disabled={loading || !amount}
            >
              {loading ? 'Creating...' : 'Create Request Link'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RequestMoneyModal;
