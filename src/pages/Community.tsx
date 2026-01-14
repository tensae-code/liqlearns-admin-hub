import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useSkillSuggestions } from '@/hooks/useSkillSuggestions';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  Heart,
  Share2,
  Send,
  Image,
  Smile,
  TrendingUp,
  Award,
  Search,
  Plus,
  MessageCircle,
  ThumbsUp,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Vote,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Clock,
  Check,
  X,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';

const brainBankQuestions = [
  { id: 1, question: 'How do you conjugate verbs in the past tense?', answers: 15, views: 234 },
  { id: 2, question: 'What are the most common greeting phrases?', answers: 23, views: 456 },
  { id: 3, question: 'Difference between formal and informal speech?', answers: 8, views: 189 },
];

const topContributors = [
  { name: 'Sara M.', points: 2450, badge: '🏆' },
  { name: 'Daniel K.', points: 2120, badge: '🥈' },
  { name: 'Meron A.', points: 1890, badge: '🥉' },
  { name: 'Yonas T.', points: 1654 },
  { name: 'Tigist B.', points: 1432 },
];

// Category options for skill suggestions
const skillCategories = ['General', 'Professional', 'Culture', 'Modern', 'Academic'];

const Community = () => {
  const [activeTab, setActiveTab] = useState<'wall' | 'brainbank' | 'skills'>('wall');
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('General');
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<string[]>([]);

  const { posts, loading, createPost, toggleLike, addComment, isAuthenticated } = useCommunityPosts();
  const { 
    suggestions, 
    mySuggestions, 
    loading: suggestionsLoading, 
    submitting, 
    submitSuggestion, 
    vote, 
    deleteSuggestion,
    isAuthenticated: isAuthenticatedSkills 
  } = useSkillSuggestions();

  const handleComment = async (postId: string) => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;
    
    const success = await addComment(postId, comment);
    if (success) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const toggleCommentsSection = (postId: string) => {
    setExpandedComments(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleVote = async (skillId: string, direction: 'up' | 'down') => {
    await vote(skillId, direction);
  };

  const handleSuggestSkill = async () => {
    if (!newSkillName.trim() || !newSkillDesc.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const success = await submitSuggestion(newSkillName, newSkillDesc, newSkillCategory);
    if (success) {
      setNewSkillName('');
      setNewSkillDesc('');
      setNewSkillCategory('General');
      setShowSuggestForm(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    if (!isAuthenticated) {
      toast.error('Please sign in to post');
      return;
    }
    
    setIsPosting(true);
    const success = await createPost(newPost);
    if (success) {
      setNewPost('');
    }
    setIsPosting(false);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const getDaysLeft = (endDate: string | null) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const getStatusBadge = (status: 'pending' | 'voting' | 'approved' | 'rejected' | 'in_development') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pending Approval</Badge>;
      case 'voting':
        return <Badge variant="secondary" className="bg-accent/20 text-accent"><Vote className="w-3 h-3 mr-1" />Voting</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-success/20 text-success"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'in_development':
        return <Badge variant="secondary" className="bg-gold/20 text-gold"><Sparkles className="w-3 h-3 mr-1" />In Development</Badge>;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">Community</h1>
            <p className="text-muted-foreground">Connect, share, and learn together</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('wall')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'wall' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Community Wall
          </button>
          <button
            onClick={() => setActiveTab('brainbank')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'brainbank' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Brain Bank
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'skills' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Vote className="w-4 h-4" />
            Skill Voting
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Community Wall Tab */}
          {activeTab === 'wall' && (
            <>
              {/* Create Post */}
              <motion.div
                className="p-4 rounded-xl bg-card border border-border mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-accent text-accent-foreground">U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Share something with the community..."
                      value={newPost}
                      onChange={(e) => {
                        console.log('Textarea change:', e.target.value);
                        setNewPost(e.target.value);
                      }}
                      className="min-h-[80px] mb-3"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="icon">
                          <Image className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon">
                          <Smile className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </div>
                      <Button 
                        type="button"
                        className="bg-gradient-accent text-accent-foreground hover:opacity-90"
                        onClick={() => {
                          console.log('Post button clicked, content:', newPost);
                          handlePost();
                        }}
                        disabled={!newPost.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Posts Feed */}
              <div className="space-y-4">
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-xl bg-card border border-border">
                      <div className="flex gap-3 mb-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No posts yet. Be the first to share something!</p>
                  </div>
                ) : (
                  posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      className="p-5 rounded-xl bg-card border border-border hover:border-accent/30 transition-all"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      {/* Author */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          {post.author?.avatar_url ? (
                            <AvatarImage src={post.author.avatar_url} alt={post.author.full_name} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                            {post.author?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {post.author?.full_name || 'Unknown User'}
                            </span>
                            {post.is_question && (
                              <Badge variant="outline" className="text-xs">
                                <HelpCircle className="w-3 h-3 mr-1" />
                                Question
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-foreground mb-4">{post.content}</p>

                      {post.image_url && (
                        <div className="mb-4">
                          <img 
                            src={post.image_url} 
                            alt="Post image" 
                            className="rounded-lg max-h-80 w-full object-cover"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t border-border">
                        <button
                          className={`flex items-center gap-2 text-sm transition-colors ${
                            post.isLikedByMe ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                          }`}
                          onClick={() => toggleLike(post.id)}
                        >
                          <Heart className={`w-5 h-5 ${post.isLikedByMe ? 'fill-current' : ''}`} />
                          <span>{post.likes_count}</span>
                        </button>
                        <button 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                          onClick={() => toggleCommentsSection(post.id)}
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.comments?.length || 0}</span>
                        </button>
                        <button 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors ml-auto"
                          onClick={() => {
                            navigator.clipboard.writeText(`Check out this post on LiqLearns!`);
                            toast.success('Link copied!');
                          }}
                        >
                          <Share2 className="w-5 h-5" />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Comment Section */}
                      {expandedComments.includes(post.id) && (
                        <div className="mt-4 pt-3 border-t border-border">
                          {/* Existing Comments */}
                          {post.comments && post.comments.length > 0 && (
                            <div className="space-y-3 mb-4">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-2">
                                  <Avatar className="h-7 w-7 shrink-0">
                                    {comment.author?.avatar_url ? (
                                      <AvatarImage src={comment.author.avatar_url} alt={comment.author.full_name} />
                                    ) : null}
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                      {comment.author?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-foreground">
                                        {comment.author?.full_name || 'Unknown'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatTime(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Add Comment Input */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Write a comment..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                              className="flex-1"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                          {(!post.comments || post.comments.length === 0) && (
                            <p className="text-xs text-muted-foreground mt-2">Be the first to comment!</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Brain Bank Tab */}
          {activeTab === 'brainbank' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Questions & Answers</h2>
                <Button className="bg-gradient-accent text-accent-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Ask Question
                </Button>
              </div>
              {brainBankQuestions.map((q, i) => (
                <motion.div
                  key={q.id}
                  className="p-4 rounded-xl bg-card border border-border hover:border-accent/30 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <HelpCircle className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-2">{q.question}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {q.answers} answers
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {q.views} views
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Skills Voting Tab */}
          {activeTab === 'skills' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Skill Suggestions</h2>
                  <p className="text-sm text-muted-foreground">Vote on skills you want to learn!</p>
                </div>
                <Button 
                  className="bg-gradient-accent text-accent-foreground"
                  onClick={() => setShowSuggestForm(!showSuggestForm)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Suggest Skill
                </Button>
              </div>

              {/* Suggest New Skill Form */}
              {showSuggestForm && (
                <motion.div
                  className="p-4 rounded-xl bg-card border border-accent/30 mb-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <h3 className="font-medium text-foreground mb-3">Suggest a New Skill</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Your suggestion will be reviewed by admin before opening for community voting.
                  </p>
                  <div className="space-y-3">
                    <Input
                      placeholder="Skill name (e.g., Legal Terminology)"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Describe what this skill would cover..."
                      value={newSkillDesc}
                      onChange={(e) => setNewSkillDesc(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                      className="w-full p-2 rounded-md bg-background border border-border text-foreground"
                    >
                      {skillCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSuggestSkill}
                        className="bg-gradient-accent text-accent-foreground"
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Submit for Review
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowSuggestForm(false);
                          setNewSkillName('');
                          setNewSkillDesc('');
                          setNewSkillCategory('General');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* User's Pending Suggestions */}
              {mySuggestions.length > 0 && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Pending Suggestions</h3>
                  <div className="space-y-3">
                    {mySuggestions.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">{skill.name}</h4>
                              {getStatusBadge(skill.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{skill.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">Submitted {formatTime(skill.created_at)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSuggestion(skill.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Skill Suggestions List */}
              {suggestionsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="w-6 h-4" />
                        <Skeleton className="w-8 h-8 rounded" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))
              ) : suggestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Vote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No skill suggestions yet. Be the first to suggest one!</p>
                </div>
              ) : (
                suggestions.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    className="p-4 rounded-xl bg-card border border-border hover:border-accent/30 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Vote Buttons */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleVote(skill.id, 'up')}
                          disabled={skill.status !== 'voting'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            skill.myVote === 'up'
                              ? 'bg-accent/20 text-accent' 
                              : skill.status === 'voting'
                                ? 'hover:bg-accent/10 text-muted-foreground hover:text-accent'
                                : 'text-muted-foreground/50 cursor-not-allowed'
                          }`}
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                        <span className={`font-semibold ${skill.myVote ? 'text-accent' : 'text-foreground'}`}>
                          {skill.votes_up - skill.votes_down}
                        </span>
                        <button
                          onClick={() => handleVote(skill.id, 'down')}
                          disabled={skill.status !== 'voting'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            skill.myVote === 'down'
                              ? 'bg-destructive/20 text-destructive'
                              : skill.status === 'voting'
                                ? 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                                : 'text-muted-foreground/50 cursor-not-allowed'
                          }`}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Skill Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-foreground">{skill.name}</h3>
                          {getStatusBadge(skill.status)}
                          <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{skill.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Proposed by {skill.author?.full_name || 'Unknown'}</span>
                          {skill.status === 'voting' && skill.voting_ends_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getDaysLeft(skill.voting_ends_at)} days left
                            </span>
                          )}
                        </div>
                        {skill.status === 'voting' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress to approval</span>
                              <span className="text-accent">{Math.min(100, Math.round((skill.votes_up / 200) * 100))}%</span>
                            </div>
                            <Progress value={Math.min(100, (skill.votes_up / 200) * 100)} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Contributors */}
          <motion.div
            className="p-5 rounded-xl bg-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="font-display font-semibold text-foreground">Top Contributors</h3>
            </div>
            <div className="space-y-3">
              {topContributors.map((user, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-center font-medium text-muted-foreground">{i + 1}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      {user.name} {user.badge}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gold">{user.points.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trending Topics */}
          <motion.div
            className="p-5 rounded-xl bg-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-gold" />
              <h3 className="font-display font-semibold text-foreground">Trending Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['#Fidel', '#Greetings', '#Grammar', '#Culture', '#Vocabulary', '#Pronunciation'].map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                  {tag}
                </Badge>
              ))}
            </div>
          </motion.div>

          {/* AI Coach Promo */}
          <motion.div
            className="p-5 rounded-xl bg-gradient-hero text-primary-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-display font-semibold mb-2">AI Language Coach</h3>
            <p className="text-sm text-primary-foreground/80 mb-3">
              Get instant answers and personalized practice with our AI tutor!
            </p>
            <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
              Chat Now
            </Button>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Community;
