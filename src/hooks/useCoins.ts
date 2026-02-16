import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface CoinWallet {
  id: string;
  user_id: string;
  balance: number;
  monthly_allocation: number;
  total_earned: number;
  total_spent: number;
  last_monthly_credit: string | null;
}

interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  monthly_coins: number;
  price_etb: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface ConversionRate {
  battle_points_required: number;
  coins_given: number;
}

export const useCoins = () => {
  const { profile } = useProfile();
  const [wallet, setWallet] = useState<CoinWallet | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [conversionRate, setConversionRate] = useState<ConversionRate | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const [walletRes, txRes, tiersRes, rateRes] = await Promise.all([
        supabase.from('coin_wallets').select('*').eq('user_id', profile.id).maybeSingle(),
        supabase.from('coin_transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('subscription_tiers').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('coin_conversion_rates').select('*').eq('is_active', true).limit(1).maybeSingle(),
      ]);

      if (walletRes.data) setWallet(walletRes.data as any);
      else {
        // Create wallet
        const { data } = await supabase.from('coin_wallets').insert({ user_id: profile.id }).select().single();
        if (data) setWallet(data as any);
      }

      if (txRes.data) setTransactions(txRes.data as any);
      if (tiersRes.data) setTiers(tiersRes.data.map((t: any) => ({ ...t, features: Array.isArray(t.features) ? t.features : [] })));
      if (rateRes.data) setConversionRate(rateRes.data as any);
    } catch (err) {
      console.error('Error fetching coin data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const convertBattlePoints = useCallback(async (battlePoints: number) => {
    if (!profile?.id) return { success: false, error: 'Not logged in' };
    try {
      const { data, error } = await supabase.rpc('convert_battle_points_to_coins', {
        p_user_id: profile.id,
        p_battle_points: battlePoints,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) return { success: false, error: result.error };
      toast.success(`Converted ${result.bp_spent} BP → ${result.coins_earned} coins!`);
      await fetchAll();
      return { success: true, coins: result.coins_earned };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [profile?.id, fetchAll]);

  const spendCoins = useCallback(async (amount: number, type: string, description: string, referenceId?: string) => {
    if (!profile?.id || !wallet) return { success: false, error: 'Wallet not loaded' };
    if (wallet.balance < amount) return { success: false, error: 'Insufficient coins' };

    try {
      await supabase.from('coin_wallets').update({
        balance: wallet.balance - amount,
        total_spent: wallet.total_spent + amount,
        updated_at: new Date().toISOString(),
      }).eq('user_id', profile.id);

      await supabase.from('coin_transactions').insert({
        user_id: profile.id,
        amount: -amount,
        transaction_type: type,
        description,
        reference_id: referenceId || null,
      });

      setWallet(prev => prev ? { ...prev, balance: prev.balance - amount, total_spent: prev.total_spent + amount } : null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [profile?.id, wallet]);

  return {
    wallet,
    transactions,
    tiers,
    conversionRate,
    loading,
    balance: wallet?.balance || 0,
    convertBattlePoints,
    spendCoins,
    refresh: fetchAll,
  };
};
