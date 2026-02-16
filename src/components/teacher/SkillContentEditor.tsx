import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkills, SkillLevel } from '@/hooks/useSkillTree';
import { useTeacherContributions, SkillProposal, ProposalComment } from '@/hooks/useTeacherContributions';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft, BookOpen, ChevronRight, Edit, Eye, MessageSquare, Send,
  Star, ThumbsUp, ThumbsDown, Trophy, Zap, Coins, Plus, FileText, X,
  Link2, PenTool, ExternalLink, CheckCircle2, Shield,
} from 'lucide-react';
import { toast } from 'sonner';

const SkillContentEditor = () => {
  const { categories, skills, loading: skillsLoading, selectedCategory, setSelectedCategory, fetchSkillLevels } = useSkills();
  const {
    proposals, myProposals, totalPoints, approvalThreshold,
    loading: contribLoading, createProposal, voteOnProposal, addComment, fetchComments, fetchVotes, editProposalContent, refresh
  } = useTeacherContributions();
  const { profile } = useProfile();
  const { userRole } = useAuth();

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [levels, setLevels] = useState<SkillLevel[]>([]);
  const [view, setView] = useState<'browse' | 'edit' | 'review' | 'senior_edit'>('browse');
  const [editingLevel, setEditingLevel] = useState<SkillLevel | null>(null);

  // Editor state
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [proposalResources, setProposalResources] = useState<{ type: string; title: string; data: string }[]>([]);
  const [contributorComment, setContributorComment] = useState('');
  const [sourceLinks, setSourceLinks] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  // Review state
  const [reviewingProposal, setReviewingProposal] = useState<SkillProposal | null>(null);
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [myVote, setMyVote] = useState<'approve' | 'reject' | null>(null);
  const [voteComment, setVoteComment] = useState('');

  // Senior Teacher edit state
  const [seniorEditContent, setSeniorEditContent] = useState('');
  const [seniorEditTitle, setSeniorEditTitle] = useState('');
  const [seniorEditing, setSeniorEditing] = useState(false);

  const isSeniorTeacher = userRole === 'ceo' || userRole === 'admin';
  const handleSelectSkill = async (skillId: string) => {
    setSelectedSkill(skillId);
    const data = await fetchSkillLevels(skillId);
    setLevels(data);
  };

  const handleEditLevel = (level: SkillLevel) => {
    setEditingLevel(level);
    setProposalTitle(level.title);
    setProposalDesc(level.description || '');
    setProposalContent(level.content ? JSON.stringify(level.content, null, 2) : '');
    setProposalResources([]);
    setContributorComment('');
    setSourceLinks(['']);
    setView('edit');
  };

  const handleSubmitProposal = async () => {
    if (!editingLevel || !proposalTitle.trim()) {
      toast.error('Please fill in the title');
      return;
    }
    setSubmitting(true);
    const content = {
      text: proposalContent,
      resources: proposalResources,
    };
    const validLinks = sourceLinks.filter(l => l.trim());
    await createProposal(editingLevel.id, proposalTitle, proposalDesc, content, contributorComment, validLinks);
    setSubmitting(false);
    setView('browse');
    setEditingLevel(null);
  };

  const handleReviewProposal = async (proposal: SkillProposal) => {
    setReviewingProposal(proposal);
    const [commentsData, votesData] = await Promise.all([
      fetchComments(proposal.id),
      fetchVotes(proposal.id),
    ]);
    setComments(commentsData);
    const myExistingVote = votesData.find(v => v.voter_id === profile?.id);
    setMyVote(myExistingVote?.vote || null);
    setView('review');
  };

  const handleVote = async (vote: 'approve' | 'reject') => {
    if (!reviewingProposal) return;
    await voteOnProposal(reviewingProposal.id, vote, voteComment || undefined);
    setMyVote(vote);
    setVoteComment('');
  };

  const handleAddComment = async () => {
    if (!reviewingProposal || !newComment.trim()) return;
    await addComment(reviewingProposal.id, newComment);
    const updated = await fetchComments(reviewingProposal.id);
    setComments(updated);
    setNewComment('');
  };

  const addResource = () => {
    setProposalResources(prev => [...prev, { type: 'text', title: '', data: '' }]);
  };

  const removeResource = (index: number) => {
    setProposalResources(prev => prev.filter((_, i) => i !== index));
  };

  const updateResource = (index: number, field: string, value: string) => {
    setProposalResources(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const loading = skillsLoading || contribLoading;
  const selectedSkillData = skills.find(s => s.id === selectedSkill);

  // Review view
  if (view === 'review' && reviewingProposal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView('browse'); setReviewingProposal(null); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Review Proposal</h2>
            <p className="text-sm text-muted-foreground">by {reviewingProposal.author?.full_name || 'Unknown'}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent">{totalPoints} pts</span>
          </div>
        </div>

        {/* Proposal details */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{reviewingProposal.skill_level?.skill?.icon}</span>
            <Badge variant="outline" className="text-xs">
              {reviewingProposal.skill_level?.skill?.name} — Level {reviewingProposal.skill_level?.level_number}
            </Badge>
          </div>
          <h3 className="font-semibold text-foreground">{reviewingProposal.proposed_title}</h3>
          {reviewingProposal.proposed_description && (
            <p className="text-sm text-muted-foreground">{reviewingProposal.proposed_description}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-accent">
              <ThumbsUp className="w-4 h-4" /> {reviewingProposal.review_votes_up}
            </span>
            <span className="flex items-center gap-1 text-destructive">
              <ThumbsDown className="w-4 h-4" /> {reviewingProposal.review_votes_down}
            </span>
            <span className="text-muted-foreground">Need {approvalThreshold} approvals</span>
          </div>
          {reviewingProposal.proposed_content && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {typeof reviewingProposal.proposed_content === 'object' 
                ? (reviewingProposal.proposed_content as any).text || JSON.stringify(reviewingProposal.proposed_content, null, 2)
                : String(reviewingProposal.proposed_content)}
            </div>
          )}

          {/* Contributor's Comment */}
          {(reviewingProposal as any).contributor_comment && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 space-y-1">
              <h4 className="text-xs font-medium text-accent flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Contributor's Comment
              </h4>
              <p className="text-sm text-foreground">{(reviewingProposal as any).contributor_comment}</p>
            </div>
          )}

          {/* Source Links */}
          {(reviewingProposal as any).source_links?.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Link2 className="w-3 h-3" /> References
              </h4>
              <div className="flex flex-wrap gap-2">
                {((reviewingProposal as any).source_links as string[]).map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                    <ExternalLink className="w-3 h-3" /> {new URL(link).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Edited content indicator */}
          {(reviewingProposal as any).edited_content && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
              <h4 className="text-xs font-medium text-primary flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Edited by Senior Teacher
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {typeof (reviewingProposal as any).edited_content === 'object'
                  ? ((reviewingProposal as any).edited_content as any).text || JSON.stringify((reviewingProposal as any).edited_content, null, 2)
                  : String((reviewingProposal as any).edited_content)}
              </div>
            </div>
          )}
        </div>

        {/* Senior Teacher Edit Button */}
        {isSeniorTeacher && (
          <div className="bg-card rounded-xl border-2 border-primary/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Senior Teacher Tools</h4>
                  <p className="text-xs text-muted-foreground">Edit to match platform brand & standards (+8 pts)</p>
                </div>
              </div>
              <Button size="sm" onClick={() => {
                const content = (reviewingProposal as any).edited_content || reviewingProposal.proposed_content;
                setSeniorEditTitle(reviewingProposal.proposed_title);
                setSeniorEditContent(typeof content === 'object' ? (content as any).text || JSON.stringify(content, null, 2) : String(content));
                setView('senior_edit');
              }}>
                <PenTool className="w-4 h-4 mr-1" /> Edit Content
              </Button>
            </div>
          </div>
        )}

        {/* Vote */}
        {reviewingProposal.author_id !== profile?.id && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h4 className="font-medium text-foreground text-sm">Your Vote</h4>
            <Textarea
              placeholder="Optional: Add a reason for your vote..."
              value={voteComment}
              onChange={e => setVoteComment(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={myVote === 'approve' ? 'default' : 'outline'}
                onClick={() => handleVote('approve')}
                className="flex-1"
              >
                <ThumbsUp className="w-4 h-4 mr-1" /> Approve (+2 pts)
              </Button>
              <Button
                size="sm"
                variant={myVote === 'reject' ? 'destructive' : 'outline'}
                onClick={() => handleVote('reject')}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h4 className="font-medium text-foreground text-sm flex items-center gap-1">
            <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  {c.author?.avatar_url && <AvatarImage src={c.author.avatar_url} />}
                  <AvatarFallback className="text-[10px]">{c.author?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium text-foreground">{c.author?.full_name}</span>
                  <p className="text-muted-foreground">{c.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment... (+3 pts)"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              className="text-sm h-8"
            />
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Senior Teacher Edit view
  if (view === 'senior_edit' && reviewingProposal) {
    const handleSeniorSave = async () => {
      setSeniorEditing(true);
      const editedContent = { text: seniorEditContent };
      await editProposalContent(reviewingProposal.id, editedContent, seniorEditTitle);
      setSeniorEditing(false);
      setView('review');
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView('review')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Senior Teacher Edit
            </h2>
            <p className="text-sm text-muted-foreground">Rewrite content to match platform brand & standards</p>
          </div>
        </div>

        {/* Original contributor info */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-accent">Original by {reviewingProposal.author?.full_name}</p>
          {(reviewingProposal as any).contributor_comment && (
            <p className="text-xs text-muted-foreground italic">"{(reviewingProposal as any).contributor_comment}"</p>
          )}
          {(reviewingProposal as any).source_links?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {((reviewingProposal as any).source_links as string[]).map((link: string, i: number) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5 bg-muted/50 px-1.5 py-0.5 rounded">
                  <ExternalLink className="w-2.5 h-2.5" /> Source {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border-2 border-primary/30 p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input value={seniorEditTitle} onChange={e => setSeniorEditTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Content (Full Rewrite Authority)</label>
            <Textarea
              value={seniorEditContent}
              onChange={e => setSeniorEditContent(e.target.value)}
              rows={12}
              className="mt-1 font-mono text-sm"
              placeholder="Rewrite the content to match the platform's brand, tone, and quality standards..."
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setView('review')}>Cancel</Button>
          <Button onClick={handleSeniorSave} disabled={seniorEditing || !seniorEditContent.trim()}>
            <PenTool className="w-4 h-4 mr-1" />
            {seniorEditing ? 'Saving...' : 'Save Edited Content (+8 pts)'}
          </Button>
        </div>
      </div>
    );
  }

  // Edit view
  if (view === 'edit' && editingLevel) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView('browse'); setEditingLevel(null); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Create Content Proposal</h2>
            <p className="text-sm text-muted-foreground">Level {editingLevel.level_number}: {editingLevel.title}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input value={proposalTitle} onChange={e => setProposalTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea value={proposalDesc} onChange={e => setProposalDesc(e.target.value)} rows={2} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Lesson Content</label>
            <Textarea
              value={proposalContent}
              onChange={e => setProposalContent(e.target.value)}
              rows={8}
              className="mt-1 font-mono text-sm"
              placeholder="Write the lesson content here... You can use markdown formatting."
            />
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Resources</label>
              <Button size="sm" variant="outline" onClick={addResource}>
                <Plus className="w-3 h-3 mr-1" /> Add Resource
              </Button>
            </div>
            <div className="space-y-2">
              {proposalResources.map((res, i) => (
                <div key={i} className="flex gap-2 items-start bg-muted/30 rounded-lg p-2">
                  <Select value={res.type} onValueChange={v => updateResource(i, 'type', v)}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="video">Video URL</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="flashcard">Flashcard</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Title"
                    value={res.title}
                    onChange={e => updateResource(i, 'title', e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    placeholder="Content / URL"
                    value={res.data}
                    onChange={e => updateResource(i, 'data', e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeResource(i)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Contributor Comment */}
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Your Comment
            </label>
            <Textarea
              value={contributorComment}
              onChange={e => setContributorComment(e.target.value)}
              rows={3}
              className="mt-1 text-sm"
              placeholder="Explain why this content is valuable, what makes it accurate, and any context for reviewers..."
            />
          </div>

          {/* Source Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Source Links / References
              </label>
              <Button size="sm" variant="outline" onClick={() => setSourceLinks(prev => [...prev, ''])}>
                <Plus className="w-3 h-3 mr-1" /> Add Link
              </Button>
            </div>
            <div className="space-y-2">
              {sourceLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="https://example.com/source-article"
                    value={link}
                    onChange={e => {
                      const updated = [...sourceLinks];
                      updated[i] = e.target.value;
                      setSourceLinks(updated);
                    }}
                    className="h-8 text-xs flex-1"
                  />
                  {sourceLinks.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setSourceLinks(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => { setView('browse'); setEditingLevel(null); }}>Cancel</Button>
          <Button onClick={handleSubmitProposal} disabled={submitting || !proposalTitle.trim()}>
            {submitting ? 'Submitting...' : 'Submit for Review (+5 pts)'}
          </Button>
        </div>
      </div>
    );
  }

  // Browse view
  return (
    <div className="space-y-4">
      {/* Points banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(selectedCategory || selectedSkill) && (
            <Button variant="ghost" size="icon" onClick={() => {
              if (selectedSkill) { setSelectedSkill(null); setLevels([]); }
              else setSelectedCategory(null);
            }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" />
            {selectedSkillData ? selectedSkillData.name : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Skill Content Editor'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent">{totalPoints} pts</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setView('browse')}>
            <Eye className="w-4 h-4 mr-1" /> Review Queue ({proposals.filter(p => p.author_id !== profile?.id).length})
          </Button>
        </div>
      </div>

      {/* Pending proposals to review */}
      {proposals.filter(p => p.author_id !== profile?.id).length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-3">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
            <FileText className="w-4 h-4 text-accent" /> Proposals to Review
          </h4>
          <div className="space-y-1.5">
            {proposals.filter(p => p.author_id !== profile?.id).slice(0, 5).map(p => (
              <button
                key={p.id}
                onClick={() => handleReviewProposal(p)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <span className="text-lg">{p.skill_level?.skill?.icon || '📚'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.proposed_title}</p>
                  <p className="text-xs text-muted-foreground">by {p.author?.full_name} • {p.review_votes_up}/{approvalThreshold} approvals</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : selectedSkill && selectedSkillData ? (
        /* Skill levels */
        <div className="space-y-3">
          {levels.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No levels yet. Be the first to propose content!</p>
            </div>
          ) : (
            levels.map(level => (
              <div key={level.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                  {level.level_number}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">{level.title}</h4>
                  <p className="text-xs text-muted-foreground">{level.description || `Level ${level.level_number}`}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Coins className="w-3 h-3" /> {level.coin_cost}</span>
                    <span>+{level.xp_reward} XP</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEditLevel(level)}>
                  <Edit className="w-3.5 h-3.5 mr-1" /> Propose Content
                </Button>
              </div>
            ))
          )}
        </div>
      ) : selectedCategory ? (
        /* Skills in category */
        <div className="grid md:grid-cols-2 gap-3">
          {skills.filter(s => s.category_id === selectedCategory).map(skill => (
            <button
              key={skill.id}
              onClick={() => handleSelectSkill(skill.id)}
              className="p-4 rounded-xl bg-card border border-border hover:border-accent transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{skill.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors text-sm">{skill.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{skill.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Categories */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="p-5 rounded-xl bg-card border border-border hover:border-accent transition-all text-left group"
            >
              <span className="text-3xl mb-2 block">{cat.icon}</span>
              <h3 className="font-display font-bold text-foreground group-hover:text-accent transition-colors">{cat.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* My proposals */}
      {myProposals.length > 0 && !selectedSkill && !selectedCategory && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground mb-2">My Proposals</h3>
          <div className="space-y-2">
            {myProposals.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                <span className="text-lg">{p.skill_level?.skill?.icon || '📚'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.proposed_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.skill_level?.skill?.name} L{p.skill_level?.level_number} • {p.review_votes_up}/{approvalThreshold} votes
                  </p>
                </div>
                <Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillContentEditor;
