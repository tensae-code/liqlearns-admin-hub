import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  assigned_to?: string;
}

export function useSupportTickets(forSupport: boolean = false) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();

  const fetchTickets = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // If not support staff, only fetch own tickets
      if (!forSupport) {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If support view, fetch user profiles
      let formattedTickets: SupportTicket[] = [];
      
      if (forSupport && data) {
        const userIds = [...new Set(data.map(t => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds);

        const profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, any>);

        formattedTickets = data.map(t => ({
          ...t,
          priority: t.priority as SupportTicket['priority'],
          status: t.status as SupportTicket['status'],
          user: profilesMap[t.user_id],
        }));
      } else {
        formattedTickets = (data || []).map(t => ({
          ...t,
          priority: t.priority as SupportTicket['priority'],
          status: t.status as SupportTicket['status'],
        }));
      }

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, forSupport]);

  useEffect(() => {
    if (profile?.id) {
      fetchTickets();
    }
  }, [profile?.id, fetchTickets]);

  // Real-time subscription for support staff
  useEffect(() => {
    if (!forSupport || !user) return;

    const channel = supabase
      .channel('support-tickets-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [forSupport, user, fetchTickets]);

  const submitTicket = async (
    subject: string,
    description: string,
    category: string = 'general',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    if (!profile?.id) {
      toast.error('Please sign in to submit a ticket');
      return false;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: profile.id,
          subject,
          description,
          category,
          priority,
        });

      if (error) throw error;

      toast.success('Ticket submitted!', {
        description: 'Our support team will get back to you soon.',
      });

      await fetchTickets();
      return true;
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket', { description: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateTicketStatus = async (
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ) => {
    if (!profile?.id) return false;

    try {
      const updateData: Record<string, any> = { status };
      
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_by = profile.id;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status } : t
      ));

      toast.success(`Ticket ${status.replace('_', ' ')}`);
      return true;
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
      return false;
    }
  };

  const startLiveChat = async () => {
    if (!profile?.id) {
      toast.error('Please sign in to start a live chat');
      return null;
    }

    try {
      // Find a support user to DM
      const { data: supportUsers, error: supportError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'support')
        .limit(1);

      if (supportError) throw supportError;

      if (!supportUsers || supportUsers.length === 0) {
        toast.error('No support staff available', {
          description: 'Please submit a ticket instead.',
        });
        return null;
      }

      // Get the support user's profile
      const { data: supportProfile } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('user_id', supportUsers[0].user_id)
        .single();

      if (!supportProfile) {
        toast.error('Could not find support staff');
        return null;
      }

      return supportProfile.user_id;
    } catch (error: any) {
      console.error('Error starting live chat:', error);
      toast.error('Failed to start live chat');
      return null;
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  };

  return {
    tickets,
    loading,
    submitting,
    submitTicket,
    updateTicketStatus,
    startLiveChat,
    stats,
    refresh: fetchTickets,
  };
}
