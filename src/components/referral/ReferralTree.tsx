import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    <div className="relative">
      {/* Root node (You) */}
      <div className="flex flex-col items-center mb-4 md:mb-6">
        <div className="relative">
          <Avatar className="w-12 h-12 md:w-14 md:h-14 ring-4 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-base md:text-lg">{profile?.full_name?.[0] || 'Y'}</AvatarFallback>
          </Avatar>
          <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] px-1.5">You</Badge>
        </div>
        <p className="mt-2 font-medium text-xs md:text-sm">{profile?.full_name}</p>
        <p className="text-[10px] md:text-xs text-muted-foreground">@{profile?.username}</p>
      </div>

      {/* Connection line */}
      {directReferrals.length > 0 && (
        <div className="absolute top-16 md:top-20 left-1/2 w-0.5 h-6 md:h-8 bg-border -translate-x-1/2" />
      )}

      {/* Level 1 - Direct Referrals */}
      {directReferrals.length > 0 && (
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
            <span className="text-xs md:text-sm font-medium text-blue-500">Level 1 ({directReferrals.length})</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {directReferrals.map((ref, idx) => {
              const hasChildren = groupedIndirect[ref.full_name]?.length > 0;
              const isPaid = ref.subscription_status === 'active';
              
              return (
                <div key={ref.id} className={`flex flex-col items-center relative ${!isPaid ? 'opacity-50 grayscale' : ''}`}>
                  {/* Horizontal connector from parent */}
                  {idx === 0 && directReferrals.length > 1 && (
                    <div className="absolute -top-3 md:-top-4 left-1/2 right-0 h-0.5 bg-border" 
                         style={{ width: `calc(${(directReferrals.length - 1) * 100}% + ${(directReferrals.length - 1) * 8}px)` }} />
                  )}
                  
                  <div className="relative">
                    <Avatar className={`w-9 h-9 md:w-12 md:h-12 ring-2 ${isPaid ? 'ring-blue-500/20' : 'ring-muted-foreground/20'}`}>
                      <AvatarImage src={ref.avatar_url || ''} />
                      <AvatarFallback className="text-xs md:text-sm">{ref.full_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    {isPaid ? (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 ring-2 ring-background" />
                    ) : (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-muted-foreground ring-2 ring-background" />
                    )}
                  </div>
                  <p className="mt-1.5 md:mt-2 text-[10px] md:text-sm font-medium text-center max-w-[60px] md:max-w-[80px] truncate">{ref.full_name}</p>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground">@{ref.username}</p>
                  {!isPaid && (
                    <Badge variant="outline" className="mt-0.5 md:mt-1 text-[8px] md:text-[10px] text-muted-foreground px-1">
                      Unpaid
                    </Badge>
                  )}
                  
                  {/* Show children count */}
                  {hasChildren && (
                    <Badge variant="outline" className="mt-0.5 md:mt-1 text-[8px] md:text-[10px] px-1">
                      {groupedIndirect[ref.full_name].length} refs
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
          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            <GitBranch className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
            <span className="text-xs md:text-sm font-medium text-purple-500">Level 2 ({indirectReferrals.length})</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {indirectReferrals.map(ref => {
              const isPaid = ref.subscription_status === 'active';
              return (
                <div key={ref.id} className={`flex flex-col items-center p-1.5 md:p-2 rounded-lg bg-muted/50 ${!isPaid ? 'opacity-50 grayscale' : ''}`}>
                  <Avatar className={`w-8 h-8 md:w-10 md:h-10 ring-2 ${isPaid ? 'ring-purple-500/20' : 'ring-muted-foreground/20'}`}>
                    <AvatarImage src={ref.avatar_url || ''} />
                    <AvatarFallback className="text-[10px] md:text-xs">{ref.full_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <p className="mt-1 text-[10px] md:text-xs font-medium text-center max-w-[55px] md:max-w-[70px] truncate">{ref.full_name}</p>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground">via {ref.referred_by_name?.split(' ')[0]}</p>
                  {!isPaid && (
                    <Badge variant="outline" className="mt-0.5 md:mt-1 text-[6px] md:text-[8px] text-muted-foreground px-1">
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
        <div className="text-center py-4 md:py-6 text-muted-foreground">
          <Users className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs md:text-sm">Your network is empty</p>
          <p className="text-[10px] md:text-xs">Share your referral link to start building your team!</p>
        </div>
      )}
    </div>
  );
};

export default ReferralTree;
