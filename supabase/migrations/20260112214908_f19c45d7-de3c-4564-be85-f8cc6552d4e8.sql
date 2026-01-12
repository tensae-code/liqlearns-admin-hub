-- Create study_sessions table to track time spent in study rooms
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_study_stats table to aggregate daily study time
CREATE TABLE public.daily_study_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  streak_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, study_date)
);

-- Enable RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_study_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_sessions
CREATE POLICY "Users can view their own study sessions" 
ON public.study_sessions 
FOR SELECT 
USING (auth.uid()::text = (SELECT user_id::text FROM profiles WHERE id = study_sessions.user_id));

CREATE POLICY "Users can insert their own study sessions" 
ON public.study_sessions 
FOR INSERT 
WITH CHECK (auth.uid()::text = (SELECT user_id::text FROM profiles WHERE id = study_sessions.user_id));

CREATE POLICY "Users can update their own study sessions" 
ON public.study_sessions 
FOR UPDATE 
USING (auth.uid()::text = (SELECT user_id::text FROM profiles WHERE id = study_sessions.user_id));

-- RLS policies for daily_study_stats
CREATE POLICY "Users can view their own daily stats" 
ON public.daily_study_stats 
FOR SELECT 
USING (auth.uid()::text = (SELECT user_id::text FROM profiles WHERE id = daily_study_stats.user_id));

CREATE POLICY "Users can insert their own daily stats" 
ON public.daily_study_stats 
FOR INSERT 
WITH CHECK (auth.uid()::text = (SELECT user_id::text FROM profiles WHERE id = daily_study_stats.user_id));

CREATE POLICY "Users can update their own daily stats" 
ON public.daily_study_stats 
FOR UPDATE 
USING (auth.uid()::text = (SELECT user_id::text FROM profiles WHERE id = daily_study_stats.user_id));

-- Function to update daily stats when a session ends
CREATE OR REPLACE FUNCTION public.update_daily_study_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when session ends (ended_at is set)
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    -- Calculate duration
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
    
    -- Upsert daily stats
    INSERT INTO public.daily_study_stats (user_id, study_date, total_seconds, sessions_count, streak_eligible)
    VALUES (
      NEW.user_id, 
      NEW.session_date, 
      NEW.duration_seconds, 
      1,
      NEW.duration_seconds >= 1800 -- 30 minutes = 1800 seconds
    )
    ON CONFLICT (user_id, study_date) DO UPDATE SET
      total_seconds = daily_study_stats.total_seconds + NEW.duration_seconds,
      sessions_count = daily_study_stats.sessions_count + 1,
      streak_eligible = (daily_study_stats.total_seconds + NEW.duration_seconds) >= 1800,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update stats when session ends
CREATE TRIGGER update_stats_on_session_end
BEFORE UPDATE ON public.study_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_study_stats();

-- Create indexes for performance
CREATE INDEX idx_study_sessions_user_date ON public.study_sessions(user_id, session_date);
CREATE INDEX idx_daily_study_stats_user_date ON public.daily_study_stats(user_id, study_date);