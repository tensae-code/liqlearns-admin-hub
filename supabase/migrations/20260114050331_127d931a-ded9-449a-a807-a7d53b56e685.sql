-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT NOT NULL DEFAULT 'general',
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can create their own tickets
CREATE POLICY "Users can create tickets" ON public.support_tickets
FOR INSERT WITH CHECK (
  user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
FOR SELECT USING (
  user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- Support staff can view all tickets
CREATE POLICY "Support can view all tickets" ON public.support_tickets
FOR SELECT USING (
  has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo')
);

-- Support staff can update tickets
CREATE POLICY "Support can update tickets" ON public.support_tickets
FOR UPDATE USING (
  has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo')
);

-- Add trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for support tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;