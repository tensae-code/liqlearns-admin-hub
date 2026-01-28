import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Send, 
  QrCode, 
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import TopUpModal from './earnings/TopUpModal';
import SendMoneyModal from './earnings/SendMoneyModal';
import ScanQRModal from './earnings/ScanQRModal';
import RequestMoneyModal from './earnings/RequestMoneyModal';

interface Transaction {
  id: string;
  type: 'in' | 'out';
  description: string;
  amount: number;
  source: string;
  date: string;
  prevBalance: number;
  newBalance: number;
}

const transactions: Transaction[] = [
  { id: '1', type: 'in', description: 'Referral Commission', amount: 500, source: 'Network', date: 'Today', prevBalance: 36734, newBalance: 37234 },
  { id: '2', type: 'out', description: 'Withdrawal', amount: 1000, source: 'Bank Account', date: 'Yesterday', prevBalance: 37734, newBalance: 36734 },
  { id: '3', type: 'in', description: 'Course Sale', amount: 350, source: 'Marketplace', date: 'Jan 7', prevBalance: 37384, newBalance: 37734 },
  { id: '4', type: 'in', description: 'Level Bonus', amount: 200, source: 'Achievement', date: 'Jan 6', prevBalance: 37184, newBalance: 37384 },
  { id: '5', type: 'out', description: 'Send to User', amount: 100, source: 'PayPal', date: 'Jan 5', prevBalance: 37284, newBalance: 37184 },
];

interface EarningsPanelProps {
  totalEarnings?: number;
  pendingEarnings?: number;
  availableBalance?: number;
}

const EarningsPanel = ({ 
  totalEarnings = 37234.56, 
  pendingEarnings = 1200,
  availableBalance = 36034.56
}: EarningsPanelProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <motion.div
      className="bg-card rounded-xl border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header with Wallet Card */}
      <div className="p-5 bg-gradient-hero rounded-t-xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Total Earnings</span>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            <TrendingUp className="w-3 h-3 mr-1" />
            +12.5%
          </Badge>
        </div>
        
        <p className="text-3xl font-display font-bold mb-1">
          {totalEarnings.toLocaleString()} ETB
        </p>
        <p className="text-sm text-white/70">Lifetime earnings</p>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-white/10">
            <p className="text-xs text-white/70 mb-1">Available</p>
            <p className="text-lg font-bold">{availableBalance.toLocaleString()} ETB</p>
          </div>
          <div className="p-3 rounded-lg bg-white/10">
            <p className="text-xs text-white/70 mb-1">Pending</p>
            <p className="text-lg font-bold">{pendingEarnings.toLocaleString()} ETB</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 p-4 border-b border-border">
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setTopUpOpen(true)}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-success">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground">Top Up</span>
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setSendOpen(true)}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-accent">
            <Send className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground">Send</span>
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setScanOpen(true)}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground">Scan</span>
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setRequestOpen(true)}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-gold">
            <Download className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground">Request</span>
        </Button>
      </div>

      {/* Modals */}
      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
      <SendMoneyModal open={sendOpen} onOpenChange={setSendOpen} availableBalance={availableBalance} />
      <ScanQRModal open={scanOpen} onOpenChange={setScanOpen} />
      <RequestMoneyModal 
        open={requestOpen} 
        onOpenChange={setRequestOpen} 
        availableBalance={availableBalance}
        pendingBalance={pendingEarnings}
      />

      {/* Tabs */}
      <div className="flex border-b border-border">
        {['overview', 'transactions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'overview' | 'transactions')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === tab 
                ? 'text-accent border-b-2 border-accent' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Earnings This Month</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-muted-foreground mb-1">Referrals</p>
                <p className="text-lg font-bold text-success">2,500 ETB</p>
              </div>
              <div className="p-3 rounded-lg bg-gold/10 border border-gold/20">
                <p className="text-xs text-muted-foreground mb-1">Sales</p>
                <p className="text-lg font-bold text-gold">1,800 ETB</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  tx.type === 'in' ? 'bg-success/10' : 'bg-destructive/10'
                )}>
                  {tx.type === 'in' ? (
                    <ArrowDownLeft className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.source} • {tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-bold',
                    tx.type === 'in' ? 'text-success' : 'text-destructive'
                  )}>
                    {tx.type === 'in' ? '+' : '-'}{tx.amount} ETB
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {tx.prevBalance} → {tx.newBalance}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full" size="sm">
              View All Transactions <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EarningsPanel;
