import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  note: string | null;
  transaction_type: string;
  status: string;
  sender_prev_balance: number | null;
  sender_new_balance: number | null;
  receiver_prev_balance: number | null;
  receiver_new_balance: number | null;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchWallet = async () => {
      setLoading(true);
      try {
        // Fetch wallet
        let { data: walletData, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', profile.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Wallet doesn't exist, create one
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({ user_id: profile.id, balance: 0 })
            .select()
            .single();

          if (createError) throw createError;
          walletData = newWallet;
        } else if (error) {
          throw error;
        }

        setWallet(walletData);

        // Fetch recent transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (txData) setTransactions(txData);
      } catch (err) {
        console.error('Error fetching wallet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();

    // Subscribe to wallet changes
    const walletChannel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setWallet(payload.new as Wallet);
          }
        }
      )
      .subscribe();

    // Subscribe to transaction changes
    const txChannel = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          const newTx = payload.new as Transaction;
          if (newTx.sender_id === profile.id || newTx.receiver_id === profile.id) {
            setTransactions((prev) => [newTx, ...prev]);
            // Refetch wallet to get updated balance
            fetchWallet();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(txChannel);
    };
  }, [profile?.id]);

  const sendMoney = async (
    receiverId: string,
    receiverName: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.id || !wallet) {
      return { success: false, error: 'Wallet not loaded' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    if (amount > wallet.balance) {
      return { success: false, error: 'Insufficient balance' };
    }

    if (receiverId === profile.id) {
      return { success: false, error: 'Cannot send money to yourself' };
    }

    try {
      // Get receiver's wallet
      const { data: receiverWallet, error: receiverError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', receiverId)
        .single();

      if (receiverError) {
        // Create wallet for receiver if it doesn't exist
        const { data: newReceiverWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: receiverId, balance: 0 })
          .select()
          .single();

        if (createError) throw createError;
      }

      const receiverCurrentBalance = receiverWallet?.balance || 0;
      const senderPrevBalance = wallet.balance;
      const senderNewBalance = senderPrevBalance - amount;
      const receiverNewBalance = receiverCurrentBalance + amount;

      // Update sender's wallet
      const { error: senderUpdateError } = await supabase
        .from('wallets')
        .update({
          balance: senderNewBalance,
          total_spent: (wallet.total_spent || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.id);

      if (senderUpdateError) throw senderUpdateError;

      // Update receiver's wallet
      const { error: receiverUpdateError } = await supabase
        .from('wallets')
        .update({
          balance: receiverNewBalance,
          total_earned: (receiverWallet?.total_earned || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', receiverId);

      if (receiverUpdateError) throw receiverUpdateError;

      // Create transaction record
      const { error: txError } = await supabase.from('transactions').insert({
        sender_id: profile.id,
        receiver_id: receiverId,
        amount,
        note,
        transaction_type: 'transfer',
        status: 'completed',
        sender_prev_balance: senderPrevBalance,
        sender_new_balance: senderNewBalance,
        receiver_prev_balance: receiverCurrentBalance,
        receiver_new_balance: receiverNewBalance,
      });

      if (txError) throw txError;

      // Create notification for sender
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'transaction',
        title: 'Money Sent',
        message: `You sent ${amount.toLocaleString()} ETB to ${receiverName}. Your new balance is ${senderNewBalance.toLocaleString()} ETB.`,
        data: { amount, receiver_id: receiverId, receiver_name: receiverName },
      });

      // Create notification for receiver
      await supabase.from('notifications').insert({
        user_id: receiverId,
        type: 'transaction',
        title: 'Money Received',
        message: `You received ${amount.toLocaleString()} ETB from ${profile.full_name || 'Someone'}. Your new balance is ${receiverNewBalance.toLocaleString()} ETB.`,
        data: { amount, sender_id: profile.id, sender_name: profile.full_name },
      });

      // Update local state
      setWallet((prev) =>
        prev
          ? {
              ...prev,
              balance: senderNewBalance,
              total_spent: (prev.total_spent || 0) + amount,
            }
          : null
      );

      return { success: true };
    } catch (err: any) {
      console.error('Send money error:', err);
      return { success: false, error: err.message || 'Failed to send money' };
    }
  };

  const topUp = async (amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.id || !wallet) {
      return { success: false, error: 'Wallet not loaded' };
    }

    try {
      const newBalance = wallet.balance + amount;
      const { error } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          total_earned: (wallet.total_earned || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.id);

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'transaction',
        title: 'Top Up Successful',
        message: `Your wallet has been topped up with ${amount.toLocaleString()} ETB. New balance: ${newBalance.toLocaleString()} ETB.`,
        data: { amount, type: 'top_up' },
      });

      setWallet((prev) =>
        prev
          ? {
              ...prev,
              balance: newBalance,
              total_earned: (prev.total_earned || 0) + amount,
            }
          : null
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    wallet,
    transactions,
    loading,
    sendMoney,
    topUp,
    balance: wallet?.balance || 0,
    pendingBalance: wallet?.pending_balance || 0,
    totalEarned: wallet?.total_earned || 0,
  };
};
