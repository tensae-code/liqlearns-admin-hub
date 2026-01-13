import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  X
} from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  user: string;
  email: string;
  priority: string;
  status: string;
  time: string;
  description?: string;
}

// Define the four gradients used across the app
const STAT_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400'
];

const SupportDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');

  const stats = [
    { label: 'Open Tickets', value: '23', icon: MessageSquare, gradient: STAT_GRADIENTS[3] },
    { label: 'Pending', value: '8', icon: Clock, gradient: STAT_GRADIENTS[1] },
    { label: 'Resolved Today', value: '45', icon: CheckCircle2, gradient: STAT_GRADIENTS[2] },
    { label: 'Avg. Response', value: '2.5h', icon: HeadphonesIcon, gradient: STAT_GRADIENTS[0] },
  ];

  const tickets: Ticket[] = [
    { id: 'TK-1234', subject: 'Cannot access course materials', user: 'Alemayehu M.', email: 'alem@email.com', priority: 'high', status: 'open', time: '5 min ago', description: 'I purchased the Advanced Amharic course but I cannot access any of the video lessons. When I click on them, it shows a loading spinner but never loads.' },
    { id: 'TK-1233', subject: 'Payment issue with subscription', user: 'Sara T.', email: 'sara@email.com', priority: 'high', status: 'open', time: '15 min ago', description: 'My credit card was charged twice for my monthly subscription. Please help me get a refund for the duplicate charge.' },
    { id: 'TK-1232', subject: 'How to download certificates?', user: 'Dawit B.', email: 'dawit@email.com', priority: 'low', status: 'pending', time: '1 hour ago', description: 'I completed the Basic Amharic course but I cannot find where to download my certificate. Can you please guide me?' },
    { id: 'TK-1231', subject: 'Video not playing on mobile', user: 'Tigist K.', email: 'tigist@email.com', priority: 'medium', status: 'open', time: '2 hours ago', description: 'Videos work fine on my laptop but when I try to watch on my Android phone, they just show a black screen.' },
    { id: 'TK-1230', subject: 'Request for course refund', user: 'Yonas G.', email: 'yonas@email.com', priority: 'high', status: 'pending', time: '3 hours ago', description: 'I would like to request a full refund for the Ethiopian History course. I realized it is not what I was looking for.' },
    { id: 'TK-1229', subject: 'Quiz score not updating', user: 'Hanna A.', email: 'hanna@email.com', priority: 'medium', status: 'resolved', time: '5 hours ago', description: 'I completed the quiz for Lesson 5 but my score is still showing as 0%. I definitely got most questions correct.' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium': return 'bg-gold/10 text-gold border-gold/30';
      case 'low': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-accent/10 text-accent';
      case 'pending': return 'bg-gold/10 text-gold';
      case 'resolved': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredTickets = activeTab === 'all' ? tickets : tickets.filter(t => t.status === activeTab);

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleSendReply = () => {
    if (!reply.trim()) return;
    toast.success('Reply sent!', { description: `Response sent to ${selectedTicket?.user}` });
    setReply('');
    setSelectedTicket(null);
  };

  const handleUpdateStatus = (status: string) => {
    toast.success('Status updated', { description: `Ticket ${selectedTicket?.id} marked as ${status}` });
    setSelectedTicket(null);
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
            <Button size="sm" className="w-fit" onClick={() => navigate('/support')}>
              <MessageSquare className="w-4 h-4 mr-2" /> New Ticket
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid - Colorful Gradient Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
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
              <Input placeholder="Search tickets..." className="pl-10" />
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
              {(['all', 'open', 'pending', 'resolved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="divide-y divide-border">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-3 md:p-4 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{ticket.id}</span>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{ticket.user}</span>
                        <span>•</span>
                        <span>{ticket.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket)}>
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
            <p className="text-sm text-muted-foreground">3 urgent issues</p>
          </motion.div>
          <motion.div
            className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl p-4 cursor-pointer text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={() => toast.info('Live Chat', { description: 'Opening live chat...' })}
          >
            <MessageSquare className="w-8 h-8 mb-3" />
            <h3 className="font-medium">Live Chat</h3>
            <p className="text-sm opacity-80">12 active conversations</p>
          </motion.div>
        </div>

        {/* Ticket Detail Modal */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">{selectedTicket?.id}</span>
                {selectedTicket?.priority && (
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                )}
                {selectedTicket?.status && (
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
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
                    <span>{selectedTicket.user}</span>
                    <span>•</span>
                    <Mail className="w-4 h-4" />
                    <span>{selectedTicket.email}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>{selectedTicket.time}</span>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-foreground">{selectedTicket.description}</p>
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
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('pending')}>
                      <Clock className="w-4 h-4 mr-1" /> Mark Pending
                    </Button>
                    <Button variant="outline" size="sm" className="text-success" onClick={() => handleUpdateStatus('resolved')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Resolved
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
