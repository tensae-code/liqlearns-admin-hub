import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  UserPlus, 
  UserMinus,
  Zap, 
  Flame, 
  Phone,
  Video,
  Flag,
  Loader2,
  Trophy,
  Swords,
  Award,
  UserCheck,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  xp_points?: number;
  current_streak?: number;
  country?: string;
}

interface ProfilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData | null;
  onStartChat?: (userId: string) => void;
  onCall?: (userId: string) => void;
  onVideoCall?: (userId: string) => void;
  onReport?: (userId: string) => void;
}

interface BattleRank {
  wins: number;
  losses: number;
  rank_points: number;
  total_battles: number;
  best_streak: number;
  category: string;
}

interface EarnedBadge {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string | null;
}

const getRankTier = (points: number) => {
  if (points >= 2000) return { name: 'Grandmaster', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
  if (points >= 1500) return { name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/20' };
  if (points >= 1000) return { name: 'Platinum', color: 'text-emerald-400', bg: 'bg-emerald-400/20' };
  if (points >= 700) return { name: 'Gold', color: 'text-amber-400', bg: 'bg-amber-400/20' };
  if (points >= 400) return { name: 'Silver', color: 'text-slate-300', bg: 'bg-slate-300/20' };
  return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/20' };
};

const ProfilePreviewModal = ({
  open,
  onOpenChange,
  profile,
  onStartChat,
  onCall,
  onVideoCall,
  onReport,
}: ProfilePreviewModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [canMessage, setCanMessage] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [battleRank, setBattleRank] = useState<BattleRank | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);

  useEffect(() => {
    if (open && profile && user) {
      fetchProfileData();
    }
  }, [open, profile, user]);

  const fetchProfileData = async () => {
    if (!profile || !user) return;

    try {
      setLoading(true);

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (myProfile) {
        setMyProfileId(myProfile.id);

        // Parallel queries for social data
        const [followRes, friendRes, canMsgRes, pendingRes] = await Promise.all([
          supabase.from('follows').select('id').eq('follower_id', myProfile.id).eq('following_id', profile.id).single(),
          supabase.from('friendships').select('id, status, requester_id').or(
            `and(requester_id.eq.${myProfile.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${myProfile.id})`
          ).single(),
          supabase.rpc('can_message', { sender_profile_id: myProfile.id, receiver_profile_id: profile.id }),
          supabase.from('message_requests').select('id').eq('sender_id', myProfile.id).eq('receiver_id', profile.id).eq('status', 'pending'),
        ]);

        setIsFollowing(!!followRes.data);
        setCanMessage(!!canMsgRes.data);
        setPendingRequestCount(pendingRes.data?.length || 0);

        if (friendRes.data) {
          const f = friendRes.data as any;
          if (f.status === 'accepted') {
            setFriendshipStatus('accepted');
          } else if (f.status === 'pending') {
            setFriendshipStatus(f.requester_id === myProfile.id ? 'pending_sent' : 'pending_received');
          }
        } else {
          setFriendshipStatus('none');
        }
      }

      // Parallel queries for counts, battle rank, and badges
      const [followersRes, followingRes, rankRes, badgesRes] = await Promise.all([
        supabase.from('follows').select('id').eq('following_id', profile.id),
        supabase.from('follows').select('id').eq('follower_id', profile.id),
        supabase.from('battle_rankings').select('*').eq('entity_id', profile.id).eq('entity_type', 'individual').eq('category', 'overall').single(),
        supabase.from('user_badges').select('id, badges(id, name, icon, category, description)').eq('user_id', profile.id).limit(10),
      ]);

      setFollowerCount(followersRes.data?.length || 0);
      setFollowingCount(followingRes.data?.length || 0);
      setBattleRank(rankRes.data as BattleRank | null);

      if (badgesRes.data) {
        const mapped = badgesRes.data
          .filter((b: any) => b.badges)
          .map((b: any) => ({
            id: b.badges.id,
            name: b.badges.name,
            icon: b.badges.icon,
            category: b.badges.category,
            description: b.badges.description,
          }));
        setEarnedBadges(mapped);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile || !myProfileId) return;
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', myProfileId).eq('following_id', profile.id);
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        toast.success('Unfollowed');
      } else {
        await supabase.from('follows').insert({ follower_id: myProfileId, following_id: profile.id });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success('Following!');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleAddFriend = async () => {
    if (!profile || !myProfileId) return;

    if (friendshipStatus === 'pending_received') {
      // Accept the request
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .or(`and(requester_id.eq.${profile.id},addressee_id.eq.${myProfileId})`);

      if (!error) {
        setFriendshipStatus('accepted');
        setCanMessage(true);
        toast.success('Friend request accepted!');

        await supabase.from('notifications').insert({
          user_id: profile.id,
          type: 'social',
          title: 'Friend Request Accepted',
          message: `accepted your friend request.`,
          data: { profile_id: myProfileId, action: 'friend_accepted' },
        });
      }
      return;
    }

    if (friendshipStatus === 'none') {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: myProfileId, addressee_id: profile.id, status: 'pending' });

      if (error) {
        if (error.code === '23505') {
          toast.error('Friend request already sent');
        } else {
          toast.error('Failed to send request');
        }
        return;
      }

      setFriendshipStatus('pending_sent');
      toast.success('Friend request sent!');

        await supabase.from('notifications').insert({
          user_id: profile.id,
          type: 'social',
          title: 'Friend Request',
          message: `sent you a friend request.`,
          data: { profile_id: myProfileId, action: 'friend_request' },
        });
    }
  };

  const handleSendMessageRequest = async () => {
    if (!profile || !myProfileId) return;
    if (pendingRequestCount >= 3) {
      toast.error('Maximum 3 message requests allowed', { description: 'Wait for them to accept your requests' });
      return;
    }
    try {
      await supabase.from('message_requests').insert({ sender_id: myProfileId, receiver_id: profile.id });
      setPendingRequestCount(prev => prev + 1);
      toast.success('Message request sent!', { description: `${3 - pendingRequestCount - 1} requests remaining` });
    } catch (error: any) {
      if (error.code === '23505') toast.error('Request already sent');
      else toast.error('Failed to send request');
    }
  };

  const handleMessage = () => {
    if (!profile) return;
    if (canMessage) {
      onStartChat?.(profile.user_id);
      onOpenChange(false);
    } else {
      handleSendMessageRequest();
    }
  };

  if (!profile) return null;
  const isMe = user?.id === profile.user_id;
  const rankTier = battleRank ? getRankTier(battleRank.rank_points) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Profile Preview</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 space-y-4">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-xl bg-gradient-accent text-accent-foreground">
                  {profile.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{profile.full_name}</h3>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {rankTier && (
                  <Badge variant="outline" className={cn("mt-1 text-xs", rankTier.color, rankTier.bg)}>
                    <Trophy className="w-3 h-3 mr-1" />
                    {rankTier.name}
                  </Badge>
                )}
              </div>
            </div>

            {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

            {/* Followers/Following */}
            <div className="flex items-center gap-4">
              <button className="text-center hover:opacity-80 transition-opacity">
                <span className="font-bold text-foreground">{followerCount}</span>
                <span className="text-xs text-muted-foreground ml-1">Followers</span>
              </button>
              <button className="text-center hover:opacity-80 transition-opacity">
                <span className="font-bold text-foreground">{followingCount}</span>
                <span className="text-xs text-muted-foreground ml-1">Following</span>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1 text-gold">
                  <Zap className="w-4 h-4" />
                  <span className="font-bold">{profile.xp_points || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">XP Points</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1 text-streak">
                  <Flame className="w-4 h-4" />
                  <span className="font-bold">{profile.current_streak || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>

            {/* Battle Stats */}
            {battleRank && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-primary" />
                  Battle Stats
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-md bg-muted/50 text-center">
                    <span className="font-bold text-sm text-green-500">{battleRank.wins}</span>
                    <p className="text-[10px] text-muted-foreground">Wins</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50 text-center">
                    <span className="font-bold text-sm text-destructive">{battleRank.losses}</span>
                    <p className="text-[10px] text-muted-foreground">Losses</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50 text-center">
                    <span className="font-bold text-sm text-amber-400">{battleRank.best_streak}</span>
                    <p className="text-[10px] text-muted-foreground">Best Streak</p>
                  </div>
                </div>
              </div>
            )}

            {/* Badges */}
            {earnedBadges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" />
                  Badges ({earnedBadges.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {earnedBadges.map((badge) => (
                    <Badge
                      key={badge.id}
                      variant="secondary"
                      className="text-xs gap-1 py-1"
                      title={badge.description || badge.name}
                    >
                      <span>{badge.icon}</span>
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isMe && !loading && (
              <div className="space-y-2 pt-1">
                {/* Follow + Add Friend row */}
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    className={cn("flex-1", !isFollowing && "bg-gradient-accent hover:opacity-90")}
                    onClick={handleFollow}
                    size="sm"
                  >
                    {isFollowing ? <><UserMinus className="w-4 h-4 mr-1" />Unfollow</> : <><UserPlus className="w-4 h-4 mr-1" />Follow</>}
                  </Button>

                  {friendshipStatus === 'accepted' ? (
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <UserCheck className="w-4 h-4 mr-1" />Friends
                    </Button>
                  ) : friendshipStatus === 'pending_sent' ? (
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <Clock className="w-4 h-4 mr-1" />Pending
                    </Button>
                  ) : friendshipStatus === 'pending_received' ? (
                    <Button variant="default" size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleAddFriend}>
                      <UserCheck className="w-4 h-4 mr-1" />Accept
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleAddFriend}>
                      <UserPlus className="w-4 h-4 mr-1" />Add Friend
                    </Button>
                  )}
                </div>

                {/* Message + Call row */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={handleMessage}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {canMessage ? 'Message' : `Request (${3 - pendingRequestCount} left)`}
                  </Button>
                  {canMessage && (
                    <>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { onCall?.(profile.user_id); onOpenChange(false); }}>
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { onVideoCall?.(profile.user_id); onOpenChange(false); }}>
                        <Video className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-destructive"
                  onClick={() => { onReport?.(profile.user_id); onOpenChange(false); }}
                >
                  <Flag className="w-3 h-3 mr-1" />
                  Report User
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePreviewModal;
