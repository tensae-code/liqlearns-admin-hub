import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ArrowLeft,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

const CEOReports = () => {
  const navigate = useNavigate();

  const reportCategories = [
    { label: 'Financial', count: 12, icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'User Growth', count: 8, icon: Users, color: 'bg-blue-500' },
    { label: 'Course Analytics', count: 15, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Performance', count: 6, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const recentReports = [
    { 
      title: 'Q4 2025 Financial Summary', 
      type: 'Financial', 
      date: 'Jan 8, 2026', 
      status: 'completed',
      author: 'Finance Team'
    },
    { 
      title: 'Monthly User Acquisition Report', 
      type: 'User Growth', 
      date: 'Jan 5, 2026', 
      status: 'completed',
      author: 'Marketing Team'
    },
    { 
      title: 'Course Completion Metrics - December', 
      type: 'Course Analytics', 
      date: 'Jan 3, 2026', 
      status: 'completed',
      author: 'Content Team'
    },
    { 
      title: 'Annual Performance Review 2025', 
      type: 'Performance', 
      date: 'Jan 1, 2026', 
      status: 'pending',
      author: 'HR Team'
    },
    { 
      title: 'Infrastructure Cost Analysis', 
      type: 'Financial', 
      date: 'Dec 28, 2025', 
      status: 'completed',
      author: 'Engineering Team'
    },
    { 
      title: 'Customer Satisfaction Survey Results', 
      type: 'Performance', 
      date: 'Dec 25, 2025', 
      status: 'completed',
      author: 'Support Team'
    },
  ];

  const scheduledReports = [
    { title: 'Weekly Revenue Report', frequency: 'Every Monday', nextRun: 'Jan 13, 2026' },
    { title: 'Monthly Active Users', frequency: 'First of Month', nextRun: 'Feb 1, 2026' },
    { title: 'Quarterly Business Review', frequency: 'Quarterly', nextRun: 'Apr 1, 2026' },
  ];

  const handleDownload = (reportTitle: string) => {
    toast.success(`Downloading ${reportTitle}...`);
  };

  const handleView = (reportTitle: string) => {
    toast.info(`Opening ${reportTitle}...`);
  };

  const handleGenerateReport = () => {
    toast.info('Report generation feature coming soon!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ceo')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
                <FileText className="w-8 h-8 text-primary" />
                Reports Center
              </h1>
              <p className="text-muted-foreground">Access and manage all company reports</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateReport}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
            <Button onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </div>
        </motion.div>

        {/* Report Categories */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {reportCategories.map((category, i) => (
            <motion.div
              key={category.label}
              className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center mb-3`}>
                <category.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-foreground">{category.label}</p>
              <p className="text-sm text-muted-foreground">{category.count} reports</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Reports */}
        <motion.div
          className="bg-card border border-border rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Reports</h2>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentReports.map((report, i) => (
              <motion.div
                key={i}
                className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">{report.title}</p>
                    {report.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gold flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs">{report.type}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.date}
                    </span>
                    <span className="hidden sm:inline">by {report.author}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleView(report.title)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(report.title)}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scheduled Reports */}
        <motion.div
          className="bg-card border border-border rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Scheduled Reports
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {scheduledReports.map((report, i) => (
              <div key={i} className="bg-muted/30 rounded-lg p-4">
                <p className="font-medium text-foreground mb-2">{report.title}</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Frequency: {report.frequency}</p>
                  <p>Next run: {report.nextRun}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default CEOReports;
