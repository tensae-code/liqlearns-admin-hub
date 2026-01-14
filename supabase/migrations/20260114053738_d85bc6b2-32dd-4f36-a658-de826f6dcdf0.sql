-- Add enterprise_status to profiles for teachers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS teacher_type TEXT CHECK (teacher_type IN ('individual', 'enterprise')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS enterprise_status TEXT CHECK (enterprise_status IN ('pending', 'approved', 'rejected')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS enterprise_org_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS enterprise_docs_url TEXT DEFAULT NULL;

-- Create clans table
CREATE TABLE IF NOT EXISTS public.clans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('students', 'enterprise_teacher')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clan_members table
CREATE TABLE IF NOT EXISTS public.clan_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clan_id, user_id)
);

-- Add clan_id to groups (groups can be owned by clans)
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS clan_id UUID REFERENCES public.clans(id) ON DELETE SET NULL;

-- Create call_logs table for showing calls in chat
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID REFERENCES public.profiles(id),
  group_id UUID REFERENCES public.groups(id),
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  status TEXT NOT NULL CHECK (status IN ('missed', 'answered', 'rejected', 'ended')),
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Clan policies
CREATE POLICY "Anyone can view clans" ON public.clans FOR SELECT USING (true);
CREATE POLICY "Clan owners can update their clans" ON public.clans FOR UPDATE USING (
  owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create clans" ON public.clans FOR INSERT WITH CHECK (
  owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Clan owners can delete their clans" ON public.clans FOR DELETE USING (
  owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Clan member policies
CREATE POLICY "Anyone can view clan members" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "Clan leaders can manage members" ON public.clan_members FOR ALL USING (
  clan_id IN (
    SELECT id FROM clans WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Users can join clans" ON public.clan_members FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can leave clans" ON public.clan_members FOR DELETE USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Call log policies
CREATE POLICY "Users can view their call logs" ON public.call_logs FOR SELECT USING (
  caller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR group_id IN (SELECT group_id FROM group_members WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can create call logs" ON public.call_logs FOR INSERT WITH CHECK (
  caller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their call logs" ON public.call_logs FOR UPDATE USING (
  caller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Update timestamp trigger for clans
CREATE TRIGGER update_clans_updated_at
BEFORE UPDATE ON public.clans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();