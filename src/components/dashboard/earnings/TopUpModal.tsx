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
import { CreditCard, Smartphone, Building, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethods = [
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
  { id: 'bank', label: 'Bank Transfer', icon: Building },
];

const quickAmounts = [100, 500, 1000, 2500, 5000];

const TopUpModal = ({ open, onOpenChange }: TopUpModalProps) => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const { topUp } = useWallet();

  const handleTopUp = async () => {
    const topUpAmount = parseFloat(amount);
    if (!topUpAmount || topUpAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    const result = await topUp(topUpAmount);
    
    if (result.success) {
      toast.success(`Wallet topped up with ${topUpAmount.toLocaleString()} ETB!`);
      onOpenChange(false);
      setAmount('');
    } else {
      toast.error(result.error || 'Failed to top up wallet');
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-success" />
            Top Up Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4">
          {/* Quick Amounts */}
          <div>
            <Label className="text-xs md:text-sm text-muted-foreground">Quick Select</Label>
            <div className="grid grid-cols-5 gap-1.5 md:gap-2 mt-2">
              {quickAmounts.map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(val.toString())}
                  className={cn(
                    "text-xs md:text-sm px-2 md:px-3",
                    amount === val.toString() && 'border-primary bg-primary/10'
                  )}
                >
                  {val >= 1000 ? `${val/1000}K` : val}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <Label htmlFor="amount">Amount (ETB)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-xs md:text-sm text-muted-foreground">Payment Method</Label>
            <div className="grid grid-cols-3 gap-1.5 md:gap-2 mt-2">
              {paymentMethods.map((method) => (
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

          <Button
            className="w-full" 
            onClick={handleTopUp}
            disabled={loading || !amount}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Top Up ${amount ? `${parseFloat(amount).toLocaleString()} ETB` : ''}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpModal;
