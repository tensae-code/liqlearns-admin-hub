import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestBoard, useQuestBoardAnswers, QuestBoardQuestion } from '@/hooks/useQuestBoard';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Plus,
  HelpCircle,
  MessageCircle,
  Eye,
  Settings,
  Hash,
  Video,
  Link,
  Check,
  X,
  Clock,
  Send,
  ChevronRight,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const QuestBoardTab = () => {
  const {
    questions,
    myQuestions,
    pendingQuestions,
    loading,
    allHashtags,
    hashtagPreferences,
    isAdmin,
    createQuestion,
    approveQuestion,
    rejectQuestion,
    answerQuestion,
    updateHashtagPreference,
  } = useQuestBoard();

  const [showAskModal, setShowAskModal] = useState(false);
  const [showQuestionDetail, setShowQuestionDetail] = useState<QuestBoardQuestion | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMyQuestions, setShowMyQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  // Form state
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    video_url: '',
    link_url: '',
    hashtags: [] as string[],
    newHashtag: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitQuestion = async () => {
    if (!newQuestion.title.trim()) {
      toast.error('Please enter a question title');
      return;
    }

    setIsSubmitting(true);
    const result = await createQuestion({
      title: newQuestion.title,
      content: newQuestion.content || undefined,
      video_url: newQuestion.video_url || undefined,
      link_url: newQuestion.link_url || undefined,
      hashtags: newQuestion.hashtags,
    });

    if (result) {
      setNewQuestion({ title: '', content: '', video_url: '', link_url: '', hashtags: [], newHashtag: '' });
      setShowAskModal(false);
    }
    setIsSubmitting(false);
  };

  const addHashtag = () => {
    const tag = newQuestion.newHashtag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tag && !newQuestion.hashtags.includes(tag)) {
      setNewQuestion(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, tag],
        newHashtag: '',
      }));
    }
  };

  const removeHashtag = (tag: string) => {
    setNewQuestion(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(t => t !== tag),
    }));
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = !searchQuery || 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHashtag = !selectedHashtag || q.hashtags?.includes(selectedHashtag);
    return matchesSearch && matchesHashtag;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-success/20 text-success"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Quest Board</h2>
          <p className="text-sm text-muted-foreground">Ask questions, share knowledge, earn reputation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMyQuestions(true)}>
            My Questions
          </Button>
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Hashtag Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Toggle hashtags to show/hide questions with those topics
                </p>
                {allHashtags.map(tag => {
                  const pref = hashtagPreferences.find(p => p.hashtag === tag);
                  const isEnabled = pref?.enabled !== false;
                  return (
                    <div key={tag} className="flex items-center justify-between py-2">
                      <Label htmlFor={`tag-${tag}`} className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-accent" />
                        {tag}
                      </Label>
                      <Switch
                        id={`tag-${tag}`}
                        checked={isEnabled}
                        onCheckedChange={(checked) => updateHashtagPreference(tag, checked)}
                      />
                    </div>
                  );
                })}
                {allHashtags.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hashtags available yet
                  </p>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button className="bg-gradient-accent text-accent-foreground" onClick={() => setShowAskModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ask Question
          </Button>
        </div>
      </div>

      {/* Admin Pending Approvals */}
      {isAdmin && pendingQuestions.length > 0 && (
        <div className="p-4 rounded-xl bg-gold/10 border border-gold/30 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-gold" />
            <h3 className="font-medium text-foreground">{pendingQuestions.length} Pending Approval</h3>
          </div>
          <div className="space-y-2">
            {pendingQuestions.slice(0, 3).map(q => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-card">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{q.title}</p>
                  <p className="text-xs text-muted-foreground">by {q.author?.full_name}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-success border-success hover:bg-success/10"
                    onClick={() => approveQuestion(q.id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => rejectQuestion(q.id, 'Does not meet guidelines')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedHashtag === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedHashtag(null)}
          >
            All
          </Button>
          {allHashtags.slice(0, 5).map(tag => (
            <Button
              key={tag}
              variant={selectedHashtag === tag ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedHashtag(tag === selectedHashtag ? null : tag)}
              className="shrink-0"
            >
              <Hash className="w-3 h-3 mr-1" />
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          filteredQuestions.map((q, i) => (
            <motion.div
              key={q.id}
              className="p-4 rounded-xl bg-card border border-border hover:border-accent/30 transition-all cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setShowQuestionDetail(q)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  {q.author?.avatar_url && <AvatarImage src={q.author.avatar_url} />}
                  <AvatarFallback className="bg-gradient-accent text-accent-foreground text-sm">
                    {q.author?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground mb-1 line-clamp-2">{q.title}</h3>
                  {q.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{q.content}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {q.hashtags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Hash className="w-3 h-3 mr-1" />{tag}
                      </Badge>
                    ))}
                    {q.video_url && <Video className="w-4 h-4 text-accent" />}
                    {q.link_url && <Link className="w-4 h-4 text-accent" />}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {q.answers_count} answers
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {q.views_count} views
                    </span>
                    <span>{formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Ask Question Modal */}
      <Dialog open={showAskModal} onOpenChange={setShowAskModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Question Title *</Label>
              <Input
                placeholder="What do you want to know?"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Details (optional)</Label>
              <Textarea
                placeholder="Provide more context..."
                value={newQuestion.content}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
                className="mt-1 min-h-[100px]"
              />
            </div>
            <div>
              <Label>Video URL (optional)</Label>
              <Input
                placeholder="https://youtube.com/..."
                value={newQuestion.video_url}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, video_url: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Reference Link (optional)</Label>
              <Input
                placeholder="https://..."
                value={newQuestion.link_url}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, link_url: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hashtags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Add hashtag"
                  value={newQuestion.newHashtag}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, newHashtag: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                />
                <Button type="button" variant="outline" onClick={addHashtag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {newQuestion.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newQuestion.hashtags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeHashtag(tag)}>
                      #{tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAskModal(false)}>Cancel</Button>
              <Button onClick={handleSubmitQuestion} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit for Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Detail Modal */}
      <QuestionDetailModal
        question={showQuestionDetail}
        onClose={() => setShowQuestionDetail(null)}
        onAnswer={answerQuestion}
      />

      {/* My Questions Sheet */}
      <Sheet open={showMyQuestions} onOpenChange={setShowMyQuestions}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>My Questions</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {myQuestions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">You haven't asked any questions yet</p>
            ) : (
              myQuestions.map(q => (
                <div key={q.id} className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-foreground line-clamp-2">{q.title}</h4>
                    {getStatusBadge(q.status)}
                  </div>
                  {q.status === 'rejected' && q.rejection_reason && (
                    <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                      {q.rejection_reason}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

// Question Detail Modal Component
const QuestionDetailModal = ({ 
  question, 
  onClose,
  onAnswer 
}: { 
  question: QuestBoardQuestion | null; 
  onClose: () => void;
  onAnswer: (questionId: string, content: string, videoUrl?: string, linkUrl?: string) => Promise<any>;
}) => {
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { answers, loading } = useQuestBoardAnswers(question?.id || '');

  const handleSubmitAnswer = async () => {
    if (!question || !answerContent.trim()) return;
    
    setIsSubmitting(true);
    const result = await onAnswer(question.id, answerContent);
    if (result) {
      setAnswerContent('');
    }
    setIsSubmitting(false);
  };

  if (!question) return null;

  return (
    <Dialog open={!!question} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl pr-8">{question.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Author & Meta */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {question.author?.avatar_url && <AvatarImage src={question.author.avatar_url} />}
              <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
                {question.author?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{question.author?.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Content */}
          {question.content && (
            <p className="text-foreground">{question.content}</p>
          )}

          {/* Media */}
          <div className="flex flex-wrap gap-2">
            {question.video_url && (
              <a 
                href={question.video_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <Video className="w-4 h-4" />
                <span className="text-sm">Watch Video</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {question.link_url && (
              <a 
                href={question.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <Link className="w-4 h-4" />
                <span className="text-sm">Reference Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Hashtags */}
          {question.hashtags && question.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.hashtags.map(tag => (
                <Badge key={tag} variant="outline">
                  <Hash className="w-3 h-3 mr-1" />{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Answers */}
          <div className="border-t border-border pt-4">
            <h3 className="font-medium text-foreground mb-4">
              {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
            </h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : answers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No answers yet. Be the first to help!
              </p>
            ) : (
              <div className="space-y-4">
                {answers.map(answer => (
                  <div key={answer.id} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        {answer.author?.avatar_url && <AvatarImage src={answer.author.avatar_url} />}
                        <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
                          {answer.author?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{answer.author?.full_name}</span>
                          {answer.is_accepted && (
                            <Badge className="bg-success text-success-foreground text-xs">
                              <Check className="w-3 h-3 mr-1" />Accepted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{answer.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Answer Input */}
          <div className="border-t border-border pt-4">
            <Label className="mb-2 block">Your Answer</Label>
            <Textarea
              placeholder="Share your knowledge..."
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              className="min-h-[100px] mb-3"
            />
            <Button 
              onClick={handleSubmitAnswer} 
              disabled={!answerContent.trim() || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Post Answer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestBoardTab;
