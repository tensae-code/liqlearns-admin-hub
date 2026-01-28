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
import { CreditCard, Smartphone, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

  const handleTopUp = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Top up of ${amount} ETB initiated successfully!`);
    setLoading(false);
    onOpenChange(false);
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-success" />
            Top Up Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Amounts */}
          <div>
            <Label className="text-sm text-muted-foreground">Quick Select</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {quickAmounts.map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(val.toString())}
                  className={cn(
                    amount === val.toString() && 'border-primary bg-primary/10'
                  )}
                >
                  {val} ETB
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
            <Label className="text-sm text-muted-foreground">Payment Method</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-colors',
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <method.icon className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs">{method.label}</p>
                </button>
              ))}
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={handleTopUp}
            disabled={loading || !amount}
          >
            {loading ? 'Processing...' : `Top Up ${amount ? `${amount} ETB` : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpModal;
