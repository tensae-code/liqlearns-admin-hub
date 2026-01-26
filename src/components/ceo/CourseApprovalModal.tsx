import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Send,
  Clock,
  Eye,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Lock
} from 'lucide-react';
import { 
  useSubmittedCourses, 
  useCourseReviewComments, 
  useAddReviewComment,
  useApproveCourse,
  useRejectCourse,
  useClaimCourse,
  useUnclaimCourse,
  SubmittedCourse
} from '@/hooks/useCourseApproval';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import CoursePreviewPanel from './CoursePreviewPanel';

interface CourseApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CourseApprovalModal = ({ open, onOpenChange }: CourseApprovalModalProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<SubmittedCourse | null>(null);
  const [newComment, setNewComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: courses, isLoading } = useSubmittedCourses();
  const { data: comments, isLoading: commentsLoading } = useCourseReviewComments(selectedCourse?.id || '');
  const addComment = useAddReviewComment();
  const approveCourse = useApproveCourse();
  const rejectCourse = useRejectCourse();
  const claimCourse = useClaimCourse();
  const unclaimCourse = useUnclaimCourse();

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const isClaimedByMe = selectedCourse?.claimed_by === user?.id;
  const isClaimedByOther = selectedCourse?.claimed_by && selectedCourse.claimed_by !== user?.id;
  const canReview = isClaimedByMe || !selectedCourse?.claimed_by;

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedCourse || !profile) return;
    
    addComment.mutate({
      courseId: selectedCourse.id,
      comment: newComment.trim(),
      reviewerId: profile.id,
    }, {
      onSuccess: () => setNewComment(''),
    });
  };

  const handleClaim = () => {
    if (!selectedCourse) return;
    claimCourse.mutate(selectedCourse.id);
  };

  const handleUnclaim = () => {
    if (!selectedCourse) return;
    unclaimCourse.mutate(selectedCourse.id);
  };

  const handleApprove = () => {
    if (!selectedCourse || !selectedCourse.instructor) return;
    
    approveCourse.mutate({
      courseId: selectedCourse.id,
      instructorId: selectedCourse.instructor.id,
    }, {
      onSuccess: () => {
        setSelectedCourse(null);
      },
    });
  };

  const handleReject = () => {
    if (!selectedCourse || !selectedCourse.instructor) return;
    
    rejectCourse.mutate({
      courseId: selectedCourse.id,
      instructorId: selectedCourse.instructor.id,
      reason: rejectionReason.trim() || undefined,
    }, {
      onSuccess: () => {
        setSelectedCourse(null);
        setRejectionReason('');
        setShowRejectForm(false);
      },
    });
  };

  const handlePreview = () => {
    if (!selectedCourse) return;
    setShowPreview(true);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const isCourseClaimedByOther = (course: SubmittedCourse) => {
    return course.claimed_by && course.claimed_by !== user?.id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-accent" />
            Course Approvals
            {courses && courses.length > 0 && (
              <Badge className="bg-gold/20 text-gold ml-2">{courses.length} pending</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {selectedCourse && showPreview ? (
          // Inline Course Preview
          <CoursePreviewPanel 
            course={selectedCourse}
            onBack={() => setShowPreview(false)}
          />
        ) : selectedCourse ? (
          // Course Detail View
          <div className="flex flex-col flex-1 min-h-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedCourse(null);
                setShowRejectForm(false);
                setRejectionReason('');
                setShowPreview(false);
              }}
              className="mb-2 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to list
            </Button>

            {/* Scrollable content area */}
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-2">
                {/* Claim Status Banner */}
                {isClaimedByOther && (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2">
                    <Lock className="w-4 h-4 text-warning" />
                    <span className="text-sm text-warning">
                      This course is being reviewed by another admin
                    </span>
                  </div>
                )}

                {isClaimedByMe && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-success" />
                      <span className="text-sm text-success">
                        You are reviewing this course
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleUnclaim}>
                      Release
                    </Button>
                  </div>
                )}

                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center text-2xl text-primary-foreground">
                    📚
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{selectedCourse.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{selectedCourse.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary">{selectedCourse.category}</Badge>
                      <Badge variant="outline">{selectedCourse.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Submitted {formatTime(selectedCourse.submitted_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instructor Info */}
                {selectedCourse.instructor && (
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <Avatar>
                      <AvatarImage src={selectedCourse.instructor.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {selectedCourse.instructor.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{selectedCourse.instructor.full_name}</p>
                      <p className="text-xs text-muted-foreground">Course Instructor</p>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-accent" />
                    Review Comments (Optional)
                  </h4>
                  
                  <ScrollArea className="h-32 border border-border rounded-lg p-3">
                    {commentsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : comments && comments.length > 0 ? (
                      <div className="space-y-3">
                        {comments.map(comment => (
                          <div key={comment.id} className="flex gap-3 p-2 bg-muted/30 rounded-lg">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.reviewer?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {comment.reviewer?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {comment.reviewer?.full_name || 'Reviewer'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{comment.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No comments yet. Add feedback for the instructor (optional).
                      </p>
                    )}
                  </ScrollArea>

                  {/* Add Comment */}
                  {canReview && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a comment for the instructor..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <Button 
                        onClick={handleAddComment} 
                        disabled={!newComment.trim() || addComment.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Reject Reason Form */}
                {showRejectForm && (
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-destructive">Rejection Reason (Optional)</p>
                    <Textarea
                      placeholder="Explain what needs to be fixed (optional)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleReject}
                        disabled={rejectCourse.isPending}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Fixed Actions Footer */}
            <div className="flex items-center gap-3 pt-4 border-t border-border shrink-0">
              <Button variant="outline" onClick={handlePreview} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                Preview Course
              </Button>
              
              {!selectedCourse.claimed_by && (
                <Button 
                  variant="secondary"
                  onClick={handleClaim}
                  disabled={claimCourse.isPending}
                  className="flex-1"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Claim for Review
                </Button>
              )}
              
              {canReview && !showRejectForm && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button 
                    onClick={handleApprove}
                    disabled={approveCourse.isPending}
                    className="flex-1 bg-success hover:bg-success/90 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve & Publish
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          // Course List View
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="space-y-2">
                  {filteredCourses.map(course => {
                    const claimedByOther = isCourseClaimedByOther(course);
                    const claimedByMe = course.claimed_by === user?.id;
                    
                    return (
                      <div
                        key={course.id}
                        onClick={() => setSelectedCourse(course)}
                        className={`flex items-center gap-4 p-4 rounded-lg border bg-card transition-colors cursor-pointer ${
                          claimedByOther 
                            ? 'border-warning/30 opacity-60' 
                            : claimedByMe 
                              ? 'border-success/30 bg-success/5'
                              : 'border-border hover:bg-muted/30'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{course.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>by {course.instructor?.full_name || 'Unknown'}</span>
                            <span>•</span>
                            <span>{course.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(course.submitted_at)}
                            </span>
                          </div>
                        </div>
                        {claimedByOther && (
                          <Badge variant="outline" className="text-warning border-warning/30">
                            <Lock className="w-3 h-3 mr-1" />
                            In Review
                          </Badge>
                        )}
                        {claimedByMe && (
                          <Badge variant="outline" className="text-success border-success/30">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Your Review
                          </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <p className="font-medium text-foreground">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No courses pending review</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseApprovalModal;
