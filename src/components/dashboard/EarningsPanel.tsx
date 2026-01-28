import { useState, useMemo } from 'react';
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
  Plus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import TopUpModal from './earnings/TopUpModal';
import SendMoneyModal from './earnings/SendMoneyModal';
import ScanQRModal from './earnings/ScanQRModal';
import RequestMoneyModal from './earnings/RequestMoneyModal';
import { useWallet } from '@/hooks/useWallet';
import { useProfile } from '@/hooks/useProfile';
import { formatDistanceToNow } from 'date-fns';

interface EarningsPanelProps {
  totalEarnings?: number;
  pendingEarnings?: number;
  availableBalance?: number;
}

const EarningsPanel = ({ 
  totalEarnings: propTotalEarnings = 37234.56, 
  pendingEarnings: propPendingEarnings = 1200,
  availableBalance: propAvailableBalance = 36034.56
}: EarningsPanelProps) => {
  const { wallet, transactions: walletTransactions, loading } = useWallet();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  // Use wallet data if available, otherwise use props
  const totalEarnings = wallet?.total_earned || propTotalEarnings;
  const pendingEarnings = wallet?.pending_balance || propPendingEarnings;
  const availableBalance = wallet?.balance || propAvailableBalance;

  // Transform wallet transactions for display
  const displayTransactions = useMemo(() => {
    if (!walletTransactions || walletTransactions.length === 0) {
      return [];
    }
    
    return walletTransactions.slice(0, 5).map((tx) => {
      const isOutgoing = tx.sender_id === profile?.id;
      return {
        id: tx.id,
        type: isOutgoing ? 'out' as const : 'in' as const,
        description: isOutgoing ? 'Money Sent' : 'Money Received',
        amount: tx.amount,
        source: tx.transaction_type === 'transfer' ? 'Transfer' : tx.transaction_type,
        date: formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }),
        prevBalance: isOutgoing ? tx.sender_prev_balance || 0 : tx.receiver_prev_balance || 0,
        newBalance: isOutgoing ? tx.sender_new_balance || 0 : tx.receiver_new_balance || 0,
      };
    });
  }, [walletTransactions, profile?.id]);

  return (
    <motion.div
      className="bg-card rounded-xl border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header with Wallet Card */}
      <div className="p-4 md:p-5 bg-gradient-hero rounded-t-xl text-white">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            <span className="font-medium text-sm md:text-base">Total Earnings</span>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 text-[10px] md:text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            +12.5%
          </Badge>
        </div>
        
        <p className="text-2xl md:text-3xl font-display font-bold mb-1">
          {totalEarnings.toLocaleString()} <span className="text-lg md:text-xl">ETB</span>
        </p>
        <p className="text-xs md:text-sm text-white/70">Lifetime earnings</p>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mt-3 md:mt-4">
          <div className="p-2 md:p-3 rounded-lg bg-white/10">
            <p className="text-[10px] md:text-xs text-white/70 mb-0.5 md:mb-1">Available</p>
            <p className="text-sm md:text-lg font-bold">{availableBalance.toLocaleString()}</p>
          </div>
          <div className="p-2 md:p-3 rounded-lg bg-white/10">
            <p className="text-[10px] md:text-xs text-white/70 mb-0.5 md:mb-1">Pending</p>
            <p className="text-sm md:text-lg font-bold">{pendingEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-1 md:gap-2 p-3 md:p-4 border-b border-border">
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-0.5 md:gap-1 h-auto py-2 md:py-3 px-1"
          onClick={() => setTopUpOpen(true)}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center text-success">
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">Top Up</span>
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-0.5 md:gap-1 h-auto py-2 md:py-3 px-1"
          onClick={() => setSendOpen(true)}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center text-accent">
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">Send</span>
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-0.5 md:gap-1 h-auto py-2 md:py-3 px-1"
          onClick={() => setScanOpen(true)}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center text-primary">
            <QrCode className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">Scan</span>
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-0.5 md:gap-1 h-auto py-2 md:py-3 px-1"
          onClick={() => setRequestOpen(true)}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center text-gold">
            <Download className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">Request</span>
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No transactions yet</p>
                <p className="text-xs mt-1">Send or receive money to see transactions here</p>
              </div>
            ) : (
              displayTransactions.map((tx) => (
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
                      {tx.type === 'in' ? '+' : '-'}{tx.amount.toLocaleString()} ETB
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tx.prevBalance.toLocaleString()} → {tx.newBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {displayTransactions.length > 0 && (
              <Button variant="ghost" className="w-full" size="sm">
                View All Transactions <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EarningsPanel;
