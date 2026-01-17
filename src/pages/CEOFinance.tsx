import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ShoppingBag
} from 'lucide-react';

const CEOFinance = () => {
  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 61000, expenses: 38000 },
    { month: 'Apr', revenue: 58000, expenses: 36000 },
    { month: 'May', revenue: 67000, expenses: 40000 },
    { month: 'Jun', revenue: 72000, expenses: 42000 },
  ];

  const transactions = [
    { id: 1, type: 'income', description: 'Subscription Revenue', amount: 12500, date: 'Today' },
    { id: 2, type: 'expense', description: 'Server Costs', amount: 3200, date: 'Today' },
    { id: 3, type: 'income', description: 'Enterprise License', amount: 25000, date: 'Yesterday' },
    { id: 4, type: 'expense', description: 'Marketing Campaign', amount: 5000, date: 'Yesterday' },
    { id: 5, type: 'income', description: 'Course Sales', amount: 8400, date: '2 days ago' },
    { id: 6, type: 'expense', description: 'Teacher Payouts', amount: 15600, date: '2 days ago' },
  ];

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

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-success">$355,000</p>
                  <div className="flex items-center gap-1 text-xs text-success mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+12.5% from last month</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-destructive">$223,000</p>
                  <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <ArrowDownRight className="w-3 h-3" />
                    <span>+8.2% from last month</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-destructive/10">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold text-foreground">$132,000</p>
                  <div className="flex items-center gap-1 text-xs text-success mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+18.3% margin</span>
                  </div>
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
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <p className="text-2xl font-bold text-foreground">$48,500</p>
                  <div className="flex items-center gap-1 text-xs text-success mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+5.2% growth</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-accent/10">
                  <PiggyBank className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Sources */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$28,450</p>
              <p className="text-xs text-muted-foreground mt-1">1,423 active subscribers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-success" />
                Course Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$15,200</p>
              <p className="text-xs text-muted-foreground mt-1">342 courses sold this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Enterprise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$45,000</p>
              <p className="text-xs text-muted-foreground mt-1">8 enterprise contracts</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions & Charts */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="payouts">Teacher Payouts</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                          {tx.type === 'income' ? (
                            <ArrowUpRight className={`w-4 h-4 text-success`} />
                          ) : (
                            <ArrowDownRight className={`w-4 h-4 text-destructive`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Transactions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Payouts</CardTitle>
                <CardDescription>Pending and completed teacher payments</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Payout management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Generate and manage invoices</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Invoice management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CEOFinance;
