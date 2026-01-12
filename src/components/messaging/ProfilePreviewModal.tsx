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
  MapPin, 
  Phone,
  Video,
  Flag,
  Check,
  X,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [canMessage, setCanMessage] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (open && profile && user) {
      fetchProfileData();
    }
  }, [open, profile, user]);

  const fetchProfileData = async () => {
    if (!profile || !user) return;

    try {
      setLoading(true);

      // Get my profile ID
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (myProfile) {
        setMyProfileId(myProfile.id);

        // Check if following
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', myProfile.id)
          .eq('following_id', profile.id)
          .single();

        setIsFollowing(!!followData);

        // Check if can message (friend or accepted request)
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('id')
          .eq('status', 'accepted')
          .or(`and(requester_id.eq.${myProfile.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${myProfile.id})`)
          .single();

        const isFriend = !!friendshipData;

        const { data: requestData } = await supabase
          .from('message_requests')
          .select('id, status')
          .eq('status', 'accepted')
          .or(`and(sender_id.eq.${myProfile.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${myProfile.id})`)
          .single();

        const hasAcceptedRequest = !!requestData;
        setCanMessage(isFriend || hasAcceptedRequest);

        // Get pending request count from me to them
        const { data: pendingData } = await supabase
          .from('message_requests')
          .select('id')
          .eq('sender_id', myProfile.id)
          .eq('receiver_id', profile.id)
          .eq('status', 'pending');

        setPendingRequestCount(pendingData?.length || 0);
      }

      // Get follower/following counts
      const { data: followers } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', profile.id);

      const { data: following } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', profile.id);

      setFollowerCount(followers?.length || 0);
      setFollowingCount(following?.length || 0);
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
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', myProfileId)
          .eq('following_id', profile.id);

        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        toast.success('Unfollowed');
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: myProfileId,
            following_id: profile.id,
          });

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success('Following!');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleSendMessageRequest = async () => {
    if (!profile || !myProfileId) return;

    if (pendingRequestCount >= 3) {
      toast.error('Maximum 3 message requests allowed', {
        description: 'Wait for them to accept your requests',
      });
      return;
    }

    try {
      await supabase
        .from('message_requests')
        .insert({
          sender_id: myProfileId,
          receiver_id: profile.id,
        });

      setPendingRequestCount(prev => prev + 1);
      toast.success('Message request sent!', {
        description: `${3 - pendingRequestCount - 1} requests remaining`,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Request already sent');
      } else {
        toast.error('Failed to send request');
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Profile Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl bg-gradient-accent text-accent-foreground">
                {profile.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{profile.full_name}</h3>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}

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

          {/* Actions */}
          {!isMe && !loading && (
            <div className="space-y-2">
              {/* Follow Button */}
              <Button
                variant={isFollowing ? "outline" : "default"}
                className={cn(
                  "w-full",
                  !isFollowing && "bg-gradient-accent hover:opacity-90"
                )}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>

              {/* Message Button */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleMessage}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {canMessage 
                    ? 'Message' 
                    : `Request (${3 - pendingRequestCount} left)`
                  }
                </Button>

                {canMessage && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        onCall?.(profile.user_id);
                        onOpenChange(false);
                      }}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        onVideoCall?.(profile.user_id);
                        onOpenChange(false);
                      }}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Report */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onReport?.(profile.user_id);
                  onOpenChange(false);
                }}
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
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePreviewModal;
