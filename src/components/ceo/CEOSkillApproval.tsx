import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Vote, 
  Check, 
  Sparkles,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { STAT_GRADIENTS } from '@/lib/theme';
import { formatDistanceToNow } from 'date-fns';

interface SkillSuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  votes_up: number;
  votes_down: number;
  voting_ends_at: string | null;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface CEOSkillApprovalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CEOSkillApproval = ({ open, onOpenChange }: CEOSkillApprovalProps) => {
  const { profile } = useProfile();
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillSuggestion | null>(null);

  const fetchVotedSkills = async () => {
    setLoading(true);
    try {
      // Fetch skills that are in voting status or have completed voting
      const { data, error } = await supabase
        .from('skill_suggestions')
        .select('*')
        .in('status', ['voting', 'approved', 'in_development'])
        .order('votes_up', { ascending: false });

      if (error) throw error;

      // Fetch author profiles
      const userIds = [...new Set(data?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const enrichedSuggestions = data?.map(s => ({
        ...s,
        author: profileMap.get(s.user_id)
      })) || [];

      setSuggestions(enrichedSuggestions);
    } catch (err) {
      console.error('Error fetching skills:', err);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchVotedSkills();
    }
  }, [open]);

  const handleApprove = async (skill: SkillSuggestion) => {
    if (!profile) return;
    setUpdating(skill.id);
    
    try {
      const { error } = await supabase
        .from('skill_suggestions')
        .update({
          status: 'approved',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || `Approved by CEO after community voting.`
        })
        .eq('id', skill.id);

      if (error) throw error;
      
      toast.success(`"${skill.name}" approved!`, {
        description: 'This skill will be added to the platform.'
      });
      
      fetchVotedSkills();
      setAdminNotes('');
      setSelectedSkill(null);
    } catch (err) {
      console.error('Error approving skill:', err);
      toast.error('Failed to approve skill');
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkInDevelopment = async (skill: SkillSuggestion) => {
    if (!profile) return;
    setUpdating(skill.id);
    
    try {
      const { error } = await supabase
        .from('skill_suggestions')
        .update({
          status: 'in_development',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || `Moved to development by CEO.`
        })
        .eq('id', skill.id);

      if (error) throw error;
      
      toast.success(`"${skill.name}" is now in development!`);
      fetchVotedSkills();
      setAdminNotes('');
      setSelectedSkill(null);
    } catch (err) {
      console.error('Error updating skill:', err);
      toast.error('Failed to update skill');
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (skill: SkillSuggestion) => {
    if (!profile) return;
    setUpdating(skill.id);
    
    try {
      const { error } = await supabase
        .from('skill_suggestions')
        .update({
          status: 'rejected',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || `Rejected by CEO.`
        })
        .eq('id', skill.id);

      if (error) throw error;
      
      toast.success(`"${skill.name}" has been rejected.`);
      fetchVotedSkills();
      setAdminNotes('');
      setSelectedSkill(null);
    } catch (err) {
      console.error('Error rejecting skill:', err);
      toast.error('Failed to reject skill');
    } finally {
      setUpdating(null);
    }
  };

  const getVotePercentage = (skill: SkillSuggestion) => {
    const total = skill.votes_up + skill.votes_down;
    if (total === 0) return 50;
    return Math.round((skill.votes_up / total) * 100);
  };

  const isVotingEnded = (skill: SkillSuggestion) => {
    if (!skill.voting_ends_at) return false;
    return new Date(skill.voting_ends_at) < new Date();
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const votingSkills = suggestions.filter(s => s.status === 'voting');
  const approvedSkills = suggestions.filter(s => s.status === 'approved' || s.status === 'in_development');

  if (!open) return null;

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
          className="bg-card rounded-2xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STAT_GRADIENTS[3]} flex items-center justify-center`}>
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">Skill Approval (CEO)</h2>
                <p className="text-sm text-muted-foreground">Review and approve community-voted skills</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={fetchVotedSkills} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Voting Skills - Ready for CEO Decision */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Vote className="w-4 h-4" />
                    Ready for Your Decision ({votingSkills.length})
                  </h3>
                  
                  {votingSkills.length === 0 ? (
                    <div className="bg-muted/30 rounded-xl p-6 text-center">
                      <Vote className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">No skills currently in voting</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {votingSkills.map((skill, i) => {
                        const votePercent = getVotePercentage(skill);
                        const votingEnded = isVotingEnded(skill);
                        
                        return (
                          <motion.div
                            key={skill.id}
                            className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="flex items-start gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={skill.author?.avatar_url || undefined} />
                                <AvatarFallback className={`bg-gradient-to-br ${STAT_GRADIENTS[i % 4]} text-white text-sm font-bold`}>
                                  {skill.author?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-medium text-foreground">{skill.name}</h4>
                                  <Badge variant="secondary" className="text-xs">{skill.category}</Badge>
                                  {votingEnded && (
                                    <Badge className="bg-gold/10 text-gold border-gold/30">Voting Ended</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{skill.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  by {skill.author?.full_name || 'Anonymous'} • {formatTime(skill.created_at)}
                                </p>
                                
                                {/* Vote Stats */}
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <ThumbsUp className="w-4 h-4 text-success" />
                                      <span className="text-success font-medium">{skill.votes_up}</span>
                                    </div>
                                    <span className={`font-medium ${votePercent >= 60 ? 'text-success' : votePercent >= 40 ? 'text-gold' : 'text-destructive'}`}>
                                      {votePercent}% positive
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-destructive font-medium">{skill.votes_down}</span>
                                      <ThumbsDown className="w-4 h-4 text-destructive" />
                                    </div>
                                  </div>
                                  <Progress value={votePercent} className="h-2" />
                                </div>
                                
                                {skill.voting_ends_at && (
                                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Voting {votingEnded ? 'ended' : 'ends'} {formatTime(skill.voting_ends_at)}
                                  </p>
                                )}
                              </div>
                              
                              {/* Actions */}
                              <div className="flex flex-col gap-2 shrink-0">
                                <Button 
                                  size="sm"
                                  className="gap-1 bg-success hover:bg-success/90"
                                  onClick={() => handleApprove(skill)}
                                  disabled={updating === skill.id}
                                >
                                  {updating === skill.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  Approve
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleMarkInDevelopment(skill)}
                                  disabled={updating === skill.id}
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Develop
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleReject(skill)}
                                  disabled={updating === skill.id}
                                >
                                  <X className="w-4 h-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Approved / In Development */}
                {approvedSkills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Approved & In Development ({approvedSkills.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {approvedSkills.map((skill, i) => (
                        <div
                          key={skill.id}
                          className="bg-muted/30 rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground text-sm">{skill.name}</h4>
                            <Badge 
                              className={skill.status === 'approved' 
                                ? 'bg-success/10 text-success border-success/30' 
                                : 'bg-primary/10 text-primary border-primary/30'
                              }
                            >
                              {skill.status === 'approved' ? 'Approved' : 'In Development'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{skill.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <ThumbsUp className="w-3 h-3 text-success" />
                            <span>{skill.votes_up}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CEOSkillApproval;
