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

const posts = [
  {
    id: 1,
    author: 'Sara M.',
    avatar: 'S',
    role: 'Top Contributor',
    content: 'Just completed my 30-day streak! 🔥 The daily consistency really pays off. My reading comprehension has improved so much!',
    likes: 45,
    comments: 12,
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
    comments: 23,
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
    comments: 8,
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
    comments: 34,
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

const Community = () => {
  const [activeTab, setActiveTab] = useState<'wall' | 'brainbank' | 'skills'>('wall');
  const [newPost, setNewPost] = useState('');
  const [likedPosts, setLikedPosts] = useState<number[]>([2, 4]);
  const [votedSkills, setVotedSkills] = useState<number[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [showSuggestForm, setShowSuggestForm] = useState(false);

  const toggleLike = (id: number) => {
    setLikedPosts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
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
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          variant={activeTab === 'wall' ? 'default' : 'outline'}
          className={activeTab === 'wall' ? 'bg-gradient-accent text-accent-foreground' : ''}
          onClick={() => setActiveTab('wall')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Community Wall
        </Button>
        <Button
          variant={activeTab === 'brainbank' ? 'default' : 'outline'}
          className={activeTab === 'brainbank' ? 'bg-gradient-accent text-accent-foreground' : ''}
          onClick={() => setActiveTab('brainbank')}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Brain Bank
        </Button>
        <Button
          variant={activeTab === 'skills' ? 'default' : 'outline'}
          className={activeTab === 'skills' ? 'bg-gradient-accent text-accent-foreground' : ''}
          onClick={() => setActiveTab('skills')}
        >
          <Vote className="w-4 h-4 mr-2" />
          Skill Voting
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
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
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[80px] mb-3"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Image className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Smile className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </div>
                      <Button 
                        className="bg-gradient-accent text-accent-foreground hover:opacity-90"
                        onClick={handlePost}
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
                {posts.map((post, i) => (
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
                        <span>{post.likes + (likedPosts.includes(post.id) && !post.isLiked ? 1 : 0)}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors ml-auto">
                        <Share2 className="w-5 h-5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'brainbank' && (
            <>
              {/* Search */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input placeholder="Search the knowledge base..." className="pl-10" />
                  </div>
                  <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Ask Question
                  </Button>
                </div>
              </motion.div>

              {/* Questions */}
              <div className="space-y-4">
                {brainBankQuestions.map((q, i) => (
                  <motion.div
                    key={q.id}
                    className="p-5 rounded-xl bg-card border border-border hover:border-accent/30 transition-all cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-2 hover:text-accent transition-colors">
                          {q.question}
                        </h3>
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
              </div>
            </>
          )}

          {activeTab === 'skills' && (
            <>
              {/* Suggest New Skill Button */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {!showSuggestForm ? (
                  <Button 
                    className="bg-gradient-accent text-accent-foreground hover:opacity-90 w-full"
                    onClick={() => setShowSuggestForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Suggest New Skill
                  </Button>
                ) : (
                  <div className="p-4 rounded-xl bg-card border border-border">
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
                          className="bg-gradient-accent text-accent-foreground"
                          onClick={handleSuggestSkill}
                        >
                          Submit Suggestion
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowSuggestForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Info Banner */}
              <motion.div
                className="p-4 rounded-xl bg-accent/10 border border-accent/20 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Community-Driven Learning</h4>
                    <p className="text-sm text-muted-foreground">
                      Vote on skill suggestions to shape what we teach next! Skills with 200+ votes get approved for development.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Skill Suggestions */}
              <div className="space-y-4">
                {skillSuggestions.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    className="p-5 rounded-xl bg-card border border-border hover:border-accent/30 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Voting Controls */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleVote(skill.id, 'up')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            votedSkills.includes(skill.id)
                              ? 'bg-success/20 text-success'
                              : 'bg-muted hover:bg-success/20 hover:text-success'
                          }`}
                          disabled={votedSkills.includes(skill.id)}
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                        <span className={`font-bold text-lg ${
                          skill.votes >= 200 ? 'text-success' : 
                          skill.votes >= 100 ? 'text-gold' : 'text-foreground'
                        }`}>
                          {skill.votes}
                        </span>
                        <button
                          onClick={() => handleVote(skill.id, 'down')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            votedSkills.includes(skill.id)
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-muted hover:bg-destructive/20 hover:text-destructive'
                          }`}
                          disabled={votedSkills.includes(skill.id)}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-display font-semibold text-foreground">
                            {skill.skill}
                          </h3>
                          {getStatusBadge(skill.status)}
                          <Badge variant="outline" className="text-xs">
                            {skill.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {skill.description}
                        </p>
                        
                        {/* Progress to approval */}
                        {skill.status === 'voting' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>{skill.votes} / 200 votes for approval</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {skill.daysLeft} days left
                              </span>
                            </div>
                            <Progress value={(skill.votes / 200) * 100} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Proposed by <span className="font-medium text-foreground">{skill.proposedBy}</span></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
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
