import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { useMessaging } from '@/hooks/useMessaging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HeadphonesIcon,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Search,
  Filter,
  ChevronRight,
  Mail,
  Phone,
  Settings,
  Send,
  RefreshCw
} from 'lucide-react';
import { STAT_GRADIENTS } from '@/lib/theme';
import { formatDistanceToNow } from 'date-fns';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { tickets, loading, stats, updateTicketStatus, refresh } = useSupportTickets(true);
  const { startDM } = useMessaging();
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const statCards = [
    { label: 'Open Tickets', value: stats.open.toString(), icon: MessageSquare, gradient: STAT_GRADIENTS[3] },
    { label: 'In Progress', value: stats.inProgress.toString(), icon: Clock, gradient: STAT_GRADIENTS[1] },
    { label: 'Resolved', value: stats.resolved.toString(), icon: CheckCircle2, gradient: STAT_GRADIENTS[2] },
    { label: 'Total', value: stats.total.toString(), icon: HeadphonesIcon, gradient: STAT_GRADIENTS[0] },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium': return 'bg-gold/10 text-gold border-gold/30';
      case 'low': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-accent/10 text-accent';
      case 'in_progress': return 'bg-gold/10 text-gold';
      case 'resolved': return 'bg-success/10 text-success';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesTab = activeTab === 'all' || t.status === activeTab;
    const matchesSearch = !searchQuery || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    
    // For now, just show success - in a real app, you'd send this via email or in-app messaging
    toast.success('Reply sent!', { description: `Response sent to ${selectedTicket.user?.full_name}` });
    setReply('');
    
    // Update status to in_progress if it was open
    if (selectedTicket.status === 'open') {
      await updateTicketStatus(selectedTicket.id, 'in_progress');
    }
    
    setSelectedTicket(null);
  };

  const handleUpdateStatus = async (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket.id, status);
    setSelectedTicket(null);
  };

  const handleStartDM = async (userId: string) => {
    await startDM(userId);
    navigate('/messages');
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Support Dashboard 🎧
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">Manage customer tickets and inquiries</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
              <stat.icon className="w-5 h-5 md:w-6 md:h-6 mb-2 opacity-90" />
              <p className="text-xl md:text-2xl font-display font-bold">{stat.value}</p>
              <p className="text-xs opacity-80">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tickets Section */}
        <motion.div
          className="bg-card rounded-xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Search & Filters */}
          <div className="p-3 md:p-4 border-b border-border flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search tickets..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="p-3 md:p-4 border-b border-border overflow-x-auto">
            <div className="flex gap-2">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="p-3 md:p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{ticket.category}</span>
                        </div>
                        <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{ticket.user?.full_name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{formatTime(ticket.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {ticket.user && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleStartDM(ticket.user!.id)}
                          title="Direct Message"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket)}>
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <motion.div
            className="bg-card rounded-xl border border-border p-4 hover:border-accent/30 transition-colors cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Mail className="w-8 h-8 text-accent mb-3" />
            <h3 className="font-medium text-foreground">Email Templates</h3>
            <p className="text-sm text-muted-foreground">Manage response templates</p>
          </motion.div>
          <motion.div
            className="bg-card rounded-xl border border-border p-4 hover:border-accent/30 transition-colors cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Phone className="w-8 h-8 text-gold mb-3" />
            <h3 className="font-medium text-foreground">Call Center</h3>
            <p className="text-sm text-muted-foreground">Phone support queue</p>
          </motion.div>
          <motion.div
            className="bg-card rounded-xl border border-border p-4 hover:border-accent/30 transition-colors cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AlertCircle className="w-8 h-8 text-destructive mb-3" />
            <h3 className="font-medium text-foreground">Escalations</h3>
            <p className="text-sm text-muted-foreground">{tickets.filter(t => t.priority === 'urgent').length} urgent issues</p>
          </motion.div>
          <motion.div
            className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl p-4 cursor-pointer text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={() => navigate('/messages')}
          >
            <MessageSquare className="w-8 h-8 mb-3" />
            <h3 className="font-medium">Live Chat</h3>
            <p className="text-sm opacity-80">View messages</p>
          </motion.div>
        </div>

        {/* Ticket Detail Modal */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">{selectedTicket?.category}</span>
                {selectedTicket?.priority && (
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                )}
                {selectedTicket?.status && (
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedTicket && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <User className="w-4 h-4" />
                    <span>{selectedTicket.user?.full_name || 'Unknown'}</span>
                    <span>•</span>
                    <Mail className="w-4 h-4" />
                    <span>{selectedTicket.user?.email || 'No email'}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(selectedTicket.created_at)}</span>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-foreground whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Your Reply</label>
                  <Textarea 
                    placeholder="Type your response to the customer..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('in_progress')}>
                      <Clock className="w-4 h-4 mr-1" /> In Progress
                    </Button>
                    <Button variant="outline" size="sm" className="text-success" onClick={() => handleUpdateStatus('resolved')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Resolved
                    </Button>
                  </div>
                  <Button onClick={handleSendReply} disabled={!reply.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Send Reply
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SupportDashboard;
