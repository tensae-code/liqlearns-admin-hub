import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_info: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const useWithdrawals = () => {
  const { profile } = useProfile();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    fetchRequests();

    const channel = supabase
      .channel('withdrawal-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'withdrawal_requests',
      }, (payload) => {
        const row = payload.new as WithdrawalRequest;
        if (row?.user_id === profile.id) {
          fetchRequests();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const fetchRequests = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setRequests((data as WithdrawalRequest[]) || []);
    setLoading(false);
  };

  const createRequest = async (amount: number, method: string, accountInfo: string) => {
    if (!profile?.id) return { success: false, error: 'Not logged in' };

    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: profile.id,
        amount,
        method,
        account_info: accountInfo,
      });

    if (error) return { success: false, error: error.message };
    
    toast.success('Withdrawal request submitted!');
    fetchRequests();
    return { success: true };
  };

  return { requests, loading, createRequest, refetch: fetchRequests };
};
