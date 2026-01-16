import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Video, 
  Mic, 
  Image,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { STAT_GRADIENTS } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface SubmissionHistoryItem {
  id: string;
  assignmentTitle: string;
  assignmentId: string;
  submittedAt: string;
  fileType: 'text' | 'pdf' | 'audio' | 'video' | 'image';
  content?: string;
  fileUrl?: string;
  grade?: string;
  feedback?: string;
  status: 'pending' | 'graded' | 'late' | 'resubmit_requested';
  resubmitRequestedAt?: string;
  resubmitReason?: string;
}

interface StudentSubmissionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    course: string;
  } | null;
  submissions: SubmissionHistoryItem[];
  onRequestResubmit: (submissionId: string, reason: string) => void;
  onViewSubmission: (submission: SubmissionHistoryItem) => void;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'text': return FileText;
    case 'pdf': return FileText;
    case 'audio': return Mic;
    case 'video': return Video;
    case 'image': return Image;
    default: return FileText;
  }
};

const getStatusBadge = (status: string, grade?: string) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-gold/10 text-gold border-gold/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case 'graded':
      return <Badge className="bg-success/10 text-success border-success/30"><CheckCircle2 className="w-3 h-3 mr-1" />{grade || 'Graded'}</Badge>;
    case 'late':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/30"><AlertTriangle className="w-3 h-3 mr-1" />Late</Badge>;
    case 'resubmit_requested':
      return <Badge className="bg-accent/10 text-accent border-accent/30"><RefreshCw className="w-3 h-3 mr-1" />Resubmit Requested</Badge>;
    default:
      return null;
  }
};

const StudentSubmissionHistory = ({
  open,
  onOpenChange,
  student,
  submissions,
  onRequestResubmit,
  onViewSubmission
}: StudentSubmissionHistoryProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionHistoryItem | null>(null);
  const [resubmitReason, setResubmitReason] = useState('');
  const [showResubmitForm, setShowResubmitForm] = useState(false);

  const handleRequestResubmit = () => {
    if (!selectedSubmission) return;
    
    if (!resubmitReason.trim()) {
      toast.error('Please provide a reason for resubmission request');
      return;
    }
    
    onRequestResubmit(selectedSubmission.id, resubmitReason);
    toast.success('Resubmit request sent!', {
      description: `${student?.name} will be notified to resubmit their work.`
    });
    
    setResubmitReason('');
    setShowResubmitForm(false);
    setSelectedSubmission(null);
  };

  if (!open || !student) return null;

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const resubmitCount = submissions.filter(s => s.status === 'resubmit_requested').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={student.avatar} />
                <AvatarFallback className={`bg-gradient-to-br ${STAT_GRADIENTS[0]} text-white font-bold`}>
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-display font-semibold text-foreground">{student.name}</h3>
                <p className="text-sm text-muted-foreground">{student.course}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="px-4 py-3 border-b border-border grid grid-cols-3 gap-2 shrink-0">
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="text-lg font-bold text-foreground">{submissions.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-2 bg-success/10 rounded-lg">
              <p className="text-lg font-bold text-success">{gradedCount}</p>
              <p className="text-xs text-muted-foreground">Graded</p>
            </div>
            <div className="text-center p-2 bg-gold/10 rounded-lg">
              <p className="text-lg font-bold text-gold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>

          {/* Submissions List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Submission History</h4>
            
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission, i) => {
                  const FileIcon = getFileIcon(submission.fileType);
                  return (
                    <motion.div
                      key={submission.id}
                      className={cn(
                        "p-4 bg-muted/30 rounded-xl border transition-all cursor-pointer hover:bg-muted/50",
                        selectedSubmission?.id === submission.id ? "border-primary" : "border-transparent"
                      )}
                      onClick={() => setSelectedSubmission(submission)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${STAT_GRADIENTS[i % 4]} flex items-center justify-center`}>
                          <FileIcon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h5 className="font-medium text-foreground truncate">{submission.assignmentTitle}</h5>
                            {getStatusBadge(submission.status, submission.grade)}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Submitted {submission.submittedAt}
                          </p>
                          
                          {submission.feedback && (
                            <div className="mt-2 p-2 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground mb-1">Your Feedback:</p>
                              <p className="text-sm text-foreground">{submission.feedback}</p>
                            </div>
                          )}
                          
                          {submission.status === 'resubmit_requested' && submission.resubmitReason && (
                            <div className="mt-2 p-2 bg-accent/10 rounded-lg border border-accent/20">
                              <p className="text-xs text-accent mb-1">Resubmit Reason:</p>
                              <p className="text-sm text-foreground">{submission.resubmitReason}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewSubmission(submission);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {submission.status !== 'resubmit_requested' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubmission(submission);
                                setShowResubmitForm(true);
                              }}
                              title="Request Resubmission"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resubmit Request Form */}
          <AnimatePresence>
            {showResubmitForm && selectedSubmission && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border shrink-0 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">Request Resubmission</h4>
                      <p className="text-xs text-muted-foreground">{selectedSubmission.assignmentTitle}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowResubmitForm(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="Explain why the student should resubmit (e.g., missing requirements, needs more detail, formatting issues)..."
                    value={resubmitReason}
                    onChange={(e) => setResubmitReason(e.target.value)}
                    rows={3}
                    className="mb-3"
                  />
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowResubmitForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRequestResubmit} className="gap-2">
                      <Send className="w-4 h-4" />
                      Send Resubmit Request
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudentSubmissionHistory;
