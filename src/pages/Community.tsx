import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
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
  X
} from 'lucide-react';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  time: string;
}

const posts = [
  {
    id: 1,
    author: 'Sara M.',
    avatar: 'S',
    role: 'Top Contributor',
    content: 'Just completed my 30-day streak! 🔥 The daily consistency really pays off. My reading comprehension has improved so much!',
    likes: 45,
    comments: [
      { id: 1, author: 'Daniel K.', avatar: 'D', content: 'Amazing progress! Keep it up! 🎉', time: '1 hour ago' },
      { id: 2, author: 'Meron A.', avatar: 'M', content: 'Inspiring! I\'m on day 15 now.', time: '45 min ago' },
    ] as Comment[],
    time: '2 hours ago',
    isLiked: false,
  },
  {
    id: 2,
    author: 'Daniel K.',
    avatar: 'D',
    role: 'Language Expert',
    content: 'Quick tip for everyone learning Fidel: Try associating each character with a word you already know. It makes memorization so much easier! 📚',
    likes: 89,
    comments: [
      { id: 1, author: 'Sara M.', avatar: 'S', content: 'This helped me so much!', time: '3 hours ago' },
      { id: 2, author: 'Teacher Hana', avatar: 'H', content: 'Great advice Daniel!', time: '2 hours ago' },
    ] as Comment[],
    time: '4 hours ago',
    isLiked: true,
    image: '💡',
  },
  {
    id: 3,
    author: 'Meron A.',
    avatar: 'M',
    content: 'Can anyone help me understand the difference between ገ and ጌ? I keep mixing them up 😅',
    likes: 15,
    comments: [
      { id: 1, author: 'Daniel K.', avatar: 'D', content: 'ገ is "ge" and ጌ is "gé" - the second has a longer vowel sound!', time: '5 hours ago' },
    ] as Comment[],
    time: '6 hours ago',
    isLiked: false,
    isQuestion: true,
  },
  {
    id: 4,
    author: 'Teacher Hana',
    avatar: 'H',
    role: 'Certified Instructor',
    content: 'New lesson alert! 🎉 I just uploaded a comprehensive guide on Ethiopian greetings for different times of the day. Check it out in the courses section!',
    likes: 127,
    comments: [
      { id: 1, author: 'Sara M.', avatar: 'S', content: 'Can\'t wait to check it out!', time: '7 hours ago' },
      { id: 2, author: 'Meron A.', avatar: 'M', content: 'This is exactly what I needed!', time: '6 hours ago' },
    ] as Comment[],
    time: '8 hours ago',
    isLiked: true,
  },
];

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

// Skill voting data
const skillSuggestions = [
  {
    id: 1,
    skill: 'Business Amharic',
    description: 'Professional vocabulary and communication for business settings',
    proposedBy: 'Daniel K.',
    votes: 156,
    status: 'voting' as const,
    daysLeft: 5,
    category: 'Professional',
  },
  {
    id: 2,
    skill: 'Medical Terminology',
    description: 'Healthcare and medical vocabulary for professionals',
    proposedBy: 'Dr. Abebe',
    votes: 98,
    status: 'voting' as const,
    daysLeft: 12,
    category: 'Professional',
  },
  {
    id: 3,
    skill: 'Ethiopian History',
    description: 'Learn vocabulary related to Ethiopian history and culture',
    proposedBy: 'Teacher Hana',
    votes: 234,
    status: 'approved' as const,
    category: 'Culture',
  },
  {
    id: 4,
    skill: 'Poetry & Literature',
    description: 'Classical and modern Ethiopian poetry vocabulary',
    proposedBy: 'Meron A.',
    votes: 67,
    status: 'voting' as const,
    daysLeft: 8,
    category: 'Culture',
  },
  {
    id: 5,
    skill: 'Tech & Digital',
    description: 'Modern technology and digital communication terms',
    proposedBy: 'Yonas T.',
    votes: 189,
    status: 'in_development' as const,
    category: 'Modern',
  },
];

interface Post {
  id: number;
  author: string;
  avatar: string;
  role?: string;
  content: string;
  likes: number;
  comments: Comment[];
  time: string;
  isLiked: boolean;
  image?: string;
  isQuestion?: boolean;
}

