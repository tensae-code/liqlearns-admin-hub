import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  MoreVertical
} from 'lucide-react';

const SupportDashboard = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');

  const stats = [
    { label: 'Open Tickets', value: '23', icon: MessageSquare, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Pending', value: '8', icon: Clock, color: 'text-gold', bg: 'bg-gold/10' },
    { label: 'Resolved Today', value: '45', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Avg. Response', value: '2.5h', icon: HeadphonesIcon, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const tickets = [
    { id: 'TK-1234', subject: 'Cannot access course materials', user: 'Alemayehu M.', email: 'alem@email.com', priority: 'high', status: 'open', time: '5 min ago' },
    { id: 'TK-1233', subject: 'Payment issue with subscription', user: 'Sara T.', email: 'sara@email.com', priority: 'high', status: 'open', time: '15 min ago' },
    { id: 'TK-1232', subject: 'How to download certificates?', user: 'Dawit B.', email: 'dawit@email.com', priority: 'low', status: 'pending', time: '1 hour ago' },
    { id: 'TK-1231', subject: 'Video not playing on mobile', user: 'Tigist K.', email: 'tigist@email.com', priority: 'medium', status: 'open', time: '2 hours ago' },
    { id: 'TK-1230', subject: 'Request for course refund', user: 'Yonas G.', email: 'yonas@email.com', priority: 'high', status: 'pending', time: '3 hours ago' },
    { id: 'TK-1229', subject: 'Quiz score not updating', user: 'Hanna A.', email: 'hanna@email.com', priority: 'medium', status: 'resolved', time: '5 hours ago' },
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
          <Button size="sm" className="w-fit">
            <MessageSquare className="w-4 h-4 mr-2" /> New Ticket
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-card rounded-xl p-3 md:p-5 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2 md:mb-3`}>
                <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
              </div>
              <p className="text-lg md:text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
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
                    <Button variant="outline" size="sm">
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportDashboard;
