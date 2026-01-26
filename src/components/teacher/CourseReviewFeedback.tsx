import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Clock } from 'lucide-react';
import { useTeacherCourseComments } from '@/hooks/useCourseApproval';

interface CourseReviewFeedbackProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  rejectionReason?: string | null;
}

const CourseReviewFeedback = ({ 
  open, 
  onOpenChange, 
  courseId, 
  courseTitle,
  rejectionReason 
}: CourseReviewFeedbackProps) => {
  const { data: comments, isLoading } = useTeacherCourseComments(courseId);

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            Review Feedback
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {courseTitle}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rejection Reason (if any) */}
          {rejectionReason && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
              <p className="text-sm text-foreground">{rejectionReason}</p>
            </div>
          )}

          {/* Review Comments */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">
              Reviewer Comments
            </h4>
            
            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.reviewer?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {comment.reviewer?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {comment.reviewer?.full_name || 'Reviewer'}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Admin
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseReviewFeedback;
