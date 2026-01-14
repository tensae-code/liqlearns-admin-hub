import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Mic, 
  Video, 
  Upload,
  Send,
  Paperclip,
  StopCircle,
  Play,
  Pause,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { STAT_GRADIENTS } from '@/lib/theme';

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  instructions: string;
  submissionTypes: ('text' | 'file' | 'audio' | 'video')[];
}

interface AssignmentSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  onSubmit: (assignmentId: string, submission: { type: string; content: string; fileUrl?: string }) => void;
}

const AssignmentSubmissionModal = ({ 
  open, 
  onOpenChange,
  assignment,
  onSubmit
}: AssignmentSubmissionModalProps) => {
  const [submissionType, setSubmissionType] = useState<'text' | 'file' | 'audio' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File too large', { description: 'Maximum file size is 50MB' });
        return;
      }
      setSelectedFile(file);
      toast.success('File selected', { description: file.name });
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    // In real app, start actual recording
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    // Store interval for cleanup
    (window as any).recordingInterval = interval;
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecording(true);
    clearInterval((window as any).recordingInterval);
    toast.success('Recording saved!');
  };

  const deleteRecording = () => {
    setHasRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (!assignment) return;

    // Validate based on submission type
    if (submissionType === 'text' && !textContent.trim()) {
      toast.error('Please enter your response');
      return;
    }
    if (submissionType === 'file' && !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if ((submissionType === 'audio' || submissionType === 'video') && !hasRecording) {
      toast.error(`Please record your ${submissionType} submission`);
      return;
    }

    onSubmit(assignment.id, {
      type: submissionType,
      content: textContent,
      fileUrl: selectedFile?.name
    });

    toast.success('Assignment submitted! 🎉', {
      description: 'Your teacher will review it soon.'
    });

    // Reset form
    setTextContent('');
    setSelectedFile(null);
    setHasRecording(false);
    setRecordingTime(0);
    onOpenChange(false);
  };

  if (!open || !assignment) return null;

  const submissionTypeOptions = [
    { type: 'text' as const, icon: FileText, label: 'Text', enabled: assignment.submissionTypes.includes('text') },
    { type: 'file' as const, icon: Upload, label: 'File', enabled: assignment.submissionTypes.includes('file') },
    { type: 'audio' as const, icon: Mic, label: 'Audio', enabled: assignment.submissionTypes.includes('audio') },
    { type: 'video' as const, icon: Video, label: 'Video', enabled: assignment.submissionTypes.includes('video') },
  ].filter(opt => opt.enabled);

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
          className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg text-foreground">Submit Assignment</h3>
                <p className="text-sm text-muted-foreground">{assignment.title}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Assignment Info */}
            <div className="p-3 bg-muted/30 rounded-lg text-sm">
              <p className="font-medium text-foreground mb-1">Instructions:</p>
              <p className="text-muted-foreground">{assignment.instructions}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </p>
            </div>

            {/* Submission Type Selector */}
            {submissionTypeOptions.length > 1 && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Submission Type</label>
                <div className="flex gap-2">
                  {submissionTypeOptions.map(({ type, icon: Icon, label }) => (
                    <motion.button
                      key={type}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                        submissionType === type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSubmissionType(type)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={cn(
                        "w-5 h-5",
                        submissionType === type ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        submissionType === type ? "text-primary" : "text-muted-foreground"
                      )}>
                        {label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Text Submission */}
            {submissionType === 'text' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="text-sm font-medium text-foreground block mb-2">Your Response</label>
                <Textarea
                  placeholder="Write your answer here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {textContent.length} characters
                </p>
              </motion.div>
            )}

            {/* File Upload */}
            {submissionType === 'file' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                
                {selectedFile ? (
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${STAT_GRADIENTS[1]} flex items-center justify-center`}>
                        <Paperclip className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center gap-3"
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[1]} flex items-center justify-center`}>
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">Click to upload file</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, PPT, images (max 50MB)
                      </p>
                    </div>
                  </button>
                )}
              </motion.div>
            )}

            {/* Audio Recording */}
            {submissionType === 'audio' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${STAT_GRADIENTS[0]} flex items-center justify-center relative`}>
                  {isRecording && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-white/30"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <Mic className="w-12 h-12 text-white" />
                </div>

                <p className="text-2xl font-mono font-bold text-foreground">
                  {formatTime(recordingTime)}
                </p>

                {!hasRecording ? (
                  isRecording ? (
                    <Button 
                      variant="destructive" 
                      size="lg"
                      onClick={stopRecording}
                      className="gap-2"
                    >
                      <StopCircle className="w-5 h-5" /> Stop Recording
                    </Button>
                  ) : (
                    <Button 
                      size="lg"
                      onClick={startRecording}
                      className="gap-2"
                    >
                      <Mic className="w-5 h-5" /> Start Recording
                    </Button>
                  )
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" className="gap-2">
                      <Play className="w-4 h-4" /> Play
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={deleteRecording}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                )}
              </motion.div>
            )}

            {/* Video Recording */}
            {submissionType === 'video' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className="aspect-video bg-black/80 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {isRecording && (
                    <motion.div
                      className="absolute top-3 right-3 flex items-center gap-2 bg-destructive text-white px-2 py-1 rounded-full text-xs"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                      REC
                    </motion.div>
                  )}
                  <Video className="w-16 h-16 text-white/50" />
                </div>

                <p className="text-xl font-mono font-bold text-foreground">
                  {formatTime(recordingTime)}
                </p>

                {!hasRecording ? (
                  isRecording ? (
                    <Button 
                      variant="destructive" 
                      size="lg"
                      onClick={stopRecording}
                      className="gap-2"
                    >
                      <StopCircle className="w-5 h-5" /> Stop Recording
                    </Button>
                  ) : (
                    <Button 
                      size="lg"
                      onClick={startRecording}
                      className="gap-2"
                    >
                      <Video className="w-5 h-5" /> Start Recording
                    </Button>
                  )
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" className="gap-2">
                      <Play className="w-4 h-4" /> Preview
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={deleteRecording}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1 gap-2" onClick={handleSubmit}>
              <Send className="w-4 h-4" /> Submit
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AssignmentSubmissionModal;
