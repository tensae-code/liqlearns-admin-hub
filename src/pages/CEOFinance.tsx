import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Users,
  BookOpen,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_info: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  user?: { full_name: string; username: string; avatar_url: string | null };
}

interface Transaction {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  amount: number;
  note: string | null;
  transaction_type: string;
  status: string;
  created_at: string;
}

interface CoursePurchase {
  id: string;
  amount: number;
  instructor_share: number;
  platform_share: number;
  l1_commission: number;
  l2_commission: number;
  created_at: string;
}

const CEOFinance = () => {
  const { profile } = useProfile();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<CoursePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Computed stats
  const totalPlatformRevenue = purchases.reduce((sum, p) => sum + p.platform_share, 0);
  const totalInstructorPayouts = purchases.reduce((sum, p) => sum + p.instructor_share, 0);
  const totalCommissions = purchases.reduce((sum, p) => sum + p.l1_commission + p.l2_commission, 0);
  const totalCourseSales = purchases.reduce((sum, p) => sum + p.amount, 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [withdrawalsRes, txRes, purchasesRes] = await Promise.all([
        supabase
          .from('withdrawal_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('course_purchases')
          .select('id, amount, instructor_share, platform_share, l1_commission, l2_commission, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (withdrawalsRes.data) {
        // Fetch user profiles for withdrawals
        const userIds = [...new Set(withdrawalsRes.data.map((w: any) => w.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setWithdrawals(
          withdrawalsRes.data.map((w: any) => ({
            ...w,
            user: profileMap.get(w.user_id),
          }))
        );
      }

      if (txRes.data) setTransactions(txRes.data as Transaction[]);
      if (purchasesRes.data) setPurchases(purchasesRes.data as CoursePurchase[]);
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!profile?.id) return;
    setProcessing(requestId);
    try {
      const { data, error } = await supabase.rpc('process_withdrawal', {
        p_request_id: requestId,
        p_action: 'approve',
        p_reviewer_id: profile.id,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error);
      toast.success('Withdrawal approved');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!profile?.id) return;
    setProcessing(requestId);
    try {
      const { data, error } = await supabase.rpc('process_withdrawal', {
        p_request_id: requestId,
        p_action: 'reject',
        p_reviewer_id: profile.id,
        p_rejection_reason: rejectionReason || 'Rejected by CEO',
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error);
      toast.success('Withdrawal rejected');
      setRejectingId(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-7 h-7 text-primary" />
              Finance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track revenue, expenses, and financial performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              This Month
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics - Now DB-driven from course_purchases */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Course Sales</p>
                  <p className="text-2xl font-bold text-success">
                    {loading ? '...' : `$${totalCourseSales.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{purchases.length} purchases</p>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Platform Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : `$${totalPlatformRevenue.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">After payouts</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Instructor Payouts</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : `$${totalInstructorPayouts.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">70% share</p>
                </div>
                <div className="p-3 rounded-full bg-accent/10">
                  <PiggyBank className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commissions Paid</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : `$${totalCommissions.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">L1 + L2 referral</p>
                </div>
                <div className="p-3 rounded-full bg-gold/10">
                  <Users className="w-6 h-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="withdrawals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="withdrawals" className="relative">
              Withdrawals
              {pendingWithdrawals.length > 0 && (
                <Badge className="ml-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">
                  {pendingWithdrawals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="purchases">Course Purchases</TabsTrigger>
          </TabsList>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Approve or reject user withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No withdrawal requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map(w => (
                      <div key={w.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0">
                            {w.user?.avatar_url && <AvatarImage src={w.user.avatar_url} />}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {w.user?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">{w.user?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              {w.method} • {w.account_info || 'No account info'} • {formatDate(w.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-foreground">${w.amount}</p>

                          {w.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              {rejectingId === w.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Reason..."
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    className="h-8 w-[150px] text-xs"
                                  />
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={processing === w.id}
                                    onClick={() => handleReject(w.id)}
                                    className="h-8"
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                                    className="h-8"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={processing === w.id}
                                    onClick={() => handleApprove(w.id)}
                                    className="h-8"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={processing === w.id}
                                    onClick={() => setRejectingId(w.id)}
                                    className="h-8 text-destructive hover:text-destructive"
                                  >
                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant={w.status === 'approved' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {w.status === 'approved' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Approved</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Rejected</>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>All platform financial activities</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            tx.transaction_type === 'purchase' ? 'bg-success/10' :
                            tx.transaction_type === 'transfer' ? 'bg-primary/10' :
                            'bg-muted'
                          }`}>
                            {tx.transaction_type === 'purchase' ? (
                              <BookOpen className="w-4 h-4 text-success" />
                            ) : tx.transaction_type === 'transfer' ? (
                              <ArrowUpRight className="w-4 h-4 text-primary" />
                            ) : (
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {tx.note || tx.transaction_type}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-foreground">
                          ${tx.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Purchases Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Course Purchases</CardTitle>
                <CardDescription>Revenue breakdown per purchase</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No course purchases yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {purchases.map(p => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            ${p.amount} sale
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs text-success border-success/30">
                            Platform: ${p.platform_share}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-primary border-primary/30">
                            Instructor: ${p.instructor_share}
                          </Badge>
                          {(p.l1_commission > 0 || p.l2_commission > 0) && (
                            <Badge variant="outline" className="text-xs text-gold border-gold/30">
                              Commissions: ${p.l1_commission + p.l2_commission}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CEOFinance;
