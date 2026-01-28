import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface ReferralRank {
  id: string;
  name: string;
  level: number;
  min_referrals: number;
  min_earnings: number;
  badge_icon: string;
  badge_color: string;
  bonus_percent: number;
}

interface ReferralStats {
  direct_referrals: number;
  indirect_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  current_rank_id: string | null;
}

interface ReferralSettings {
  level1_percent: number;
  level2_percent: number;
  level2_cap: number;
  min_payout: number;
}

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

interface ReferralReward {
  id: string;
  source_user_id: string;
  reward_type: 'level1' | 'level2';
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  source_user?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useReferralProgram = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [ranks, setRanks] = useState<ReferralRank[]>([]);
  const [currentRank, setCurrentRank] = useState<ReferralRank | null>(null);
  const [nextRank, setNextRank] = useState<ReferralRank | null>(null);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [directReferrals, setDirectReferrals] = useState<DirectReferral[]>([]);
  const [indirectReferrals, setIndirectReferrals] = useState<IndirectReferral[]>([]);
  const [recentRewards, setRecentRewards] = useState<ReferralReward[]>([]);
  const [referralLink, setReferralLink] = useState<string>('');

  useEffect(() => {
    if (profile?.id) {
      fetchAllData();
      setReferralLink(`${window.location.origin}/auth?ref=${profile.username}`);
    }
  }, [profile?.id]);

  const fetchAllData = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      // Fetch all data in parallel
      const [ranksRes, settingsRes, statsRes, directRes, indirectRes, rewardsRes] = await Promise.all([
        supabase.from('referral_ranks').select('*').order('level', { ascending: true }),
        supabase.from('referral_settings').select('*').limit(1).single(),
        supabase.from('referral_stats').select('*').eq('user_id', profile.id).maybeSingle(),
        supabase.rpc('get_direct_referrals', { p_profile_id: profile.id }),
        supabase.rpc('get_indirect_referrals', { p_profile_id: profile.id }),
        supabase.from('referral_rewards').select('*').eq('earner_id', profile.id).order('created_at', { ascending: false }).limit(20)
      ]);

      if (ranksRes.data) {
        setRanks(ranksRes.data);
      }

      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }

      if (statsRes.data) {
        setStats(statsRes.data);
        // Find current and next rank
        if (ranksRes.data) {
          const current = ranksRes.data.find(r => r.id === statsRes.data.current_rank_id);
          setCurrentRank(current || ranksRes.data[0]);
          const nextIdx = ranksRes.data.findIndex(r => r.id === statsRes.data.current_rank_id) + 1;
          setNextRank(ranksRes.data[nextIdx] || null);
        }
      } else {
        // Initialize stats if not exists
        const defaultStats: ReferralStats = {
          direct_referrals: 0,
          indirect_referrals: 0,
          total_earnings: 0,
          pending_earnings: 0,
          paid_earnings: 0,
          current_rank_id: ranksRes.data?.[0]?.id || null
        };
        setStats(defaultStats);
        setCurrentRank(ranksRes.data?.[0] || null);
        setNextRank(ranksRes.data?.[1] || null);

        // Create initial stats record
        await supabase.from('referral_stats').insert({
          user_id: profile.id,
          ...defaultStats
        });
      }

      if (directRes.data) {
        setDirectReferrals(directRes.data as DirectReferral[]);
      }

      if (indirectRes.data) {
        setIndirectReferrals(indirectRes.data as IndirectReferral[]);
      }

      if (rewardsRes.data) {
        // Fetch source user details for rewards
        const sourceUserIds = [...new Set(rewardsRes.data.map(r => r.source_user_id))];
        if (sourceUserIds.length > 0) {
          const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', sourceUserIds);

          const userMap = new Map(users?.map(u => [u.id, u]) || []);
          const enrichedRewards = rewardsRes.data.map(r => ({
            ...r,
            source_user: userMap.get(r.source_user_id)
          }));
          setRecentRewards(enrichedRewards as ReferralReward[]);
        } else {
          setRecentRewards([]);
        }
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      return true;
    } catch {
      return false;
    }
  };

  const getRankProgress = () => {
    if (!stats || !currentRank || !nextRank) return { referralProgress: 100, earningsProgress: 100 };
    
    const referralProgress = Math.min(100, (stats.direct_referrals / nextRank.min_referrals) * 100);
    const earningsProgress = Math.min(100, (stats.paid_earnings / nextRank.min_earnings) * 100);
    
    return { referralProgress, earningsProgress };
  };

  return {
    loading,
    stats,
    ranks,
    currentRank,
    nextRank,
    settings,
    directReferrals,
    indirectReferrals,
    recentRewards,
    referralLink,
    copyReferralLink,
    getRankProgress,
    refetch: fetchAllData
  };
};