const Community = () => {
  const [activeTab, setActiveTab] = useState<'wall' | 'brainbank' | 'skills'>('wall');
  const [newPost, setNewPost] = useState('');
  const [communityPosts, setCommunityPosts] = useState<Post[]>(posts);
  const [likedPosts, setLikedPosts] = useState<number[]>([2, 4]);
  const [votedSkills, setVotedSkills] = useState<number[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setLikedPosts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    // Update post likes count
    setCommunityPosts(prev => prev.map(post => 
      post.id === id 
        ? { ...post, likes: likedPosts.includes(id) ? post.likes - 1 : post.likes + 1 }
        : post
    ));
    toast.success(likedPosts.includes(id) ? 'Unliked' : 'Liked!');
  };

  const handleComment = (postId: number) => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;
    
    const newComment: Comment = {
      id: Date.now(),
      author: 'You',
      avatar: 'Y',
      content: comment,
      time: 'Just now',
    };
    
    setCommunityPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
    ));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    toast.success('Comment added!');
  };

  const toggleComments = (postId: number) => {
    setExpandedComments(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleVote = (skillId: number, direction: 'up' | 'down') => {
    if (votedSkills.includes(skillId)) {
      toast.info('Already voted', { description: 'You have already voted on this skill suggestion.' });
      return;
    }
    setVotedSkills(prev => [...prev, skillId]);
    toast.success(direction === 'up' ? 'Upvoted!' : 'Downvoted!', { 
      description: 'Your vote has been recorded.' 
    });
  };

  const handleSuggestSkill = () => {
    if (!newSkillName.trim() || !newSkillDesc.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Skill suggested!', { 
      description: 'Your skill suggestion has been submitted for community voting.' 
    });
    setNewSkillName('');
    setNewSkillDesc('');
    setShowSuggestForm(false);
  };

  const handlePost = () => {
    if (!newPost.trim()) {
      return;
    }
    const newPostObj: Post = {
      id: Date.now(),
      author: 'You',
      avatar: 'Y',
      content: newPost,
      likes: 0,
      comments: [],
      time: 'Just now',
      isLiked: false,
    };
    setCommunityPosts(prev => [newPostObj, ...prev]);
    toast.success('Post created!', { description: 'Your post has been shared with the community.' });
    setNewPost('');
  };

  const getStatusBadge = (status: 'voting' | 'approved' | 'in_development') => {
    switch (status) {
      case 'voting':
        return <Badge variant="secondary" className="bg-accent/20 text-accent"><Vote className="w-3 h-3 mr-1" />Voting</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-success/20 text-success"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
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
                {communityPosts.map((post, i) => (
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
                        <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                          {post.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{post.author}</span>
                          {post.role && (
                            <Badge variant="secondary" className="text-xs">
                              {post.role}
                            </Badge>
                          )}
                          {post.isQuestion && (
                            <Badge variant="outline" className="text-xs">
                              <HelpCircle className="w-3 h-3 mr-1" />
                              Question
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{post.time}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-foreground mb-4">{post.content}</p>

                    {post.image && (
                      <div className="text-6xl text-center py-4 bg-muted rounded-lg mb-4">
                        {post.image}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-3 border-t border-border">
                      <button
                        className={`flex items-center gap-2 text-sm transition-colors ${
                          likedPosts.includes(post.id) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                        }`}
                        onClick={() => toggleLike(post.id)}
                      >
                        <Heart className={`w-5 h-5 ${likedPosts.includes(post.id) ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      <button 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments.length}</span>
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
                        {post.comments.length > 0 && (
                          <div className="space-y-3 mb-4">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-2">
                                <Avatar className="h-7 w-7 shrink-0">
                                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                    {comment.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{comment.author}</span>
                                    <span className="text-xs text-muted-foreground">{comment.time}</span>
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
                        {post.comments.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-2">Be the first to comment!</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
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
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSuggestSkill}
                        className="bg-gradient-accent text-accent-foreground"
                      >
                        Submit Suggestion
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowSuggestForm(false);
                          setNewSkillName('');
                          setNewSkillDesc('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Skill Suggestions List */}
              {skillSuggestions.map((skill, i) => (
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
                        disabled={votedSkills.includes(skill.id) || skill.status !== 'voting'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          votedSkills.includes(skill.id) 
                            ? 'bg-accent/20 text-accent' 
                            : skill.status === 'voting'
                              ? 'hover:bg-accent/10 text-muted-foreground hover:text-accent'
                              : 'text-muted-foreground/50 cursor-not-allowed'
                        }`}
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <span className={`font-semibold ${votedSkills.includes(skill.id) ? 'text-accent' : 'text-foreground'}`}>
                        {skill.votes + (votedSkills.includes(skill.id) ? 1 : 0)}
                      </span>
                      <button
                        onClick={() => handleVote(skill.id, 'down')}
                        disabled={votedSkills.includes(skill.id) || skill.status !== 'voting'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          skill.status === 'voting' && !votedSkills.includes(skill.id)
                            ? 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                            : 'text-muted-foreground/50 cursor-not-allowed'
                        }`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Skill Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{skill.skill}</h3>
                        {getStatusBadge(skill.status)}
                        <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{skill.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Proposed by {skill.proposedBy}</span>
                        {skill.status === 'voting' && skill.daysLeft && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {skill.daysLeft} days left
                          </span>
                        )}
                      </div>
                      {skill.status === 'voting' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress to approval</span>
                            <span className="text-accent">{Math.min(100, Math.round((skill.votes / 200) * 100))}%</span>
                          </div>
                          <Progress value={Math.min(100, (skill.votes / 200) * 100)} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
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
