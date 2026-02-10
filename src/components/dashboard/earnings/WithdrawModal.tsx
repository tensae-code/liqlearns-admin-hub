import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Banknote, Smartphone, Building2 } from 'lucide-react';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { formatDistanceToNow } from 'date-fns';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

const MIN_WITHDRAWAL = 100;

const WithdrawModal = ({ open, onOpenChange, availableBalance }: WithdrawModalProps) => {
  const { requests, loading, createRequest } = useWithdrawals();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('telebirr');
  const [accountInfo, setAccountInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'new' | 'history'>('new');

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) return;
    if (numAmount > availableBalance) return;
    if (!accountInfo.trim()) return;

    setSubmitting(true);
    const result = await createRequest(numAmount, method, accountInfo.trim());
    setSubmitting(false);

    if (result.success) {
      setAmount('');
      setAccountInfo('');
      setTab('history');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">Pending</Badge>;
      case 'approved': return <Badge className="bg-success/10 text-success border-success/30 text-xs">Approved</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">Rejected</Badge>;
      case 'completed': return <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Completed</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getMethodIcon = (m: string) => {
    switch (m) {
      case 'telebirr': return <Smartphone className="w-4 h-4" />;
      case 'bank_transfer': return <Building2 className="w-4 h-4" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-success" />
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>

        <div className="flex border-b border-border mb-4">
          {(['new', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === t ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground'
              }`}
            >
              {t === 'new' ? 'New Request' : 'History'}
            </button>
          ))}
        </div>

        {tab === 'new' ? (
          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-lg font-bold text-foreground">{availableBalance.toLocaleString()} ETB</p>
            </div>

            <div className="space-y-2">
              <Label>Amount (min {MIN_WITHDRAWAL} ETB)</Label>
              <Input
                type="number"
                placeholder={`${MIN_WITHDRAWAL}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN_WITHDRAWAL}
                max={availableBalance}
              />
            </div>

            <div className="space-y-2">
              <Label>Withdrawal Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telebirr">Telebirr</SelectItem>
                  <SelectItem value="cbe">CBE (Commercial Bank of Ethiopia)</SelectItem>
                  <SelectItem value="bank_transfer">Other Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{method === 'telebirr' ? 'Phone Number' : 'Account Number'}</Label>
              <Input
                placeholder={method === 'telebirr' ? '09XXXXXXXX' : 'Account number'}
                value={accountInfo}
                onChange={(e) => setAccountInfo(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || !amount || parseFloat(amount) < MIN_WITHDRAWAL || parseFloat(amount) > availableBalance || !accountInfo.trim()}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Withdrawal Request
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Withdrawals are reviewed and processed within 24-48 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No withdrawal requests yet</div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    {getMethodIcon(req.method)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{req.amount.toLocaleString()} ETB</p>
                    <p className="text-xs text-muted-foreground capitalize">{req.method.replace('_', ' ')} • {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
                    {req.rejection_reason && (
                      <p className="text-xs text-destructive mt-0.5">{req.rejection_reason}</p>
                    )}
                  </div>
                  {getStatusBadge(req.status)}
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
