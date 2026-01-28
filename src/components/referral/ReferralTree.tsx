import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { Users, GitBranch } from 'lucide-react';

interface DirectReferral {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  subscription_status: string | null;
}

interface IndirectReferral extends DirectReferral {
  referred_by_name: string;
}

interface ReferralTreeProps {
  directReferrals: DirectReferral[];
  indirectReferrals: IndirectReferral[];
}

const ReferralTree = ({ directReferrals, indirectReferrals }: ReferralTreeProps) => {
  const { profile } = useProfile();

  // Group indirect referrals by who referred them
  const groupedIndirect = indirectReferrals.reduce((acc, ref) => {
    if (!acc[ref.referred_by_name]) {
      acc[ref.referred_by_name] = [];
    }
    acc[ref.referred_by_name].push(ref);
    return acc;
  }, {} as Record<string, IndirectReferral[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Your Referral Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Root node (You) */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-lg">{profile?.full_name?.[0] || 'Y'}</AvatarFallback>
              </Avatar>
              <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px]">You</Badge>
            </div>
            <p className="mt-3 font-medium">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground">@{profile?.username}</p>
          </div>

          {/* Connection line */}
          {directReferrals.length > 0 && (
            <div className="absolute top-20 left-1/2 w-0.5 h-8 bg-border -translate-x-1/2" />
          )}

          {/* Level 1 - Direct Referrals */}
          {directReferrals.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-500">Level 1 ({directReferrals.length})</span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4">
                {directReferrals.map((ref, idx) => {
                  const hasChildren = groupedIndirect[ref.full_name]?.length > 0;
                  const isPaid = ref.subscription_status === 'active';
                  
                  return (
                    <div key={ref.id} className={`flex flex-col items-center relative ${!isPaid ? 'opacity-50 grayscale' : ''}`}>
                      {/* Horizontal connector from parent */}
                      {idx === 0 && directReferrals.length > 1 && (
                        <div className="absolute -top-4 left-1/2 right-0 h-0.5 bg-border" 
                             style={{ width: `calc(${(directReferrals.length - 1) * 100}% + ${(directReferrals.length - 1) * 16}px)` }} />
                      )}
                      
                      <div className="relative">
                        <Avatar className={`w-12 h-12 ring-2 ${isPaid ? 'ring-blue-500/20' : 'ring-muted-foreground/20'}`}>
                          <AvatarImage src={ref.avatar_url || ''} />
                          <AvatarFallback>{ref.full_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        {isPaid ? (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-background" />
                        ) : (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-muted-foreground ring-2 ring-background" />
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-center max-w-[80px] truncate">{ref.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">@{ref.username}</p>
                      {!isPaid && (
                        <Badge variant="outline" className="mt-1 text-[10px] text-muted-foreground">
                          Unpaid
                        </Badge>
                      )}
                      
                      {/* Show children count */}
                      {hasChildren && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {groupedIndirect[ref.full_name].length} referrals
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Level 2 - Indirect Referrals */}
          {indirectReferrals.length > 0 && (
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <GitBranch className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-500">Level 2 ({indirectReferrals.length})</span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                {indirectReferrals.map(ref => {
                  const isPaid = ref.subscription_status === 'active';
                  return (
                    <div key={ref.id} className={`flex flex-col items-center p-2 rounded-lg bg-muted/50 ${!isPaid ? 'opacity-50 grayscale' : ''}`}>
                      <Avatar className={`w-10 h-10 ring-2 ${isPaid ? 'ring-purple-500/20' : 'ring-muted-foreground/20'}`}>
                        <AvatarImage src={ref.avatar_url || ''} />
                        <AvatarFallback className="text-xs">{ref.full_name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <p className="mt-1 text-xs font-medium text-center max-w-[70px] truncate">{ref.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">via {ref.referred_by_name?.split(' ')[0]}</p>
                      {!isPaid && (
                        <Badge variant="outline" className="mt-1 text-[8px] text-muted-foreground">
                          Unpaid
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {directReferrals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Your network is empty</p>
              <p className="text-sm">Share your referral link to start building your team!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralTree;
